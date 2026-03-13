'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { HiSearch } from 'react-icons/hi'
import { useDispatch, useSelector } from 'react-redux'

import VideoCard from '@/common/shared/video-card/VideoCard'
import Button from '@/common/shared/button/Button'
import { useTranslate } from '@/utils/translating/translating'

import { createMyPlaylist, addToMyPlaylists } from '@/store/my-playlists/my-playlists-operations'
import { getMyPlaylistsLoading } from '@/store/my-playlists/my-playlists-selectors'
import { getLogin, getUser } from '@/store/auth/auth-selectors'

function cleanQ(v) {
  return String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizePlaylistTitle(v) {
  return cleanQ(v).toLowerCase()
}

export default function SearchVideosSection({ qFromUrl, items, loading, contextMatches }) {
  const dispatch = useDispatch()

  const isLoggedIn = useSelector(getLogin)
  const user = useSelector(getUser)
  const myPlaylistsLoading = useSelector(getMyPlaylistsLoading)

  const playlistSuggestRef = useRef(null)

  const tCreateMyPlaylist = useTranslate('Create my playlist')
  const tAddToExistingPlaylist = useTranslate('Add to existing playlist')
  const tEnterPlaylistTitle = useTranslate('Enter playlist title')
  const tSelectPlaylist = useTranslate('Select playlist')
  const tNoPlaylistsYet = useTranslate('You do not have playlists yet')
  const tSelectVideosBelow = useTranslate('Select videos below to create a playlist')
  const tVideoSelected = useTranslate('video selected')
  const tVideosSelected = useTranslate('videos selected')
  const tCreatePlaylist = useTranslate('Create playlist')
  const tUpdatePlaylist = useTranslate('Update playlist')
  const tNoVideosFound = useTranslate('No videos found')
  const tLoginToManagePlaylists = useTranslate(
    'Log in to create playlists and add videos to your playlists'
  )
  const tPlaylistNameAvailable = useTranslate('Playlist name available')
  const tPlaylistNameTaken = useTranslate('Playlist name already exists')
  const tNoMatchingPlaylists = useTranslate('No matching playlists')
  const tClose = useTranslate('Close')
  const tVideos = useTranslate('videos')
  const tVideo = useTranslate('video')

  const [playlistMode, setPlaylistMode] = useState('create')
  const [playlistTitle, setPlaylistTitle] = useState(() => qFromUrl)
  const [selectedExistingPlaylistId, setSelectedExistingPlaylistId] = useState('')
  const [selectedVideoIds, setSelectedVideoIds] = useState([])
  const [playlistSearch, setPlaylistSearch] = useState('')
  const [isPlaylistSuggestOpen, setIsPlaylistSuggestOpen] = useState(false)

  const userPlaylistsMeta = useMemo(() => {
    return Array.isArray(user?.myPlaylists) ? user.myPlaylists : []
  }, [user])

  const hasUserPlaylists = userPlaylistsMeta.length > 0

  const existingPlaylistTitles = useMemo(() => {
    return new Set(
      userPlaylistsMeta.map((it) => normalizePlaylistTitle(it?.title || '')).filter(Boolean)
    )
  }, [userPlaylistsMeta])

  const playlistMembershipByVideoId = useMemo(() => {
    const map = new Map()

    userPlaylistsMeta.forEach((playlist) => {
      const playlistId = String(playlist?.playlistId || '')
      const playlistTitle = String(playlist?.title || '').trim()
      const videoIds = Array.isArray(playlist?.videoIds) ? playlist.videoIds : []

      if (!playlistId || !playlistTitle) return

      videoIds.forEach((videoIdRaw) => {
        const videoId = String(videoIdRaw || '').trim()
        if (!videoId) return

        const prev = map.get(videoId) || []
        prev.push({ playlistId, title: playlistTitle })
        map.set(videoId, prev)
      })
    })

    return map
  }, [userPlaylistsMeta])

  const normalizedPlaylistTitle = useMemo(
    () => normalizePlaylistTitle(playlistTitle),
    [playlistTitle]
  )

  const titleTaken = useMemo(() => {
    if (!isLoggedIn) return false
    if (playlistMode !== 'create') return false
    if (normalizedPlaylistTitle.length < 2) return false
    return existingPlaylistTitles.has(normalizedPlaylistTitle)
  }, [isLoggedIn, playlistMode, normalizedPlaylistTitle, existingPlaylistTitles])

  const titleHint = useMemo(() => {
    if (playlistMode !== 'create') return ''
    if (normalizedPlaylistTitle.length < 2) return ''
    return titleTaken ? tPlaylistNameTaken : tPlaylistNameAvailable
  }, [
    playlistMode,
    normalizedPlaylistTitle,
    titleTaken,
    tPlaylistNameTaken,
    tPlaylistNameAvailable,
  ])

  const filteredPlaylists = useMemo(() => {
    const q = cleanQ(playlistSearch).toLowerCase()

    if (!q) return userPlaylistsMeta

    return userPlaylistsMeta.filter((playlist) =>
      String(playlist?.title || '')
        .trim()
        .toLowerCase()
        .includes(q)
    )
  }, [userPlaylistsMeta, playlistSearch])

  const selectedCount = selectedVideoIds.length

  const canSubmit = useMemo(() => {
    if (!isLoggedIn) return false
    if (selectedCount === 0) return false

    if (playlistMode === 'create') {
      return cleanQ(playlistTitle).length >= 2 && !titleTaken
    }

    return !!selectedExistingPlaylistId
  }, [
    isLoggedIn,
    selectedCount,
    playlistMode,
    playlistTitle,
    selectedExistingPlaylistId,
    titleTaken,
  ])

  const playlistHint = useMemo(() => {
    if (selectedCount > 0) {
      return `${selectedCount} ${selectedCount === 1 ? tVideoSelected : tVideosSelected}`
    }
    return tSelectVideosBelow
  }, [selectedCount, tVideoSelected, tVideosSelected, tSelectVideosBelow])

  useEffect(() => {
    setPlaylistTitle(qFromUrl)
  }, [qFromUrl])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (playlistSuggestRef.current && !playlistSuggestRef.current.contains(event.target)) {
        setIsPlaylistSuggestOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleToggleSelectVideo = useCallback(
    (videoId) => {
      if (!isLoggedIn) return

      const id = String(videoId || '').trim()
      if (!id) return

      setSelectedVideoIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      )
    },
    [isLoggedIn]
  )

  const handleChangeMode = useCallback(
    (mode) => {
      if (mode === 'existing' && !hasUserPlaylists) return

      setPlaylistMode(mode)
      setIsPlaylistSuggestOpen(false)

      if (mode === 'create') {
        setSelectedExistingPlaylistId('')
        setPlaylistSearch('')
      }
    },
    [hasUserPlaylists]
  )

  const handlePickPlaylist = useCallback((playlist) => {
    const id = String(playlist?.playlistId || '').trim()
    const title = String(playlist?.title || '').trim()

    if (!id || !title) return

    setSelectedExistingPlaylistId(id)
    setPlaylistSearch(title)
    setIsPlaylistSuggestOpen(false)
  }, [])

  const handleSubmitPlaylistAction = useCallback(async () => {
    if (!isLoggedIn) return
    if (selectedVideoIds.length === 0) return

    if (playlistMode === 'create') {
      if (titleTaken) return

      const payload = {
        title: cleanQ(playlistTitle),
        videoIds: selectedVideoIds,
        sourceQuery: qFromUrl,
      }

      await dispatch(createMyPlaylist(payload)).unwrap()

      setSelectedVideoIds([])
      setPlaylistTitle(qFromUrl)
      return
    }

    const payload = {
      playlistId: selectedExistingPlaylistId,
      videoIds: selectedVideoIds,
    }

    await dispatch(addToMyPlaylists(payload)).unwrap()
    setSelectedVideoIds([])
  }, [
    dispatch,
    isLoggedIn,
    playlistMode,
    playlistTitle,
    selectedExistingPlaylistId,
    selectedVideoIds,
    qFromUrl,
    titleTaken,
  ])

  return (
    <>
      {isLoggedIn ? (
        <section className="search-page__playlist-panel">
          <div className="search-page__playlist-modes">
            <label className="search-page__radio">
              <input
                type="radio"
                name="playlistMode"
                checked={playlistMode === 'create'}
                onChange={() => handleChangeMode('create')}
              />
              <span>{tCreateMyPlaylist}</span>
            </label>

            <label
              className={`search-page__radio ${!hasUserPlaylists ? 'is-disabled' : ''}`}
              title={!hasUserPlaylists ? tNoPlaylistsYet : ''}
            >
              <input
                type="radio"
                name="playlistMode"
                checked={playlistMode === 'existing'}
                onChange={() => handleChangeMode('existing')}
                disabled={!hasUserPlaylists}
              />
              <span>{tAddToExistingPlaylist}</span>
            </label>
          </div>

          <div className="search-page__playlist-head">
            <div className="search-page__playlist-input">
              <div
                className={`search-page__mode-pane ${playlistMode === 'create' ? '' : 'is-hidden'}`}
              >
                <div className="search-page__playlist-create">
                  <input
                    className="search-page__playlist-create-input"
                    value={playlistTitle}
                    onChange={(e) => setPlaylistTitle(e.target.value)}
                    placeholder={tEnterPlaylistTitle}
                    autoComplete="off"
                  />
                </div>

                <div className="search-page__title-hint" aria-live="polite">
                  {titleHint ? (
                    <span
                      className={
                        titleTaken ? 'search-page__title-hint-bad' : 'search-page__title-hint-ok'
                      }
                    >
                      {titleHint}
                    </span>
                  ) : null}
                </div>

                <div className="search-page__playlist-note">{playlistHint}</div>
              </div>

              <div
                className={`search-page__mode-pane ${
                  playlistMode === 'existing' ? '' : 'is-hidden'
                }`}
              >
                <div className="search-page__select-group">
                  <div className="search-page__playlist-picker" ref={playlistSuggestRef}>
                    <div className="search-page__playlist-search">
                      <button
                        type="button"
                        className="search-page__playlist-search-btn"
                        onClick={() => setIsPlaylistSuggestOpen(true)}
                        aria-label={tSelectPlaylist}
                      >
                        <HiSearch className="search-page__playlist-search-icon" />
                      </button>

                      <input
                        className="search-page__playlist-search-input"
                        value={playlistSearch}
                        onChange={(e) => {
                          setPlaylistSearch(e.target.value)
                          setSelectedExistingPlaylistId('')
                          setIsPlaylistSuggestOpen(true)
                        }}
                        onFocus={() => setIsPlaylistSuggestOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsPlaylistSuggestOpen(false)
                          }
                        }}
                        placeholder={hasUserPlaylists ? tSelectPlaylist : tNoPlaylistsYet}
                        autoComplete="off"
                      />
                    </div>

                    {isPlaylistSuggestOpen && (
                      <div className="search-page__playlist-suggest">
                        {filteredPlaylists.length === 0 ? (
                          <div className="search-page__playlist-suggest-hint">
                            {cleanQ(playlistSearch) ? tNoMatchingPlaylists : tNoPlaylistsYet}
                          </div>
                        ) : (
                          <div className="search-page__playlist-suggest-list">
                            {filteredPlaylists.map((playlist) => {
                              const id = String(playlist?.playlistId || '').trim()
                              const metaTitle = String(playlist?.title || '').trim()
                              const count = Array.isArray(playlist?.videoIds)
                                ? playlist.videoIds.length
                                : 0

                              if (!id || !metaTitle) return null

                              return (
                                <button
                                  key={id}
                                  type="button"
                                  className={`search-page__playlist-suggest-item ${
                                    selectedExistingPlaylistId === id ? 'is-active' : ''
                                  }`}
                                  onClick={() => handlePickPlaylist(playlist)}
                                  title={metaTitle}
                                >
                                  <div className="search-page__playlist-suggest-meta">
                                    <div className="search-page__playlist-suggest-title">
                                      {metaTitle}
                                    </div>
                                    <div className="search-page__playlist-suggest-sub">
                                      {count} {count === 1 ? tVideo : tVideos}
                                    </div>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                        )}

                        <button
                          type="button"
                          className="search-page__playlist-suggest-close"
                          onClick={() => setIsPlaylistSuggestOpen(false)}
                        >
                          {tClose}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="search-page__playlist-note">{playlistHint}</div>
                </div>
              </div>
            </div>

            <div className="search-page__playlist-action">
              <Button
                variant="primary"
                height="40px"
                disabled={!canSubmit}
                isLoading={myPlaylistsLoading}
                onClick={handleSubmitPlaylistAction}
              >
                {playlistMode === 'create' ? tCreatePlaylist : tUpdatePlaylist}
              </Button>
            </div>
          </div>
        </section>
      ) : (
        <section className="search-page__auth-note">{tLoginToManagePlaylists}</section>
      )}

      <section className="search-page__results">
        <div className="video-grid">
          {items?.length ? (
            items.map((video) => {
              const videoId = String(video?._id || '')
              const memberships = playlistMembershipByVideoId.get(videoId) || []

              return (
                <VideoCard
                  key={video._id}
                  video={video}
                  mode={isLoggedIn ? 'search' : 'default'}
                  selectable={isLoggedIn}
                  selected={selectedVideoIds.includes(videoId)}
                  onToggleSelect={handleToggleSelectVideo}
                  playlistMemberships={memberships}
                />
              )
            })
          ) : !loading && contextMatches ? (
            <div className="search-page__empty">{tNoVideosFound}</div>
          ) : null}
        </div>
      </section>
    </>
  )
}

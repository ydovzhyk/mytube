'use client'

import { useState } from 'react'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi'
import { FaPlay } from 'react-icons/fa'

import MiniVideoCard from '../mini-video-card/MiniVideoCard'
import T from '@/common/shared/i18n/T'

function formatDate(date) {
  try {
    return new Date(date).toLocaleDateString()
  } catch {
    return ''
  }
}

function PlaylistDescription({ text = '', limit = 50 }) {
  const [expanded, setExpanded] = useState(false)

  const description = String(text || '').trim()
  const hasDescription = Boolean(description)
  const showToggle = hasDescription && description.length > limit

  let shortText = ''
  if (hasDescription) {
    shortText = description.length <= limit ? description : description.slice(0, limit).trim() + '…'
  }

  if (!hasDescription) return null

  return (
    <div className="playlists-card__description">
      <div className="playlists-card__descriptionText">{expanded ? description : shortText}</div>

      {showToggle ? (
        <button
          type="button"
          className="playlists-card__more"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <T caseMode="lower">less</T> : <T caseMode="lower">more</T>}
        </button>
      ) : null}
    </div>
  )
}

export default function PlaylistsCard({
  playlist,
  type = 'playlist', // 'playlist' | 'myPlaylist'
  previewVideos = [],
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)

  if (!playlist) return null

  const title = playlist.title || 'Untitled playlist'
  const cover = playlist.coverUrl || previewVideos?.[0]?.thumbnailUrl || ''
  const itemsCount = playlist?.items?.length || playlist?.itemsCount || 0
  const updated = formatDate(playlist.updatedAt || playlist.createdAt)

  const channel = playlist.channelSnapshot || {}
  const handle = channel?.handle ? `@${channel.handle}` : null
  const channelTitle = channel?.title || channel?.name || handle || ''

  const playlistId = String(playlist?._id || '').trim()

  let firstVideoId = ''
  if (playlist?.firstVideoId) {
    firstVideoId = String(playlist.firstVideoId)
  } else if (playlist?.items?.[0]?._id || playlist?.items?.[0]?.videoId) {
    firstVideoId = String(playlist?.items?.[0]?._id || playlist?.items?.[0]?.videoId)
  } else if (previewVideos?.[0]?._id || previewVideos?.[0]?.videoId) {
    firstVideoId = String(previewVideos?.[0]?._id || previewVideos?.[0]?.videoId)
  }

  const toggleExpanded = () => setExpanded((v) => !v)

  const handlePlayAll = () => {
    if (!playlistId || !firstVideoId) return

    const params = new URLSearchParams()
    params.set('list', playlistId)

    router.push(`/watch/${firstVideoId}?${params.toString()}`)
  }

  return (
    <div className={clsx('playlists-card', expanded && 'playlists-card--expanded')}>
      <div className="playlists-card__main">
        <div className="playlists-card__left">
          <div className="playlists-card__stack">
            <span className="playlists-card__stackLayer playlists-card__stackLayer--back" />
            <span className="playlists-card__stackLayer playlists-card__stackLayer--middle" />

            <div className="playlists-card__cover">
              {cover ? (
                <img src={cover} alt={title} className="playlists-card__coverImg" />
              ) : (
                <div className="playlists-card__coverFallback" />
              )}

              <div className="playlists-card__badge">
                {itemsCount} <T>videos</T>
              </div>
            </div>
          </div>
        </div>

        <div className="playlists-card__right">
          <div className="playlists-card__top">
            <h3 className="playlists-card__title" title={title}>
              {title}
            </h3>

            {type === 'playlist' && handle ? (
              <Link href={`/channel/${handle}`} className="playlists-card__channel">
                {channelTitle}
              </Link>
            ) : type === 'myPlaylist' ? (
              <div className="playlists-card__channel playlists-card__channel--muted">
                <T>My playlist</T>
              </div>
            ) : null}

            <div className="playlists-card__meta">
              <span>
                {itemsCount} <T>videos</T>
              </span>
              <span>{updated}</span>
            </div>

            <PlaylistDescription text={playlist.description} />
          </div>

          <div className="playlists-card__actions">
            <button
              type="button"
              className="playlists-card__btn playlists-card__btn--play"
              onClick={handlePlayAll}
              disabled={!playlistId || !firstVideoId}
            >
              <FaPlay className="header__logo-icon" />
              <span>
                <T>Play All</T>
              </span>
            </button>

            <button
              type="button"
              className="playlists-card__btn playlists-card__btn--toggle"
              onClick={toggleExpanded}
            >
              {expanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
              <span>{expanded ? <T>Close list video</T> : <T>Show video</T>}</span>
            </button>
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="playlists-card__videos">
          {previewVideos?.length ? (
            previewVideos.map((video) => <MiniVideoCard key={video._id} video={video} size="sm" />)
          ) : (
            <div className="playlists-card__empty">
              <T>No videos yet</T>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

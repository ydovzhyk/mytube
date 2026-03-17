'use client'

import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import T from '@/common/shared/i18n/T'
import PlaylistsCard from '@/common/shared/playlist-card/PlaylistsCard'

import { searchPlaylists } from '@/store/playlists/playlists-operations'
import {
  getPlaylistsLoading,
  getSearchPlaylistsItems,
  getSearchPlaylistsTotal,
  getSearchPlaylistsPage,
  getSearchPlaylistsTotalPages,
  getSearchPlaylistsQuery,
} from '@/store/playlists/playlists-selectors'

function cleanQ(v) {
  return String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
}

export default function SearchPlaylistsSection({ qFromUrl, playlistPageFromUrl = 1 }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const loading = useSelector(getPlaylistsLoading)
  const items = useSelector(getSearchPlaylistsItems)
  const total = useSelector(getSearchPlaylistsTotal)
  const currentPage = useSelector(getSearchPlaylistsPage)
  const totalPages = useSelector(getSearchPlaylistsTotalPages)
  const currentQ = useSelector(getSearchPlaylistsQuery)

  useEffect(() => {
    if (qFromUrl.length < 2) return

    dispatch(
      searchPlaylists({
        q: qFromUrl,
        page: playlistPageFromUrl,
        limit: 2,
      })
    )
  }, [dispatch, qFromUrl, playlistPageFromUrl])

  const contextMatches = useMemo(() => {
    return (
      cleanQ(currentQ) === cleanQ(qFromUrl) &&
      Number(currentPage || 1) === Number(playlistPageFromUrl || 1)
    )
  }, [currentQ, qFromUrl, currentPage, playlistPageFromUrl])

  const setPlaylistPage = (page) => {
    const safePage = Math.max(1, Number(page) || 1)
    const params = new URLSearchParams(searchParams.toString())

    if (safePage <= 1) {
      params.delete('playlistPage')
    } else {
      params.set('playlistPage', String(safePage))
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const goPrev = () => {
    if (playlistPageFromUrl <= 1) return
    setPlaylistPage(playlistPageFromUrl - 1)
  }

  const goNext = () => {
    if (playlistPageFromUrl >= totalPages) return
    setPlaylistPage(playlistPageFromUrl + 1)
  }

  if (qFromUrl.length < 2) return null

  const showEmpty = !loading && contextMatches && total === 0
  const showItems = contextMatches && total > 0

  if (!showEmpty && !showItems) return null

  return (
    <section className="search-playlists">
      <div className="search-playlists__head">
        <h2 className="search-playlists__title">
          <T>Playlists</T>
        </h2>

        {total > 0 ? (
          <div className="search-playlists__count">
            {total} <T>found</T>
          </div>
        ) : null}
      </div>

      {showEmpty ? (
        <div className="search-playlists__empty">
          <T>No playlists found</T>
        </div>
      ) : null}

      {showItems ? (
        <>
          <div className="search-playlists__grid">
            {items.map((playlist) => {
              const type = playlist?.entityType === 'myPlaylist' ? 'myPlaylist' : 'playlist'

              return (
                <PlaylistsCard
                  key={playlist._id}
                  playlist={playlist}
                  type={type}
                  previewVideos={playlist.previewVideos || []}
                  onPlayAll={(p) => {
                    console.log('play playlist', p)
                  }}
                />
              )
            })}
          </div>

          {totalPages > 1 ? (
            <div className="search-playlists__pagination">
              <button
                type="button"
                className="search-playlists__pageBtn"
                onClick={goPrev}
                disabled={playlistPageFromUrl <= 1}
              >
                <T>Prev</T>
              </button>

              <div className="search-playlists__pageInfo">
                <T>Page</T> {playlistPageFromUrl} / {totalPages}
              </div>

              <button
                type="button"
                className="search-playlists__pageBtn"
                onClick={goNext}
                disabled={playlistPageFromUrl >= totalPages}
              >
                <T>Next</T>
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

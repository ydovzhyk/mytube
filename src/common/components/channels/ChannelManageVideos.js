'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Link from 'next/link'
import { HiPencil, HiSearch, HiTrash } from 'react-icons/hi'

import { getMyChannelVideos, deleteVideo } from '@/store/videos/videos-operations'
import {
  getChannelVideosItems,
  getChannelVideosPage,
  getChannelVideosHasMore,
  getVideosLoading,
  getChannelVideosContextKey,
} from '@/store/videos/videos-selectors'
import { resetChannelVideos } from '@/store/videos/videos-slice'

import T from '@/common/shared/i18n/T'
import Button from '@/common/shared/button/Button'
import { useTranslate } from '@/utils/translating/translating'

const LIMIT = 20
const DEBOUNCE_MS = 400

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const m = Math.floor(s / 60)
  const ss = s % 60
  return `${m}:${String(ss).padStart(2, '0')}`
}

function statusLabel(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'ready') return 'Ready'
  if (s === 'processing') return 'Processing'
  if (s === 'failed') return 'Failed'
  return s || 'Unknown'
}

export default function ChannelManageVideos({ channel }) {
  const dispatch = useDispatch()
  const channelId = channel?._id ? String(channel._id) : ''
  const handle = String(channel?.handle || '')
    .replace(/^@+/, '')
    .toLowerCase()

  const items = useSelector(getChannelVideosItems)
  const page = useSelector(getChannelVideosPage)
  const hasMore = useSelector(getChannelVideosHasMore)
  const isFetching = useSelector(getVideosLoading)
  const contextKeyInStore = useSelector(getChannelVideosContextKey)

  const [sort, setSort] = useState('latest')
  const [query, setQuery] = useState('')
  const [queryDebounced, setQueryDebounced] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const placeholderSearch = useTranslate('Search in this channel')

  useEffect(() => {
    const t = setTimeout(() => setQueryDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  const contextKey = useMemo(() => {
    const q = String(queryDebounced || '')
      .trim()
      .toLowerCase()
    return `${channelId}::manage::${sort}::${q}`
  }, [channelId, sort, queryDebounced])

  useEffect(() => {
    if (!channelId) return

    if (contextKeyInStore !== contextKey) {
      dispatch(resetChannelVideos(contextKey))
    }

    dispatch(
      getMyChannelVideos({
        channelId,
        publishedOnly: false,
        sort,
        query: String(queryDebounced || '').trim(),
        page: 1,
        limit: LIMIT,
        mode: 'replace',
      })
    )
  }, [dispatch, channelId, sort, queryDebounced, contextKey, contextKeyInStore])

  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current || !channelId) return

    const el = sentinelRef.current
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!hasMore || isFetching) return

        dispatch(
          getMyChannelVideos({
            channelId,
            publishedOnly: false,
            sort,
            query: String(queryDebounced || '').trim(),
            page: (page || 1) + 1,
            limit: LIMIT,
            mode: 'append',
          })
        )
      },
      { root: null, rootMargin: '600px', threshold: 0 }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [dispatch, channelId, sort, queryDebounced, page, hasMore, isFetching])

  const onDelete = async (video) => {
    const id = String(video?._id || '')
    if (!id || deletingId) return

    const title = String(video?.title || 'this video')
    const ok = window.confirm(`Delete "${title}"? This cannot be undone.`)
    if (!ok) return

    try {
      setDeletingId(id)
      await dispatch(deleteVideo({ videoId: id })).unwrap()
    } catch {
      // toast via ToastListener
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="manage-videos">
      <div className="manage-videos__head">
        <div>
          <h1 className="manage-videos__title">
            <T caseMode="sentence">Manage videos</T>
          </h1>
          <p className="manage-videos__subtitle">
            @{handle} · <T caseMode="sentence">delete uploads to free space for a clean retest</T>
          </p>
        </div>

        <Link href={`/channels/@${handle}/upload`} className="manage-videos__uploadLink">
          <Button type="button" variant="primary" height="40px">
            <T caseMode="sentence">upload video</T>
          </Button>
        </Link>
      </div>

      <div className="channel-tabs">
        <button className="channel-tabs__item channel-tabs__item--active" type="button">
          <T>Videos</T>
        </button>

        <form className="channel-search" onSubmit={(e) => e.preventDefault()}>
          <HiSearch className="channel-search__icon" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderSearch}
            className="channel-search__input"
          />
        </form>
      </div>

      <div className="channel-sort">
        {[
          { key: 'latest', label: 'Latest' },
          { key: 'popular', label: 'Popular' },
          { key: 'oldest', label: 'Oldest' },
        ].map((it) => (
          <button
            key={it.key}
            type="button"
            className={
              sort === it.key
                ? 'channel-sort__pill channel-sort__pill--active'
                : 'channel-sort__pill'
            }
            onClick={() => setSort(it.key)}
          >
            <T>{it.label}</T>
          </button>
        ))}
      </div>

      <div className="manage-videos__list">
        {items?.length ? (
          items.map((video) => {
            const id = String(video._id)
            const busy = deletingId === id
            const status = String(video.status || 'ready')

            return (
              <article key={id} className="manage-video-row">
                <Link href={`/watch/${id}`} className="manage-video-row__thumb">
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={video.thumbnailUrl} alt={video.title || 'video'} />
                  ) : (
                    <div className="manage-video-row__thumbPlaceholder" />
                  )}
                  {video.duration ? (
                    <span className="manage-video-row__duration">
                      {formatDuration(video.duration)}
                    </span>
                  ) : null}
                </Link>

                <div className="manage-video-row__meta">
                  <Link href={`/watch/${id}`} className="manage-video-row__title">
                    {video.title || 'Untitled'}
                  </Link>
                  <div className="manage-video-row__info">
                    <span
                      className={`manage-video-row__status manage-video-row__status--${status}`}
                    >
                      <T>{statusLabel(status)}</T>
                    </span>
                    <span>
                      {video.isPublished ? <T>Published</T> : <T>Draft</T>}
                    </span>
                    <span>{video?.stats?.views ?? 0} <T>views</T></span>
                    {video.errorMessage ? (
                      <span className="manage-video-row__error">{video.errorMessage}</span>
                    ) : null}
                  </div>
                </div>

                <div className="manage-video-row__actions">
                  <Link
                    href={`/channels/@${handle}/videos/${id}/edit`}
                    className="manage-video-row__edit"
                  >
                    <HiPencil />
                    <span>
                      <T>Edit</T>
                    </span>
                  </Link>

                  <button
                    type="button"
                    className="manage-video-row__delete"
                    onClick={() => onDelete(video)}
                    disabled={busy || isFetching}
                    title="Delete video"
                  >
                    <HiTrash />
                    <span>
                      <T>{busy ? 'Deleting…' : 'Delete'}</T>
                    </span>
                  </button>
                </div>
              </article>
            )
          })
        ) : (
          <div className="channel-empty">
            <T>{queryDebounced ? 'No results' : 'No videos yet'}</T>
          </div>
        )}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />
    </section>
  )
}

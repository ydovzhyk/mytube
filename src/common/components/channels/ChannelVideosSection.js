'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HiSearch } from 'react-icons/hi'

import { getMyChannelVideos } from '@/store/videos/videos-operations'
import {
  getChannelVideosItems,
  getChannelVideosPage,
  getChannelVideosHasMore,
  getVideosLoading,
  getChannelVideosContextKey,
} from '@/store/videos/videos-selectors'
import { resetChannelVideos } from '@/store/videos/videos-slice'

import VideoCard from '@/common/shared/video-card/VideoCard'
import T from '@/common/shared/i18n/T'
import { useTranslate } from '@/utils/translating/translating'

const LIMIT = 20
const DEBOUNCE_MS = 400

export default function ChannelVideosSection({ channelId, publishedOnly = true, title = null }) {
  const dispatch = useDispatch()

  const items = useSelector(getChannelVideosItems)
  const page = useSelector(getChannelVideosPage)
  const hasMore = useSelector(getChannelVideosHasMore)
  const isFetching = useSelector(getVideosLoading)
  const contextKeyInStore = useSelector(getChannelVideosContextKey)

  const [sort, setSort] = useState('latest')
  const [query, setQuery] = useState('')
  const [queryDebounced, setQueryDebounced] = useState('')

  const placeholderSearch = useTranslate('Search in this channel')

  // debounce query
  useEffect(() => {
    const t = setTimeout(() => setQueryDebounced(query), DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  // contextKey: якщо він змінюється — ресет + перший fetch
  const contextKey = useMemo(() => {
    const q = String(queryDebounced || '')
      .trim()
      .toLowerCase()
    return `${channelId || ''}::${publishedOnly ? 'pub' : 'all'}::${sort}::${q}`
  }, [channelId, publishedOnly, sort, queryDebounced])

  useEffect(() => {
    if (!channelId) return

    // якщо контекст змінився — скидаємо feed і вантажимо page=1
    if (contextKeyInStore !== contextKey) {
      dispatch(resetChannelVideos(contextKey))
    }

    // вантажимо першу сторінку (replace)
    dispatch(
      getMyChannelVideos({
        channelId,
        publishedOnly,
        sort,
        query: String(queryDebounced || '').trim(),
        page: 1,
        limit: LIMIT,
        mode: 'replace',
      })
    )
  }, [dispatch, channelId, publishedOnly, sort, queryDebounced, contextKey, contextKeyInStore])

  // infinite scroll sentinel
  const sentinelRef = useRef(null)

  useEffect(() => {
    if (!sentinelRef.current) return
    if (!channelId) return

    const el = sentinelRef.current

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!hasMore) return
        if (isFetching) return

        dispatch(
          getMyChannelVideos({
            channelId,
            publishedOnly,
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
  }, [dispatch, channelId, publishedOnly, sort, queryDebounced, page, hasMore, isFetching])

  return (
    <section className="channel-videos">
      {title ? <h2 className="channel-videos__title">{title}</h2> : null}

      {/* Tabs + Search */}
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

      {/* Sort */}
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

      {/* Videos */}
      <div className="video-grid">
        {items?.length ? (
          items.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))
        ) : (
          <div className="channel-empty">
            <T>{queryDebounced ? 'No results' : 'No videos yet'}</T>
          </div>
        )}
      </div>

      {/* Sentinel */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </section>
  )
}

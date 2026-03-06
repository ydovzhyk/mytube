'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

import VideoCard from '@/common/shared/video-card/VideoCard'

import { searchVideos } from '@/store/videos/videos-operations'
import {
  getSearchItems,
  getSearchHasMore,
  getSearchNextCursor,
  getSearchQuery,
  getSearchSort,
  getVideosLoading,
} from '@/store/videos/videos-selectors'

import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'

function cleanQ(v) {
  return String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
}

export default function SearchPage() {
  const dispatch = useDispatch()
  const searchParams = useSearchParams()

  const qFromUrl = cleanQ(searchParams.get('q') || '')
  const sortFromUrl = String(searchParams.get('sort') || 'relevance').trim()

  const isLoggedIn = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)

  const items = useSelector(getSearchItems)
  const hasMore = useSelector(getSearchHasMore)
  const nextCursor = useSelector(getSearchNextCursor)
  const currentQ = useSelector(getSearchQuery)
  const currentSort = useSelector(getSearchSort)
  const loading = useSelector(getVideosLoading)

  const loadMoreRef = useRef(null)

  const contextMatches = cleanQ(currentQ) === qFromUrl && String(currentSort || '') === sortFromUrl

  useEffect(() => {
    if (qFromUrl.length < 2) return

    const payload = {
      q: qFromUrl,
      sort: sortFromUrl,
      limit: 12,
      __mode: 'replace',
    }

    if (!isLoggedIn && visitorId) {
      payload.visitorId = visitorId
    }

    dispatch(searchVideos(payload))
  }, [dispatch, qFromUrl, sortFromUrl, isLoggedIn, visitorId])

  useEffect(() => {
    if (!loadMoreRef.current) return
    if (!hasMore) return
    if (!qFromUrl || qFromUrl.length < 2) return

    const node = loadMoreRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        if (loading) return
        if (!nextCursor) return

        const payload = {
          q: qFromUrl,
          sort: sortFromUrl,
          limit: 12,
          cursor: nextCursor,
          __mode: 'append',
        }

        if (!isLoggedIn && visitorId) {
          payload.visitorId = visitorId
        }

        dispatch(searchVideos(payload))
      },
      {
        root: null,
        rootMargin: '300px 0px',
        threshold: 0,
      }
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [dispatch, qFromUrl, sortFromUrl, hasMore, nextCursor, loading, isLoggedIn, visitorId])

  const title = useMemo(() => {
    if (!qFromUrl) return 'Search'
    return `Search Results: "${qFromUrl}"`
  }, [qFromUrl])

  if (qFromUrl.length < 2) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-header__title">Search</h1>
          <p className="page-header__subtitle">Enter at least 2 characters to search videos</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">{title}</h1>
      </div>

      <div className="video-grid">
        {items?.length ? (
          items.map((video) => <VideoCard key={video._id} video={video} />)
        ) : !loading && contextMatches ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No videos found</div>
        ) : null}
      </div>

      <div ref={loadMoreRef} style={{ height: 1 }} />
    </div>
  )
}

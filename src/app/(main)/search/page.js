'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

import { useTranslate } from '@/utils/translating/translating'
import SearchVideosSection from '@/common/components/search/SearchVideosSection'
import SearchVideoFilters from '@/common/components/search/SearchVideoFilters'

import { searchVideos } from '@/store/videos/videos-operations'
import {
  getSearchItems,
  getSearchHasMore,
  getSearchNextCursor,
  getSearchQuery,
  getSearchSort,
  getSearchInMyPlaylists,
  getVideosLoading,
} from '@/store/videos/videos-selectors'

import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'

function cleanQ(v) {
  return String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function SearchPageContent({ qFromUrl, sortFromUrl, inMyPlaylistsFromUrl }) {
  const dispatch = useDispatch()

  const isLoggedIn = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)

  const items = useSelector(getSearchItems)
  const hasMore = useSelector(getSearchHasMore)
  const nextCursor = useSelector(getSearchNextCursor)
  const currentQ = useSelector(getSearchQuery)
  const currentSort = useSelector(getSearchSort)
  const loading = useSelector(getVideosLoading)
  const currentInMyPlaylists = useSelector(getSearchInMyPlaylists)

  const loadMoreRef = useRef(null)

  const tSearchResults = useTranslate('Search Results')
  const tSearch = useTranslate('Search')
  const tEnterAtLeast2 = useTranslate('Enter at least 2 characters to search videos')

  const contextMatches = useMemo(() => {
    return (
      cleanQ(currentQ) === qFromUrl &&
      String(currentSort || '') === sortFromUrl &&
      String(currentInMyPlaylists || '') === String(inMyPlaylistsFromUrl || '')
    )
  }, [currentQ, qFromUrl, currentSort, sortFromUrl, currentInMyPlaylists, inMyPlaylistsFromUrl])

  useEffect(() => {
    if (qFromUrl.length < 2) return

    const payload = {
      q: qFromUrl,
      sort: sortFromUrl,
      limit: 12,
      __mode: 'replace',
    }

    if (inMyPlaylistsFromUrl === '0' && isLoggedIn) {
      payload.inMyPlaylists = '0'
    }

    if (!isLoggedIn && visitorId) {
      payload.visitorId = visitorId
    }

    dispatch(searchVideos(payload))
  }, [dispatch, qFromUrl, sortFromUrl, inMyPlaylistsFromUrl, isLoggedIn, visitorId])

  useEffect(() => {
    if (!loadMoreRef.current) return
    if (!hasMore) return
    if (qFromUrl.length < 2) return

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

        if (inMyPlaylistsFromUrl === '0' && isLoggedIn) {
          payload.inMyPlaylists = '0'
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
  }, [
    dispatch,
    qFromUrl,
    sortFromUrl,
    inMyPlaylistsFromUrl,
    hasMore,
    nextCursor,
    loading,
    isLoggedIn,
    visitorId,
  ])

  const title = useMemo(() => {
    if (!qFromUrl) return tSearch
    return `${tSearchResults}: "${qFromUrl}"`
  }, [qFromUrl, tSearch, tSearchResults])

  if (qFromUrl.length < 2) {
    return (
      <div className="search-page">
        <div className="search-page__top">
          <h1 className="search-page__title">{tSearch}</h1>
          <p className="search-page__subtitle">{tEnterAtLeast2}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="search-page">
      <div className="search-page__top">
        <h1 className="search-page__title">{title}</h1>
      </div>

      {/* Тут потім спокійно додаси SearchPlaylistsSection */}
      {/* <SearchPlaylistsSection qFromUrl={qFromUrl} /> */}

      <SearchVideoFilters
        sortFromUrl={sortFromUrl}
        inMyPlaylistsFromUrl={inMyPlaylistsFromUrl}
        isLoggedIn={isLoggedIn}
      />

      <SearchVideosSection
        qFromUrl={qFromUrl}
        items={items}
        loading={loading}
        contextMatches={contextMatches}
        inMyPlaylistsFromUrl={inMyPlaylistsFromUrl}
      />

      <div ref={loadMoreRef} className="search-page__observer" />
    </div>
  )
}

export default function SearchPage() {
  const searchParams = useSearchParams()

  const qFromUrl = cleanQ(searchParams.get('q') || '')
  const sortFromUrl = String(searchParams.get('sort') || 'relevance').trim()
  const inMyPlaylistsFromUrl = String(searchParams.get('inMyPlaylists') || '').trim()

  return (
    <SearchPageContent
      key={`${qFromUrl}__${sortFromUrl}__${inMyPlaylistsFromUrl}`}
      qFromUrl={qFromUrl}
      sortFromUrl={sortFromUrl}
      inMyPlaylistsFromUrl={inMyPlaylistsFromUrl}
    />
  )
}

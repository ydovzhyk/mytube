'use client'

import { useCallback, useMemo } from 'react'
import clsx from 'clsx'
import { useDispatch, useSelector } from 'react-redux'
import { useTranslate } from '@/utils/translating/translating'

import { getSimilarVideos } from '@/store/videos/videos-operations'
import {
  getVideosLoading,
  getWatchSimilarItems,
  getWatchSimilarHasMore,
  getWatchSimilarNextCursor,
  getWatchSimilarFilter,
} from '@/store/videos/videos-selectors'
import { setWatchSimilarFilter } from '@/store/videos/videos-slice'

import { getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId } from '@/store/visitor/visitor-selectors'

import Button from '@/common/shared/button/Button'
import MiniVideoCard from '@/common/shared/mini-video-card/MiniVideoCard'
import T from '@/common/shared/i18n/T'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'related', label: 'Related' },
  { key: 'from_channel', label: 'From this channel' },
  { key: 'watched', label: 'Watched' },
  { key: 'recent', label: 'Recently uploaded' },
]

export default function WatchRecommendation({ videoId, currentId, onSelectVideo }) {
  const dispatch = useDispatch()

  const loading = useSelector(getVideosLoading)
  const items = useSelector(getWatchSimilarItems)
  const hasMore = useSelector(getWatchSimilarHasMore)
  const nextCursor = useSelector(getWatchSimilarNextCursor)
  const filter = useSelector(getWatchSimilarFilter)

  const loggedIn = useSelector(getLogin)
  const visitorId = useSelector(getVisitorId)

  const labelRec = useTranslate('less')

  const list = useMemo(() => {
    const arr = Array.isArray(items) ? items : []
    if (!currentId) return arr
    return arr.filter((x) => String(x?._id) !== String(currentId))
  }, [items, currentId])

  const buildVisitorIdParam = useCallback(
    (f) => {
      // тільки для watched, і тільки для гостя
      if (f !== 'watched') return undefined
      if (loggedIn) return undefined
      return visitorId || undefined
    },
    [loggedIn, visitorId]
  )

  const applyFilter = useCallback(
    (nextFilter) => {
      if (!videoId) return
      const f = nextFilter || 'all'

      dispatch(setWatchSimilarFilter(f))
      dispatch(
        getSimilarVideos({
          id: videoId,
          cursor: null,
          filter: f,
          visitorId: buildVisitorIdParam(f),
        })
      )
    },
    [dispatch, videoId, buildVisitorIdParam]
  )

  const onLoadMore = useCallback(() => {
    if (!videoId) return
    if (!hasMore) return
    if (loading) return

    dispatch(
      getSimilarVideos({
        id: videoId,
        cursor: nextCursor,
        filter,
        visitorId: buildVisitorIdParam(filter),
      })
    )
  }, [dispatch, videoId, hasMore, loading, nextCursor, filter, buildVisitorIdParam])

  // (опційно) заблокувати watched для гостя, поки visitorId ще не готовий
  const watchedDisabled = !loggedIn && !visitorId

  return (
    <div className="watch-reco">
      <div className="watch-reco__top">
        <div className="watch-reco__filters" role="tablist" aria-label={labelRec}>
          {FILTERS.map((f) => {
            const disabled = f.key === 'watched' ? watchedDisabled : false

            return (
              <button
                key={f.key}
                type="button"
                disabled={disabled}
                className={clsx(
                  'watch-reco__filter',
                  filter === f.key && 'watch-reco__filter--active',
                  disabled && 'watch-reco__filter--disabled'
                )}
                onClick={() => applyFilter(f.key)}
                role="tab"
                aria-selected={filter === f.key}
              >
                <T>{f.label}</T>
              </button>
            )
          })}
        </div>
      </div>

      <div className="watch-reco__list">
        {list.map((v) => (
          <MiniVideoCard
            key={v._id}
            video={v}
            onClick={() => onSelectVideo?.(v._id)}
            active={false}
            showChannel
          />
        ))}
      </div>

      {hasMore ? (
        <div className="watch-reco__more">
          <Button variant="secondary" type="button" onClick={onLoadMore} disabled={loading}>
            {loading ? <T>Loading...</T> : <T>More</T>}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

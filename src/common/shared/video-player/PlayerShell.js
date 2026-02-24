'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { usePathname, useRouter } from 'next/navigation'
import VideoPlayer from '@/common/shared/video-player/VideoPlayer'
import {
  getPlayerCurrentVideoId,
  getPlayerMode,
  getPlaybackVideo,
  getPlaybackQueueIds,
  getPlaybackQueueIndex,
  getPlaybackListId,
  getPlaybackHasNext,
  getPlaybackHasPrev,
  getPlaybackNextId,
  getPlaybackPrevId,
  getPlaybackPlaylistLen,
} from '@/store/player/player-selectors'
import {
  setPlayerMode,
  setCurrentVideoId,
  setQueueIndex,
  resetPlayback,
} from '@/store/player/player-slice'
import { resetWatch } from '@/store/videos/videos-slice'

export default function PlayerShell() {
  const dispatch = useDispatch()
  const router = useRouter()
  const pathname = usePathname()

  const mode = useSelector(getPlayerMode)
  const currentVideoId = useSelector(getPlayerCurrentVideoId)

  const playbackVideo = useSelector(getPlaybackVideo)
  const queueIds = useSelector(getPlaybackQueueIds)
  const queueIndex = useSelector(getPlaybackQueueIndex)
  const listId = useSelector(getPlaybackListId)
  const playlistLen = useSelector(getPlaybackPlaylistLen)

  const hasNext = useSelector(getPlaybackHasNext)
  const hasPrev = useSelector(getPlaybackHasPrev)
  const nextId = useSelector(getPlaybackNextId)
  const prevId = useSelector(getPlaybackPrevId)

  const isWatchRoute = pathname?.startsWith('/watch/')

  const watchIdFromPath = useMemo(() => {
    if (!isWatchRoute) return null
    const parts = String(pathname).split('/watch/')
    const tail = parts[1] || ''
    const id = tail.split('/')[0]
    return id || null
  }, [pathname, isWatchRoute])

  const buildWatchUrl = useCallback(
    (id, nextIndex) => {
      if (!id) return null
      const base = `/watch/${id}`

      const idx = Number(nextIndex)
      const pl = Number(playlistLen || 0)

      const shouldKeepList = Boolean(listId) && Number.isFinite(idx) && idx >= 0 && idx < pl

      return shouldKeepList ? `${base}?list=${encodeURIComponent(String(listId))}` : base
    },
    [listId, playlistLen]
  )

  // 1) Sync player currentVideoId with URL (only on watch route)
  useEffect(() => {
    if (!isWatchRoute) return
    if (!watchIdFromPath) return

    const urlId = String(watchIdFromPath)

    if (String(currentVideoId || '') !== urlId) {
      dispatch(setCurrentVideoId(urlId))
    }

    if (Array.isArray(queueIds) && queueIds.length) {
      const idx = queueIds.findIndex((x) => String(x) === urlId)
      if (idx >= 0 && idx !== Number(queueIndex || 0)) {
        dispatch(setQueueIndex(idx))
      }
    }
  }, [dispatch, isWatchRoute, watchIdFromPath, currentVideoId, queueIds, queueIndex])

  // 2) Auto mode:
  useEffect(() => {
    const nextMode = isWatchRoute ? 'full' : currentVideoId ? 'mini' : 'closed'
    if (nextMode !== mode) dispatch(setPlayerMode(nextMode))
  }, [dispatch, isWatchRoute, currentVideoId, mode])

  // --- find watch slot element (for portal) ---
  const [slotEl, setSlotEl] = useState(null)

  useEffect(() => {
    let raf = 0
    let stopped = false

    const tryFind = () => {
      if (stopped) return

      if (!isWatchRoute) {
        setSlotEl(null)
        return
      }

      const el = document.getElementById('watch-player-slot')
      if (el) {
        setSlotEl(el)
        return
      }

      raf = requestAnimationFrame(tryFind)
    }

    tryFind()

    return () => {
      stopped = true
      cancelAnimationFrame(raf)
    }
  }, [isWatchRoute, pathname])

  // --- Video data (from persisted snapshot) ---
  const poster = playbackVideo?.poster || ''
  const sources = playbackVideo?.sources || {}
  const availableQualities = playbackVideo?.availableQualities || [360, 480, 720]

  const navigateToId = useCallback(
    (id, nextIndex) => {
      const url = buildWatchUrl(id, nextIndex)
      if (!url) return
      router.push(url)
    },
    [router, buildWatchUrl]
  )

  const onReturnToWatch = useCallback(() => {
    if (!currentVideoId) return
    navigateToId(currentVideoId, Number(queueIndex || 0))
  }, [navigateToId, currentVideoId, queueIndex])

  const onCloseMini = useCallback(() => {
    dispatch(resetPlayback())
    dispatch(resetWatch())
  }, [dispatch])

  const goNext = useCallback(() => {
    if (!hasNext || !nextId) return

    const nextIndex = Number(queueIndex || 0) + 1
    dispatch(setQueueIndex(nextIndex))

    if (mode === 'full') navigateToId(nextId, nextIndex)
  }, [dispatch, hasNext, nextId, queueIndex, navigateToId, mode])

  const goPrev = useCallback(() => {
    if (!hasPrev || !prevId) return

    const nextIndex = Math.max(0, Number(queueIndex || 0) - 1)
    dispatch(setQueueIndex(nextIndex))

    if (mode === 'full') navigateToId(prevId, nextIndex)
  }, [dispatch, hasPrev, prevId, queueIndex, navigateToId, mode])

  const onEnded = useCallback(() => {
    if (hasNext && nextId) goNext()
  }, [hasNext, nextId, goNext])

  const playerNode = (
    <VideoPlayer
      videoId={currentVideoId}
      poster={poster}
      sources={sources}
      availableQualities={availableQualities}
      initialQuality={720}
      onEnded={onEnded}
      hasNext={hasNext}
      hasPrev={hasPrev}
      onNext={goNext}
      onPrev={goPrev}
      isMini={mode === 'mini'}
      onReturn={onReturnToWatch}
      onClose={onCloseMini}
    />
  )

  if (mode === 'full') {
    if (!slotEl) return null
    return createPortal(playerNode, slotEl)
  }

  if (mode === 'mini') {
    if (!currentVideoId) return null
    return (
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 16,
          width: 420,
          height: 250,
          zIndex: 60,
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>{playerNode}</div>
      </div>
    )
  }

  return null
}

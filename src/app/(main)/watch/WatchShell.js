'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'

import { videoView } from '@/store/videos/videos-operations'
import { updateUser } from '@/store/auth/auth-operations'
import { getLogin } from '@/store/auth/auth-selectors'
import {
  getWatchCurrentVideo,
  getWatchPlaylist,
  getWatchSimilarItems,
  getShowPlaylist,
} from '@/store/videos/videos-selectors'
import { setShowPlaylist } from '@/store/videos/videos-slice'
import { getBackPrevAllowed } from '@/store/technical/technical-selectors'
import { setBackPrevAllowed } from '@/store/technical/technical-slice'

import WatchPlaylistPanel from '@/common/components/watch/watch-playlist/WatchPlaylistPanel'
import WatchRecommendation from '@/common/components/watch/watch-recommendation/WatchRecommendation'
import VideoPlayer from '@/common/shared/video-player/VideoPlayer'
import WatchVideoPanel from '@/common/components/watch/watch-video-panel/WatchVideoPanel'
import Button from '@/common/shared/button/Button'
import { HiOutlineHeart } from 'react-icons/hi'
import T from '@/common/shared/i18n/T'
import { IoCloseOutline } from 'react-icons/io5'

/* BACK STACK */
const BACK_KEY = 'mytube:watch_back_stack'
const BACK_LIMIT = 80

function readBackStack() {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(BACK_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.map(String) : []
  } catch {
    return []
  }
}

function writeBackStack(arr) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(BACK_KEY, JSON.stringify(arr.slice(-BACK_LIMIT)))
}

function pushBack(currentId, dispatch) {
  if (!currentId || typeof window === 'undefined') return
  const stack = readBackStack()
  const last = stack[stack.length - 1]
  if (String(last) !== String(currentId)) {
    stack.push(String(currentId))
    writeBackStack(stack)
  }
  dispatch?.(setBackPrevAllowed(stack.length > 0))
}

function popBack(dispatch) {
  if (typeof window === 'undefined') return null
  const stack = readBackStack()
  const prevId = stack.pop() || null
  writeBackStack(stack)
  dispatch?.(setBackPrevAllowed(stack.length > 0))
  return prevId
}

export default function WatchShell({ children }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const params = useParams()

  const urlId = params?.id

  const currentVideo = useSelector(getWatchCurrentVideo)
  const playlist = useSelector(getWatchPlaylist)
  const similarItems = useSelector(getWatchSimilarItems)
  const showPlaylist = useSelector(getShowPlaylist)
  const loggedIn = useSelector(getLogin)

  const activeId = currentVideo?._id || urlId || null

  const sources = currentVideo?.sources || {}
  const availableQualities = currentVideo?.availableQualities || [360, 480, 720]
  const poster = currentVideo?.thumbnailUrl || ''

  const playlistItems = useMemo(
    () => (Array.isArray(playlist?.items) ? playlist.items : []),
    [playlist]
  )

  const playlistIndex = useMemo(() => {
    if (!playlistItems.length || !activeId) return -1
    return playlistItems.findIndex((x) => String(x?._id) === String(activeId))
  }, [playlistItems, activeId])

  const inPlaylist = Boolean(playlistItems.length && playlistIndex >= 0)

  const hasPrev = useSelector(getBackPrevAllowed)

  useEffect(() => {
    dispatch(setBackPrevAllowed(readBackStack().length > 0))
  }, [dispatch, urlId])

  const recommendedNext = useMemo(() => {
    const curId = String(activeId || '')
    return (Array.isArray(similarItems) ? similarItems : []).find(
      (x) => String(x?._id) && String(x?._id) !== curId
    )
  }, [similarItems, activeId])

  const hasPlaylistNext =
    inPlaylist && playlistIndex >= 0 && playlistIndex < playlistItems.length - 1

  const hasNext = Boolean(hasPlaylistNext || recommendedNext?._id)

  const goToVideo = useCallback(
    (nextId) => {
      if (!nextId) return
      sessionStorage.setItem('mytube:gesture', '1')
      router.push(`/watch/${nextId}`)
    },
    [router]
  )

  const navigateTo = useCallback(
    (nextId) => {
      if (activeId && nextId && String(nextId) !== String(activeId)) {
        pushBack(activeId, dispatch)
      }
      goToVideo(nextId)
    },
    [activeId, goToVideo, dispatch]
  )

  const goNext = useCallback(() => {
    if (hasPlaylistNext) {
      const next = playlistItems[playlistIndex + 1]
      if (next?._id) navigateTo(next._id)
      return
    }

    if (recommendedNext?._id) navigateTo(recommendedNext._id)
  }, [hasPlaylistNext, playlistItems, playlistIndex, navigateTo, recommendedNext])

  const goPrev = useCallback(() => {
    if (!hasPrev) return
    const prevId = popBack(dispatch)
    if (prevId) goToVideo(prevId)
  }, [hasPrev, goToVideo, dispatch])

  return (
    <div className="watch-page">
      <div className="watch-page__main">
        <VideoPlayer
          videoId={activeId}
          poster={poster}
          sources={sources}
          availableQualities={availableQualities}
          initialQuality={720}
          onView={(vid) => {
            const p1 = dispatch(videoView(vid))
            const p2 = loggedIn ? dispatch(updateUser({ watchedVideoId: vid })) : Promise.resolve()
            return Promise.all([p1, p2])
          }}
          hasNext={hasNext}
          hasPrev={hasPrev}
          onNext={goNext}
          onPrev={goPrev}
          onEnded={goNext}
        />

        {children}

        {currentVideo && (
          <>
            <WatchVideoPanel video={currentVideo} videoId={activeId} />

            <div className="video-description">
              <div className="video-description__content">{currentVideo.description || ''}</div>
            </div>
          </>
        )}
      </div>

      <div className="watch-page__sidebar">
        {showPlaylist && playlistItems.length > 0 && (
          <div className="watch-page__sidebarSection">
            <div className="watch-page__subTitleRow">
              <h3 className="watch-page__subTitle">
                <T>Playlist</T>
              </h3>

              <button
                className="watch-page__closePlaylist"
                onClick={() => dispatch(setShowPlaylist(false))}
              >
                <IoCloseOutline />
              </button>
            </div>

            <WatchPlaylistPanel
              playlist={playlist}
              currentId={activeId}
              onSelectVideo={(vid) => navigateTo(vid)}
            />
          </div>
        )}

        <div className="watch-page__sidebarSection">
          <h3 className="watch-page__subTitle">
            <T>Recommended</T>
          </h3>

          <WatchRecommendation
            videoId={String(activeId || '')}
            currentId={activeId}
            onSelectVideo={(vid) => navigateTo(vid)}
          />
        </div>
      </div>
    </div>
  )
}

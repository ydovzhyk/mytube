'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useSearchParams, useRouter } from 'next/navigation'

import { getWatchVideo, videoView } from '@/store/videos/videos-operations'
import { updateUser } from '@/store/auth/auth-operations'
import {
  getWatchCurrentVideo,
  getWatchPlaylist,
  getWatchSimilarItems,
  getShowPlaylist,
} from '@/store/videos/videos-selectors'
import { resetWatch, setShowPlaylist } from '@/store/videos/videos-slice'

import WatchPlaylistPanel from '@/common/components/watch/watch-playlist/WatchPlaylistPanel'
import WatchRecommendation from '@/common/components/watch/watch-recommendation/WatchRecommendation'
import VideoPlayer from '@/common/shared/video-player/VideoPlayer'
import Button from '@/common/shared/button/Button'
import { HiOutlineHeart } from 'react-icons/hi'
import T from '../../../../common/shared/i18n/T'

import { IoCloseOutline } from 'react-icons/io5'

// --- BACK STACK (Prev) ---
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

function pushBack(currentId) {
  if (!currentId || typeof window === 'undefined') return
  const stack = readBackStack()
  const last = stack[stack.length - 1]
  if (String(last) !== String(currentId)) {
    stack.push(String(currentId))
    writeBackStack(stack)
  }
}

function popBack() {
  if (typeof window === 'undefined') return null
  const stack = readBackStack()
  const prevId = stack.pop() || null
  writeBackStack(stack)
  return prevId
}

export default function WatchPage() {
  const dispatch = useDispatch()
  const router = useRouter()

  const params = useParams()
  const search = useSearchParams()

  const id = params?.id
  const list = search.get('list') || null

  const currentVideo = useSelector(getWatchCurrentVideo)
  const playlist = useSelector(getWatchPlaylist)
  const similarItems = useSelector(getWatchSimilarItems)
  const showPlaylist = useSelector(getShowPlaylist)
  // gesture -> autoplay permission
  const canAutoPlay =
    typeof window !== 'undefined' && sessionStorage.getItem('mytube:gesture') === '1'

  // fetch watch data
  useEffect(() => {
    if (!id) return
    dispatch(resetWatch())
    dispatch(getWatchVideo({ id, list }))
  }, [dispatch, id, list])

  // player props
  const sources = currentVideo?.sources || {}
  const availableQualities = currentVideo?.availableQualities || [360, 480, 720]
  const poster = currentVideo?.thumbnailUrl
  const canRenderPlayer = Boolean(currentVideo?._id && Object.keys(sources).length)

  // playlist helpers
  const playlistItems = useMemo(() => {
    const items = playlist?.items
    return Array.isArray(items) ? items : []
  }, [playlist])

  const inPlaylist = Boolean(showPlaylist && list && playlistItems.length)

  const playlistIndex = useMemo(() => {
    if (!playlistItems.length || !currentVideo?._id) return -1
    return playlistItems.findIndex((x) => String(x?._id) === String(currentVideo._id))
  }, [playlistItems, currentVideo])

  const hasPrev = typeof window !== 'undefined' && readBackStack().length > 0

  const recommendedNext = useMemo(() => {
    const curId = String(currentVideo?._id || '')
    const sim = Array.isArray(similarItems) ? similarItems : []
    return sim.find((x) => String(x?._id) !== curId) || null
  }, [similarItems, currentVideo])

  const hasNext = inPlaylist
    ? playlistIndex >= 0 && playlistIndex < playlistItems.length - 1
    : Boolean(recommendedNext?._id)

  const goToVideo = useCallback(
    (nextId) => {
      if (!nextId) return
      if (typeof window !== 'undefined') sessionStorage.setItem('mytube:gesture', '1')
      const qs = list ? `?list=${encodeURIComponent(list)}` : ''
      router.push(`/watch/${nextId}${qs}`)
    },
    [router, list]
  )

  const navigateTo = useCallback(
    (nextId) => {
      const curId = currentVideo?._id || id
      if (curId && nextId && String(nextId) !== String(curId)) pushBack(curId)
      goToVideo(nextId)
    },
    [currentVideo, id, goToVideo]
  )

  const goNext = useCallback(() => {
    if (!hasNext) return

    if (inPlaylist) {
      const next = playlistItems[playlistIndex + 1]
      if (next?._id) navigateTo(next._id)
      return
    }

    if (recommendedNext?._id) {
      navigateTo(recommendedNext._id)
    }
  }, [hasNext, inPlaylist, playlistItems, playlistIndex, navigateTo, recommendedNext])

  const goPrev = useCallback(() => {
    if (!hasPrev) return
    const prevId = popBack()
    if (prevId) goToVideo(prevId)
  }, [hasPrev, goToVideo])

  return (
    <div className="watch-page">
      <div className="watch-page__main">
        {canRenderPlayer ? (
          <VideoPlayer
            videoId={currentVideo._id}
            poster={poster}
            sources={sources}
            availableQualities={availableQualities}
            initialQuality={720}
            autoPlay={canAutoPlay}
            onView={(vid) => {
              dispatch(videoView(vid))
              dispatch(updateUser({ watchedVideoId: vid }))
            }}
            hasNext={hasNext}
            hasPrev={hasPrev}
            onNext={goNext}
            onPrev={goPrev}
            onEnded={goNext}
          />
        ) : null}

        {currentVideo ? (
          <>
            <div className="video-info">
              <h1 className="video-info__title">{currentVideo.title}</h1>

              <div className="video-info__meta">
                <div className="video-info__stats">
                  <span>{currentVideo?.stats?.views ?? 0} views</span>
                  <span>
                    {new Date(
                      currentVideo.publishedAt || currentVideo.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                <div className="video-info__actions">
                  <button className="video-info__action">
                    <HiOutlineHeart />
                    <span>{currentVideo?.stats?.likes ?? 0}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="channel-info">
              <div className="channel-info__left">
                {/* TODO: Avatar + Link на канал */}
                <div className="channel-info__details">
                  <span className="channel-info__subscribers">—</span>
                </div>
              </div>

              <Button variant="primary">Subscribe</Button>
            </div>

            <div className="video-description">
              <div className="video-description__content">{currentVideo.description || ''}</div>
            </div>
          </>
        ) : null}
      </div>

      <div className="watch-page__sidebar">
        {showPlaylist && playlist?.items?.length ? (
          <div className="watch-page__sidebarSection">
            <div className="watch-page__subTitleRow">
              <h3 className="watch-page__subTitle">
                <T>Playlist</T>
              </h3>

              <button
                type="button"
                className="watch-page__closePlaylist"
                onClick={() => dispatch(setShowPlaylist(false))}
                aria-label="Close playlist panel"
                title="Close"
              >
                <IoCloseOutline />
              </button>
            </div>

            <WatchPlaylistPanel
              playlist={playlist}
              currentId={currentVideo?._id}
              onSelectVideo={(vid) => navigateTo(vid)}
            />
          </div>
        ) : null}

        <div className="watch-page__sidebarSection">
          <h3 className="watch-page__subTitle">
            <T>Recommended</T>
          </h3>
          <WatchRecommendation
            videoId={id}
            currentId={currentVideo?._id}
            onSelectVideo={(vid) => navigateTo(vid)}
          />
        </div>
      </div>
    </div>
  )
}


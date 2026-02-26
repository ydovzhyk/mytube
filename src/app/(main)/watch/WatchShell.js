'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useRouter } from 'next/navigation'
import { getPlayerCurrentVideoId } from '@/store/player/player-selectors'
import { setBackPrevAllowed } from '@/store/player/player-slice'
import {
  getWatchCurrentVideo,
  getWatchPlaylist,
  getShowPlaylist,
} from '@/store/videos/videos-selectors'
import { setShowPlaylist } from '@/store/videos/videos-slice'
import WatchPlaylistPanel from '@/common/components/watch/watch-playlist/WatchPlaylistPanel'
import WatchRecommendation from '@/common/components/watch/watch-recommendation/WatchRecommendation'
import WatchVideoPanel from '@/common/components/watch/watch-video-panel/WatchVideoPanel'
import WatchCommentsSection from '@/common/components/watch/watch-comments/WatchCommentsSection'
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

function VideoDescriptionPanel({ video }) {
  const DESC_LIMIT = 200
  const [showMoreDesc, setShowMoreDesc] = useState(false)

  const tags = useMemo(() => {
    const arr = video?.tags
    if (!Array.isArray(arr)) return []
    return arr
      .map((t) => String(t || '').trim())
      .filter(Boolean)
      .slice(0, 5)
  }, [video?.tags])

  const hasTags = tags.length > 0
  const description = String(video?.description || '')
  const hasDesc = Boolean(description.trim())

  const showToggle = hasDesc && description.length > DESC_LIMIT
  const descShort = useMemo(() => {
    if (!hasDesc) return ''
    if (description.length <= DESC_LIMIT) return description
    return description.slice(0, DESC_LIMIT).trim() + '…'
  }, [description, hasDesc])

  if (!hasTags && !hasDesc) return null

  return (
    <div className="video-description">
      {hasTags ? (
        <div className="video-description__topRow">
          <div className="video-description__tags">
            {tags.map((t) => (
              <span key={t} className="video-description__tag" title={`#${t}`}>
                #{t}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {hasDesc ? (
        <div className="video-description__textRow">
          <span className="video-description__text">{showMoreDesc ? description : descShort}</span>

          {showToggle ? (
            <button
              type="button"
              className="video-description__more"
              onClick={() => setShowMoreDesc((v) => !v)}
            >
              {showMoreDesc ? <T caseMode="lower">less</T> : <T caseMode="lower">...more</T>}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default function WatchShell({ children }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const params = useParams()

  const urlId = params?.id ? String(params.id) : null

  // data for UI panels (title/desc/channel etc.)
  const currentVideo = useSelector(getWatchCurrentVideo)
  const playlist = useSelector(getWatchPlaylist)
  const showPlaylist = useSelector(getShowPlaylist)

  // active playing id should come from player slice (persisted + queue-driven)
  const playerId = useSelector(getPlayerCurrentVideoId)
  const activeId =
    playerId || (currentVideo?._id ? String(currentVideo._id) : null) || urlId || null

  const playlistItems = useMemo(
    () => (Array.isArray(playlist?.items) ? playlist.items : []),
    [playlist]
  )

  useEffect(() => {
    dispatch(setBackPrevAllowed(readBackStack().length > 0))
  }, [dispatch, urlId])

  const goToVideo = useCallback(
    (nextId) => {
      if (!nextId) return
      try {
        sessionStorage.setItem('mytube:gesture', '1')
      } catch {}
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

  return (
    <div className="watch-page">
      <div className="watch-page__main">
        {/* SLOT: real VideoPlayer is rendered in PlayerShell on top of this */}
        <div id="watch-player-slot" className="watch-player-slot" />
        {children}
        {currentVideo && (
          <>
            <WatchVideoPanel video={currentVideo} videoId={activeId} />
            <VideoDescriptionPanel key={String(activeId || '')} video={currentVideo} />
            <WatchCommentsSection video={currentVideo} />
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
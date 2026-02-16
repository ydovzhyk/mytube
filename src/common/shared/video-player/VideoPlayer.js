'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import clsx from 'clsx'
import pushWatchHistoryId from '@/utils/push-watch-history'
import {
  getVolumeLevel,
  getMuted,
  getPreferredQuality,
  getFullscreenWanted,
} from '@/store/technical/technical-selectors'
import {
  setVolumeLevel,
  setMuted,
  setPreferredQuality,
  setFullscreenWanted,
} from '@/store/technical/technical-slice'
import { HiVolumeUp, HiVolumeOff, HiCog, HiArrowsExpand, HiRefresh } from 'react-icons/hi'

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function formatTime(sec = 0) {
  const s = Math.floor(sec || 0)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
  return `${m}:${String(r).padStart(2, '0')}`
}

/**
 * MVP view rule:
 * - if duration <= 60s: count when watched >= 15s OR watched >= 80%
 * - else: count when watched >= 30s OR watched >= 60%
 */
function canCountView({ duration, watchedSeconds }) {
  const d = Number(duration) || 0
  const w = Number(watchedSeconds) || 0
  if (!d || !w) return false

  if (d <= 60) return w >= 15 || w / d >= 0.8
  return w >= 30 || w / d >= 0.6
}

const VIEW_COOLDOWN_SEC = 10 * 60
const REWATCH_RESET_NEAR_START_SEC = 5

function viewedAtKey(videoId) {
  return videoId ? `mytube:viewedAt:${videoId}` : null
}

function canSendByCooldown(videoId) {
  const key = viewedAtKey(videoId)
  if (!key || typeof window === 'undefined') return true
  const last = Number(window.sessionStorage.getItem(key) || 0)
  if (!last) return true
  return (Date.now() - last) / 1000 >= VIEW_COOLDOWN_SEC
}

function markViewedNow(videoId) {
  const key = viewedAtKey(videoId)
  if (!key || typeof window === 'undefined') return
  window.sessionStorage.setItem(key, String(Date.now()))
}

function normalizeQuality(q) {
  if (q === null || q === undefined) return null
  const n = Number(String(q).trim().toLowerCase().replace('p', ''))
  return Number.isFinite(n) ? n : null
}

function normalizeSourcesMap(sources) {
  const out = {}
  if (!sources || typeof sources !== 'object') return out

  for (const [k, v] of Object.entries(sources)) {
    if (!v) continue
    const q = normalizeQuality(k)
    if (!q) continue
    const key = String(q)
    if (!out[key]) out[key] = v
  }
  return out
}

function normalizeQualitiesList(availableQualities, sourcesNorm) {
  const raw = Array.isArray(availableQualities) ? availableQualities : []
  const list = raw
    .map(normalizeQuality)
    .filter((q) => q && sourcesNorm?.[String(q)])
    .sort((a, b) => a - b)

  if (list.length) return list

  const inferred = Object.keys(sourcesNorm || {})
    .map((k) => normalizeQuality(k))
    .filter((q) => q)
    .sort((a, b) => a - b)

  return inferred
}

function readGestureAllowed() {
  try {
    return typeof window !== 'undefined' && sessionStorage.getItem('mytube:gesture') === '1'
  } catch {
    return false
  }
}

export default function VideoPlayer({
  videoId,
  sources = {},
  poster,
  availableQualities = [360, 480, 720],
  initialQuality,
  onEnded,
  onView,
  className,
  hasNext = false,
  hasPrev = false,
  onNext,
  onPrev,
  onWatched,
}) {
  const dispatch = useDispatch()

  const videoRef = useRef(null)
  const rootRef = useRef(null)
  const progressRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)

  const volume = useSelector(getVolumeLevel)
  const muted = useSelector(getMuted)
  const preferredQuality = useSelector(getPreferredQuality)
  const fullscreenWanted = useSelector(getFullscreenWanted)

  const [controlsVisible, setControlsVisible] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [playAnim, setPlayAnim] = useState(false)

  const [loopEnabled, setLoopEnabled] = useState(false)

  const sentThisSessionRef = useRef(false)
  const watchedSecondsRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastTickAtRef = useRef(0)

  const lastVideoIdRef = useRef(null)
  const endedLockRef = useRef(false)

  // Seeking lock (so root click doesn't toggle play while dragging)
  const isSeekingRef = useRef(false)

  // autoplay-muted fallback flag (LOCAL ONLY, do NOT store in redux)
  const forcedMutedRef = useRef(false)
  // UI mirror of forcedMutedRef (so slider/icon updates correctly after refresh)
  const [forcedMutedUi, setForcedMutedUi] = useState(false)

  const effectiveMuted = muted || forcedMutedUi

  const setForcedMuted = useCallback((val) => {
    const next = Boolean(val)
    forcedMutedRef.current = next
    setForcedMutedUi(next)
  }, [])

  // Hydration-safe flag: during SSR hydration render stable UI (prevents mismatch)
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  // When user interacts once, treat it as “gesture happened”
  const markGesture = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      sessionStorage.setItem('mytube:gesture', '1')
    } catch {}
  }, [])

  // fullscreen listener: keep store in sync (Esc / browser UI etc.)
  useEffect(() => {
    const onFs = () => {
      const isFs = Boolean(document.fullscreenElement)
      if (isFs !== fullscreenWanted) dispatch(setFullscreenWanted(isFs))
    }
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [dispatch, fullscreenWanted])

  const resetWatchSession = useCallback(() => {
    sentThisSessionRef.current = false
    watchedSecondsRef.current = 0
    lastTimeRef.current = 0
    lastTickAtRef.current = 0
  }, [])

  const trySendView = useCallback(async () => {
    if (!videoId) return
    if (sentThisSessionRef.current) return
    if (!canSendByCooldown(videoId)) return
    if (!canCountView({ duration, watchedSeconds: watchedSecondsRef.current })) return

    sentThisSessionRef.current = true
    markViewedNow(videoId)
    pushWatchHistoryId(videoId)
    onWatched?.(videoId)

    try {
      await onView?.(videoId)
    } catch {}
  }, [videoId, duration, onView, onWatched])

  useEffect(() => {
    resetWatchSession()
  }, [videoId, resetWatchSession])

  const sourcesNorm = useMemo(() => normalizeSourcesMap(sources), [sources])
  const qualitiesNorm = useMemo(
    () => normalizeQualitiesList(availableQualities, sourcesNorm),
    [availableQualities, sourcesNorm]
  )

  const defaultQuality = useMemo(() => {
    const fromStore = normalizeQuality(preferredQuality)
    if (fromStore && sourcesNorm?.[String(fromStore)]) return fromStore

    const fromProp = normalizeQuality(initialQuality)
    if (fromProp && sourcesNorm?.[String(fromProp)]) return fromProp

    return qualitiesNorm.length ? qualitiesNorm[qualitiesNorm.length - 1] : 360
  }, [preferredQuality, initialQuality, sourcesNorm, qualitiesNorm])

  const [quality, setQuality] = useState(defaultQuality)

  useEffect(() => {
    if (!sourcesNorm?.[String(quality)]) setQuality(defaultQuality)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourcesNorm, defaultQuality])

  const activeSrc = useMemo(() => sourcesNorm?.[String(quality)] || '', [sourcesNorm, quality])
  const noSrc = !activeSrc

  // Keep element volume/mute in sync with store + forcedMutedUi
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = clamp(volume, 0, 1)
    v.muted = Boolean(muted || forcedMutedRef.current)
  }, [volume, muted, forcedMutedUi])

  const safeAutoplay = useCallback(async () => {
    const v = videoRef.current
    if (!v || !v.src) return false

    // Only attempt autoplay if we already have a “gesture allowed” flag.
    if (!readGestureAllowed()) return false

    try {
      await v.play()
      return true
    } catch (e) {
      // Refresh case: browser blocks sound autoplay → retry muted autoplay
      if (e?.name === 'NotAllowedError') {
        try {
          setForcedMuted(true) // <- important: UI must reflect this
          v.muted = true
          await v.play()
          return true
        } catch {}
      }
    }
    return false
  }, [setForcedMuted])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return

    if (!activeSrc) {
      try {
        v.pause()
        v.removeAttribute('src')
        v.load()
      } catch {}
      setIsReady(false)
      setIsBuffering(false)
      setIsPlaying(false)
      setDuration(0)
      setCurrentTime(0)
      setBufferedEnd(0)
      setForcedMuted(false)
      return
    }

    const prevId = lastVideoIdRef.current
    const isVideoChange = prevId && String(prevId) !== String(videoId)
    lastVideoIdRef.current = videoId

    const wasPlaying = !v.paused
    const prevTime = v.currentTime || 0

    const targetTime = isVideoChange ? 0 : prevTime

    const gestureAllowed = readGestureAllowed()
    const shouldPlay =
      (isVideoChange ? gestureAllowed : wasPlaying || gestureAllowed) && Boolean(activeSrc)

    setIsBuffering(true)
    setIsReady(false)

    lastTimeRef.current = 0
    lastTickAtRef.current = 0
    setForcedMuted(false)

    try {
      v.pause()
    } catch {}

    v.src = activeSrc
    if (poster) v.poster = poster

    const onLoaded = async () => {
      try {
        v.currentTime = clamp(targetTime, 0, Math.max(0, (v.duration || 0) - 0.2))
      } catch {}
      setIsReady(true)
      setIsBuffering(false)

      if (shouldPlay) {
        await safeAutoplay()
      }
    }

    v.addEventListener('loadedmetadata', onLoaded, { once: true })
    v.load()

    return () => v.removeEventListener('loadedmetadata', onLoaded)
  }, [activeSrc, poster, videoId, safeAutoplay, setForcedMuted])

  const showControls = useCallback(() => setControlsVisible(true), [])
  const hideControls = useCallback(() => {
    setControlsVisible(false)
    setQualityOpen(false)
  }, [])

  useEffect(() => {
    if (!controlsVisible) return
    const id = setTimeout(() => {
      if (!qualityOpen) setControlsVisible(false)
    }, 2200)
    return () => clearTimeout(id)
  }, [controlsVisible, qualityOpen, currentTime])

  useEffect(() => {
    if (!qualityOpen) return
    const onDoc = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setQualityOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [qualityOpen])

  const clearForcedMutedIfAny = useCallback(() => {
    if (!forcedMutedRef.current) return
    setForcedMuted(false)
    const v = videoRef.current
    if (v) v.muted = Boolean(muted) // restore to store state
  }, [muted, setForcedMuted])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.src) return

    markGesture()
    clearForcedMutedIfAny()

    if (v.paused) {
      v.play().catch(() => {})
      setPlayAnim(true)
      setTimeout(() => setPlayAnim(false), 450)
    } else {
      v.pause()
      setPlayAnim(true)
      setTimeout(() => setPlayAnim(false), 450)
    }
  }, [markGesture, clearForcedMutedIfAny])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return

    const t = v.currentTime || 0
    setCurrentTime(t)

    try {
      if (v.buffered && v.buffered.length) {
        const end = v.buffered.end(v.buffered.length - 1)
        setBufferedEnd(end || 0)
      }
    } catch {}

    if (t <= REWATCH_RESET_NEAR_START_SEC && !v.paused && watchedSecondsRef.current > 0) {
      resetWatchSession()
      lastTimeRef.current = t
      lastTickAtRef.current = Date.now()
      return
    }

    const now = Date.now()
    const lastT = lastTimeRef.current || 0
    const lastTickAt = lastTickAtRef.current || 0

    const delta = t - lastT
    const wallDelta = lastTickAt ? (now - lastTickAt) / 1000 : 0

    if (delta > 0 && delta <= 1.2 && (wallDelta === 0 || wallDelta <= 2.0) && !v.paused) {
      watchedSecondsRef.current += delta
      trySendView()
    }

    lastTimeRef.current = t
    lastTickAtRef.current = now
  }, [trySendView, resetWatchSession])

  const onLoadedMeta = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration || 0)
    setIsReady(true)
    trySendView()
  }, [trySendView])

  const onPlay = useCallback(() => setIsPlaying(true), [])
  const onPause = useCallback(() => setIsPlaying(false), [])
  const onWaiting = useCallback(() => setIsBuffering(true), [])
  const onPlayingEv = useCallback(() => setIsBuffering(false), [])

  const onEndedEv = useCallback(() => {
    if (endedLockRef.current) return
    endedLockRef.current = true
    setTimeout(() => {
      endedLockRef.current = false
    }, 450)

    setIsPlaying(false)

    if (!sentThisSessionRef.current) {
      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, duration || 0)
      trySendView()
    }

    resetWatchSession()

    const v = videoRef.current
    if (loopEnabled && v) {
      v.currentTime = 0
      v.play().catch(() => {})
      return
    }

    onEnded?.()
  }, [onEnded, trySendView, duration, resetWatchSession, loopEnabled])

  const seekByClientX = useCallback(
    (clientX) => {
      const v = videoRef.current
      const bar = progressRef.current
      if (!v || !bar || !duration) return
      markGesture()
      clearForcedMutedIfAny()

      const rect = bar.getBoundingClientRect()
      const p = clamp((clientX - rect.left) / rect.width, 0, 1)
      v.currentTime = p * duration
      lastTimeRef.current = v.currentTime || 0
      lastTickAtRef.current = Date.now()
    },
    [duration, markGesture, clearForcedMutedIfAny]
  )

  const onProgressPointerDown = useCallback(
    (e) => {
      if (noSrc) return
      e.preventDefault()
      e.stopPropagation()
      isSeekingRef.current = true
      seekByClientX(e.clientX)

      const onMove = (ev) => {
        if (!isSeekingRef.current) return
        seekByClientX(ev.clientX)
      }
      const onUp = () => {
        isSeekingRef.current = false
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [seekByClientX, noSrc]
  )

  const toggleMute = useCallback(() => {
    markGesture()

    // If browser forced-muted due to autoplay policy:
    // treat click as "Unmute" (don’t toggle into mute)
    if (forcedMutedRef.current) {
      setForcedMuted(false)
      dispatch(setMuted(false))
      const v = videoRef.current
      if (v) v.muted = false
      return
    }

    dispatch(setMuted(!muted))
  }, [dispatch, muted, markGesture, setForcedMuted])

  const onVolumeChange = useCallback(
    (e) => {
      markGesture()
      clearForcedMutedIfAny()

      const v = Number(e.target.value)
      if (v > 0 && muted) dispatch(setMuted(false))
      dispatch(setVolumeLevel(v))
    },
    [dispatch, muted, markGesture, clearForcedMutedIfAny]
  )

  const toggleFullscreen = useCallback(async () => {
    markGesture()
    const el = rootRef.current
    if (!el) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        return
      }
      await el.requestFullscreen?.()
    } catch {}
  }, [markGesture])

  const bufferedPct = useMemo(() => {
    if (!duration) return 0
    return clamp((bufferedEnd / duration) * 100, 0, 100)
  }, [bufferedEnd, duration])

  const playedPct = useMemo(() => {
    if (!duration) return 0
    return clamp((currentTime / duration) * 100, 0, 100)
  }, [currentTime, duration])

  const volumeBg = useMemo(() => {
    const p = Math.round(clamp(effectiveMuted ? 0 : volume, 0, 1) * 100)
    return `linear-gradient(to right, rgba(255,255,255,0.9) ${p}%, rgba(255,255,255,0.25) ${p}%)`
  }, [volume, effectiveMuted])

  return (
    <div
      ref={rootRef}
      className={clsx('video-player', className, {
        'video-player--controls-visible': controlsVisible,
      })}
      onMouseMove={showControls}
      onMouseLeave={hideControls}
      onClick={(e) => {
        if (isSeekingRef.current) return

        const interactive = e.target.closest?.(
          'button, input, a, textarea, select, label, [role="slider"], .video-player__progress-hit, .video-player__quality-menu'
        )
        if (interactive) return

        togglePlay()
      }}
    >
      <div className="video-player__video-wrapper">
        <video
          ref={videoRef}
          className="video-player__video"
          poster={poster}
          playsInline
          onLoadedMetadata={onLoadedMeta}
          onTimeUpdate={onTimeUpdate}
          onPlay={onPlay}
          onPause={onPause}
          onWaiting={onWaiting}
          onPlaying={onPlayingEv}
          onEnded={onEndedEv}
        />

        <div
          className={clsx('video-player__loading-overlay', {
            'video-player__loading-overlay--hidden': !noSrc && isReady && !isBuffering,
          })}
        />

        <div
          className={clsx('video-player__play-animation', {
            'video-player__play-animation--animate': playAnim,
          })}
          aria-hidden
        >
          <img
            src={isPlaying ? '/images/pause-white.svg' : '/images/play-white.svg'}
            alt={isPlaying ? 'Pause' : 'Play'}
            width={14}
            height={14}
            draggable={false}
          />
        </div>

        <div className="video-player__controls">
          <div
            ref={progressRef}
            className="video-player__progress-hit"
            onPointerDown={onProgressPointerDown}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration || 0)}
            aria-valuenow={Math.floor(currentTime || 0)}
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          >
            <div className="video-player__progress">
              <div className="video-player__progress-buffer" style={{ width: `${bufferedPct}%` }} />
              <div className="video-player__progress-filled" style={{ width: `${playedPct}%` }}>
                <div className="video-player__progress-thumb" />
              </div>
            </div>
          </div>

          <div className="video-player__buttons">
            <div className="video-player__left-controls">
              <button
                className="video-player__btn"
                type="button"
                onClick={togglePlay}
                aria-label="Play/Pause"
                disabled={noSrc}
              >
                <img
                  src={isPlaying ? '/images/pause-white.svg' : '/images/play-white.svg'}
                  alt={isPlaying ? 'Pause' : 'Play'}
                  width={14}
                  height={14}
                  draggable={false}
                />
              </button>

              <button
                className="video-player__btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  markGesture()
                  clearForcedMutedIfAny()
                  onPrev?.()
                }}
                aria-label="Previous"
                disabled={!hydrated || !hasPrev}
              >
                <img src="/images/prev-white.svg" alt="" width={14} height={14} draggable={false} />
              </button>

              <button
                className="video-player__btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  markGesture()
                  clearForcedMutedIfAny()
                  onNext?.()
                }}
                aria-label="Next"
                disabled={!hydrated || !hasNext}
              >
                <img src="/images/next-white.svg" alt="" width={14} height={14} draggable={false} />
              </button>

              <div className="video-player__volume">
                <button
                  className="video-player__btn"
                  type="button"
                  onClick={toggleMute}
                  aria-label="Mute"
                >
                  {effectiveMuted || volume === 0 ? <HiVolumeOff /> : <HiVolumeUp />}
                </button>

                <input
                  className={clsx('video-player__slider', 'video-player__volume-slider')}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={!hydrated ? 0 : effectiveMuted ? 0 : volume}
                  onChange={onVolumeChange}
                  style={!hydrated ? undefined : { background: volumeBg }}
                  aria-label="Volume"
                />
              </div>

              <div className="video-player__time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="video-player__right-controls">
              <button
                className={clsx('video-player__btn', loopEnabled && 'video-player__btn--active')}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  markGesture()
                  clearForcedMutedIfAny()
                  setLoopEnabled((v) => !v)
                }}
                aria-label={loopEnabled ? 'Loop: On' : 'Loop: Off'}
                title={loopEnabled ? 'Loop: On' : 'Loop: Off'}
              >
                <HiRefresh />
              </button>

              <div className="video-player__quality">
                <button
                  className="video-player__btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    markGesture()
                    clearForcedMutedIfAny()
                    setQualityOpen((s) => !s)
                  }}
                  aria-label="Quality"
                  disabled={noSrc}
                >
                  <HiCog />
                </button>

                <div
                  className={clsx('video-player__quality-menu', {
                    'video-player__quality-menu--open': qualityOpen,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  {qualitiesNorm
                    .slice()
                    .sort((a, b) => b - a)
                    .map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={clsx('video-player__quality-option', {
                          'video-player__quality-option--active': q === quality,
                        })}
                        onClick={() => {
                          markGesture()
                          clearForcedMutedIfAny()
                          setQuality(q)
                          dispatch(setPreferredQuality(q))
                          setQualityOpen(false)
                        }}
                      >
                        <span>{q}p</span>
                        {q === quality ? <span>✓</span> : null}
                      </button>
                    ))}
                </div>
              </div>

              <button
                className={clsx('video-player__btn', fullscreenWanted && 'video-player__btn--active')}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
                aria-label="Fullscreen"
                title={fullscreenWanted ? 'Fullscreen: On' : 'Fullscreen: Off'}
              >
                <HiArrowsExpand />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
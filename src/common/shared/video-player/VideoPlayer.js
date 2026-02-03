'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiCog, HiArrowsExpand } from 'react-icons/hi'

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

function canCountView({ duration, watchedSeconds }) {
  const d = Number(duration) || 0
  const w = Number(watchedSeconds) || 0
  if (!d || !w) return false

  if (d <= 60) {
    return w >= 15 || w / d >= 0.8
  }

  return w >= 30 || w / d >= 0.6
}

function safeSessionKey(videoId) {
  return videoId ? `mytube:viewed:${videoId}` : null
}

/**
 * sources shape (recommended):
 *  { "360": "url", "480": "url", "720": "url" }
 *
 * availableQualities: [360, 480, 720]
 *
 * NEW:
 *  videoId: string (required for view count)
 *  onView: async function(videoId) => Promise<void>
 */
export default function VideoPlayer({
  videoId,
  sources = {},
  poster,
  availableQualities = [360, 480, 720],
  initialQuality,
  autoPlay = false,
  onEnded,
  onView, // <= call your videoView here
  className,
}) {
  const videoRef = useRef(null)
  const rootRef = useRef(null)

  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)

  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [bufferedEnd, setBufferedEnd] = useState(0)

  const [volume, setVolume] = useState(0.2)
  const [muted, setMuted] = useState(false)

  const [controlsVisible, setControlsVisible] = useState(false)
  const [qualityOpen, setQualityOpen] = useState(false)
  const [theaterMode, setTheaterMode] = useState(false)

  const [playAnim, setPlayAnim] = useState(false)

  // --- VIEW TRACKING (anti-seek) ---
  const sentViewRef = useRef(false)
  const watchedSecondsRef = useRef(0)
  const lastTimeRef = useRef(0)
  const lastTickAtRef = useRef(0)

  const trySendView = useCallback(async () => {
    if (!videoId) return
    if (sentViewRef.current) return

    const key = safeSessionKey(videoId)
    if (key && typeof window !== 'undefined') {
      const already = window.sessionStorage.getItem(key)
      if (already === '1') {
        sentViewRef.current = true
        return
      }
    }

    if (!canCountView({ duration, watchedSeconds: watchedSecondsRef.current })) return

    sentViewRef.current = true
    if (key && typeof window !== 'undefined') {
      window.sessionStorage.setItem(key, '1')
    }

    // fire and forget (don’t block UI)
    try {
      await onView?.(videoId)
    } catch {
      // if request failed, we still keep it "sent" for MVP
      // (server can dedupe; client shouldn’t spam)
    }
  }, [videoId, onView, duration])

  // reset view tracking when video changes (by id) OR when we swap sources (quality)
  useEffect(() => {
    sentViewRef.current = false
    watchedSecondsRef.current = 0
    lastTimeRef.current = 0
    lastTickAtRef.current = 0

    const key = safeSessionKey(videoId)
    if (key && typeof window !== 'undefined') {
      if (window.sessionStorage.getItem(key) === '1') {
        sentViewRef.current = true
      }
    }
  }, [videoId])

  // pick default quality
  const defaultQuality = useMemo(() => {
    const qList = (availableQualities || [])
      .map((q) => Number(q))
      .filter((q) => Number.isFinite(q) && sources?.[String(q)])
      .sort((a, b) => a - b)

    if (initialQuality && sources?.[String(initialQuality)]) return Number(initialQuality)
    return qList.length ? qList[qList.length - 1] : 360
  }, [availableQualities, sources, initialQuality])

  const [quality, setQuality] = useState(defaultQuality)

  const activeSrc = useMemo(() => {
    return sources?.[String(quality)] || ''
  }, [sources, quality])

  // keep quality valid if sources change
  useEffect(() => {
    if (!sources?.[String(quality)]) setQuality(defaultQuality)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources, defaultQuality])

  // set src on change (preserve time)
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (!activeSrc) return

    const wasPlaying = !v.paused
    const t = v.currentTime || 0

    setIsBuffering(true)
    setIsReady(false)

    // reset anti-seek baselines on source change (quality swap)
    lastTimeRef.current = 0
    lastTickAtRef.current = 0

    v.src = activeSrc
    if (poster) v.poster = poster

    const onLoaded = () => {
      try {
        v.currentTime = clamp(t, 0, Math.max(0, (v.duration || 0) - 0.2))
      } catch {}
      setIsReady(true)
      setIsBuffering(false)
      if (wasPlaying || autoPlay) {
        v.play().catch(() => {})
      }
    }

    v.addEventListener('loadedmetadata', onLoaded, { once: true })
    v.load()

    return () => {
      v.removeEventListener('loadedmetadata', onLoaded)
    }
  }, [activeSrc, poster, autoPlay])

  // volume/mute sync
  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.volume = clamp(volume, 0, 1)
    v.muted = Boolean(muted)
  }, [volume, muted])

  const showControls = useCallback(() => {
    setControlsVisible(true)
  }, [])

  const hideControls = useCallback(() => {
    setControlsVisible(false)
    setQualityOpen(false)
  }, [])

  // auto-hide controls after some idle
  useEffect(() => {
    if (!controlsVisible) return
    const id = setTimeout(() => {
      if (!qualityOpen) setControlsVisible(false)
    }, 2200)
    return () => clearTimeout(id)
  }, [controlsVisible, qualityOpen, currentTime])

  // close quality menu on outside click
  useEffect(() => {
    if (!qualityOpen) return
    const onDoc = (e) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target)) setQualityOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [qualityOpen])

  const togglePlay = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play().catch(() => {})
      setPlayAnim(true)
      setTimeout(() => setPlayAnim(false), 450)
    } else {
      v.pause()
      setPlayAnim(true)
      setTimeout(() => setPlayAnim(false), 450)
    }
  }, [])

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return

    const t = v.currentTime || 0
    setCurrentTime(t)

    // buffered
    try {
      if (v.buffered && v.buffered.length) {
        const end = v.buffered.end(v.buffered.length - 1)
        setBufferedEnd(end || 0)
      }
    } catch {}

    // --- anti-seek watched time ---
    // Count only "reasonable" forward progress.
    // If user seeked forward a lot, don’t add it to watchedSeconds.
    const now = Date.now()
    const lastT = lastTimeRef.current || 0
    const lastTickAt = lastTickAtRef.current || 0

    const delta = t - lastT
    const wallDelta = lastTickAt ? (now - lastTickAt) / 1000 : 0

    // Accept small forward deltas. 1.2s is a safe cap for timeupdate jitter.
    // Also require that real time passed (prevents weird jumps).
    if (delta > 0 && delta <= 1.2 && (wallDelta === 0 || wallDelta <= 2.0) && !v.paused) {
      watchedSecondsRef.current += delta
      // attempt count view
      // (no await to keep it smooth)
      trySendView()
    }

    lastTimeRef.current = t
    lastTickAtRef.current = now
  }, [trySendView])

  const onLoadedMeta = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration || 0)
    setIsReady(true)

    // after duration known, maybe we already watched enough (rare)
    trySendView()
  }, [trySendView])

  const onPlay = useCallback(() => setIsPlaying(true), [])
  const onPause = useCallback(() => setIsPlaying(false), [])
  const onWaiting = useCallback(() => setIsBuffering(true), [])
  const onPlayingEv = useCallback(() => setIsBuffering(false), [])

  const onEndedEv = useCallback(() => {
    setIsPlaying(false)
    // if user ended the video, it definitely counts as view (fallback)
    // but only if not sent yet
    if (!sentViewRef.current) {
      watchedSecondsRef.current = Math.max(watchedSecondsRef.current, duration || 0)
      trySendView()
    }
    onEnded?.()
  }, [onEnded, trySendView, duration])

  const seekTo = useCallback(
    (clientX) => {
      const v = videoRef.current
      const bar = rootRef.current?.querySelector('.video-player__progress')
      if (!v || !bar || !duration) return
      const rect = bar.getBoundingClientRect()
      const p = clamp((clientX - rect.left) / rect.width, 0, 1)
      v.currentTime = p * duration

      // seek resets "anti-seek" baseline
      lastTimeRef.current = v.currentTime || 0
      lastTickAtRef.current = Date.now()
    },
    [duration]
  )

  const onProgressClick = useCallback(
    (e) => {
      seekTo(e.clientX)
    },
    [seekTo]
  )

  const onProgressMove = useCallback(
    (e) => {
      if (e.buttons !== 1) return
      seekTo(e.clientX)
    },
    [seekTo]
  )

  const toggleMute = useCallback(() => {
    setMuted((m) => !m)
  }, [])

  const onVolumeChange = useCallback(
    (e) => {
      const v = Number(e.target.value)
      setVolume(v)
      if (v > 0 && muted) setMuted(false)
    },
    [muted]
  )

  const toggleFullscreen = useCallback(async () => {
    const el = rootRef.current
    if (!el) return

    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    await el.requestFullscreen?.().catch(() => {})
  }, [])

  const bufferedPct = useMemo(() => {
    if (!duration) return 0
    return clamp((bufferedEnd / duration) * 100, 0, 100)
  }, [bufferedEnd, duration])

  const playedPct = useMemo(() => {
    if (!duration) return 0
    return clamp((currentTime / duration) * 100, 0, 100)
  }, [currentTime, duration])

  const volumeBg = useMemo(() => {
    const p = Math.round(clamp(volume, 0, 1) * 100)
    return `linear-gradient(to right, rgba(255,255,255,0.9) ${p}%, rgba(255,255,255,0.25) ${p}%)`
  }, [volume])

  return (
    <div
      ref={rootRef}
      className={clsx('video-player', className, {
        'video-player--theater': theaterMode,
        'video-player--controls-visible': controlsVisible,
      })}
      onMouseMove={showControls}
      onMouseLeave={hideControls}
      onClick={(e) => {
        const btn = e.target.closest?.('button')
        if (btn) return
        togglePlay()
      }}
    >
      <div className="video-player__video-wrapper">
        <video
          ref={videoRef}
          className="video-player__video"
          poster={poster}
          playsInline
          autoPlay={autoPlay}
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
            'video-player__loading-overlay--hidden': isReady && !isBuffering,
          })}
        />

        <div
          className={clsx('video-player__play-animation', {
            'video-player__play-animation--animate': playAnim,
          })}
          aria-hidden
        >
          {isPlaying ? <HiPause /> : <HiPlay />}
        </div>

        <div className="video-player__controls">
          <div
            className="video-player__progress"
            onClick={onProgressClick}
            onMouseMove={onProgressMove}
            role="slider"
            aria-label="Seek"
          >
            <div className="video-player__progress-buffer" style={{ width: `${bufferedPct}%` }} />
            <div className="video-player__progress-filled" style={{ width: `${playedPct}%` }}>
              <div className="video-player__progress-thumb" />
            </div>
          </div>

          <div className="video-player__buttons">
            <div className="video-player__left-controls">
              <button
                className="video-player__btn"
                type="button"
                onClick={togglePlay}
                aria-label="Play/Pause"
              >
                {isPlaying ? <HiPause /> : <HiPlay />}
              </button>

              <div className="video-player__volume">
                <button
                  className="video-player__btn"
                  type="button"
                  onClick={toggleMute}
                  aria-label="Mute"
                >
                  {muted || volume === 0 ? <HiVolumeOff /> : <HiVolumeUp />}
                </button>

                <input
                  className={clsx('video-player__slider', 'video-player__volume-slider')}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={muted ? 0 : volume}
                  onChange={onVolumeChange}
                  style={{ background: volumeBg }}
                  aria-label="Volume"
                />
              </div>

              <div className="video-player__time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="video-player__right-controls">
              <div className="video-player__quality">
                <button
                  className="video-player__btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setQualityOpen((s) => !s)
                  }}
                  aria-label="Quality"
                >
                  <HiCog />
                </button>

                <div
                  className={clsx('video-player__quality-menu', {
                    'video-player__quality-menu--open': qualityOpen,
                  })}
                  onClick={(e) => e.stopPropagation()}
                >
                  {availableQualities
                    .map((q) => Number(q))
                    .filter((q) => sources?.[String(q)])
                    .sort((a, b) => b - a)
                    .map((q) => (
                      <button
                        key={q}
                        type="button"
                        className={clsx('video-player__quality-option', {
                          'video-player__quality-option--active': q === quality,
                        })}
                        onClick={() => {
                          setQuality(q)
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
                className="video-player__btn"
                type="button"
                onClick={toggleFullscreen}
                aria-label="Fullscreen"
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

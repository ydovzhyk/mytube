'use client'

import clsx from 'clsx'
import Link from 'next/link'
import Image from 'next/image'

function formatDuration(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }
  return `${m}:${String(ss).padStart(2, '0')}`
}

export default function MiniVideoCard({
  video,
  active = false,
  onClick,
  showChannel = true,
  size = 'md', // 'md' | 'sm'

  showPublishBadge = false,
  publishLabelPublished = 'Published',
  publishLabelDraft = 'Draft',
  setGestureOnClick = true,

  mode = 'navigate', // 'navigate' | 'action'
}) {
  if (!video?._id) return null

  const durationLabel = video?.duration ? formatDuration(video.duration) : ''

  const id = String(video._id)
  const thumb = video.thumbnailUrl
  const title = video.title || 'Untitled'

  const ch = video.channelSnapshot || {}
  const rawHandle = String(ch.handle || '')
    .trim()
    .replace(/^@+/, '')
  const handleLabel = rawHandle ? `@${rawHandle}` : ''
  const channelLabel = handleLabel || ch.name || ch.title || 'Channel'

  const views = video?.stats?.views ?? 0
  const date = new Date(video.publishedAt || video.createdAt).toLocaleDateString()

  const isPublished = Boolean(video?.isPublished)

  const watchHref = `/watch/${id}`
  const channelHref = rawHandle ? `/channel/@${rawHandle}` : null

  const setGesture = () => {
    if (setGestureOnClick && typeof window !== 'undefined') {
      sessionStorage.setItem('mytube:gesture', '1')
    }
  }

  const onActionClick = () => {
    setGesture()
    onClick?.(video)
  }

  if (mode === 'action') {
    return (
      <button
        type="button"
        className={clsx(
          'mini-video-card',
          `mini-video-card--${size}`,
          active && 'mini-video-card--active'
        )}
        onClick={onActionClick}
        title={title}
      >
        <div className="mini-video-card__thumb">
          {thumb ? (
            <Image src={thumb} alt={title} fill sizes="160px" className="mini-video-card__img" />
          ) : (
            <div className="mini-video-card__thumbFallback" />
          )}

          {showPublishBadge ? (
            <span
              className={clsx(
                'mini-video-card__badge',
                isPublished ? 'mini-video-card__badge--published' : 'mini-video-card__badge--draft'
              )}
            >
              {isPublished ? publishLabelPublished : publishLabelDraft}
            </span>
          ) : null}

          {durationLabel ? (
            <span className="mini-video-card__duration" aria-label={`Duration ${durationLabel}`}>
              {durationLabel}
            </span>
          ) : null}
        </div>

        <div className="mini-video-card__info">
          <div className="mini-video-card__title">{title}</div>

          {showChannel ? <div className="mini-video-card__channel">{channelLabel}</div> : null}

          <div className="mini-video-card__meta">
            <span>{views} views</span>
            <span>{date}</span>
          </div>
        </div>
      </button>
    )
  }

  // NAVIGATE MODE (default): thumb+title -> watch, channel -> channel page
  return (
    <div
      className={clsx(
        'mini-video-card',
        `mini-video-card--${size}`,
        active && 'mini-video-card--active'
      )}
      title={title}
    >
      <Link
        href={watchHref}
        className="mini-video-card__thumb"
        onClick={() => setGesture()}
        aria-label={`Watch: ${title}`}
      >
        {thumb ? (
          <Image src={thumb} alt={title} fill sizes="160px" className="mini-video-card__img" />
        ) : (
          <div className="mini-video-card__thumbFallback" />
        )}

        {showPublishBadge ? (
          <span
            className={clsx(
              'mini-video-card__badge',
              isPublished ? 'mini-video-card__badge--published' : 'mini-video-card__badge--draft'
            )}
          >
            {isPublished ? publishLabelPublished : publishLabelDraft}
          </span>
        ) : null}

        {durationLabel ? (
          <span className="mini-video-card__duration" aria-label={`Duration ${durationLabel}`}>
            {durationLabel}
          </span>
        ) : null}
      </Link>

      <div className="mini-video-card__info">
        <Link href={watchHref} className="mini-video-card__titleLink" onClick={() => setGesture()}>
          <div className="mini-video-card__title">{title}</div>
        </Link>

        {showChannel ? (
          channelHref ? (
            <Link href={channelHref} className="mini-video-card__channelLink">
              <div className="mini-video-card__channel">{channelLabel}</div>
            </Link>
          ) : (
            <div className="mini-video-card__channel">{channelLabel}</div>
          )
        ) : null}

        <div className="mini-video-card__meta">
          <span>{views} views</span>
          <span>{date}</span>
        </div>
      </div>
    </div>
  )
}

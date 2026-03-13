'use client'

import Link from 'next/link'
import Avatar from '../avatar/Avatar'
import T from '@/common/shared/i18n/T'

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

export default function VideoCard({
  video,
  mode = 'default',
  selectable = false,
  selected = false,
  onToggleSelect,
  playlistMemberships = [],
}) {
  if (!video) return null

  const isSearchMode = mode === 'search'
  const canSelect = isSearchMode && selectable

  const durationLabel = video?.duration ? formatDuration(video.duration) : ''

  const thumb = video.thumbnailUrl
  const ch = video.channelSnapshot || {}
  const avatar = ch.avatarUrl

  const handle = ch.handle ? `@${ch.handle}` : null
  const channelLabel = handle || ch.name || ch.title || 'Channel'
  const channelHref = handle ? `/channel/${handle}` : null

  const views = video?.stats?.views ?? 0
  const date = new Date(video.publishedAt || video.createdAt).toLocaleDateString()
  const videoId = video._id || ''

  const hasMemberships = Array.isArray(playlistMemberships) && playlistMemberships.length > 0
  const firstPlaylistTitle = hasMemberships
    ? String(playlistMemberships[0]?.title || '').trim()
    : ''
  const manyMemberships = playlistMemberships.length > 1

  const handleToggle = () => {
    if (!canSelect || !videoId || typeof onToggleSelect !== 'function') return
    onToggleSelect(videoId)
  }

  const stopEvent = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <div
      className={`video-card ${canSelect ? 'video-card--search' : ''} ${selected ? 'is-selected' : ''}`}
    >
      <Link
        className="video-card__thumbLink"
        href={`/watch/${videoId}`}
        onClick={() => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('mytube:gesture', '1')
          }
        }}
      >
        <div className="video-card__thumbnail">
          <img src={thumb} alt={video.title} />
          {durationLabel ? <span className="video-card__duration">{durationLabel}</span> : null}
        </div>
      </Link>

      <div className="video-card__content">
        {channelHref ? (
          <Link href={channelHref} className="video-card__avatarLink" aria-label="Open channel">
            <Avatar src={avatar} alt={ch.name || 'Channel'} size="md" />
          </Link>
        ) : (
          <Avatar src={avatar} alt={ch.name || 'Channel'} size="md" />
        )}

        <div className="video-card__info">
          <h3 className="video-card__title" title={video.title}>
            {video.title}
          </h3>

          {channelHref ? (
            <Link className="video-card__channel" href={channelHref} title="Open channel">
              {channelLabel}
            </Link>
          ) : (
            <div className="video-card__channel">{channelLabel}</div>
          )}

          <p className="video-card__meta">
            <span>{views} views</span>
            <span>{date}</span>
          </p>
        </div>
      </div>

      {canSelect || hasMemberships ? (
        <div className="video-card__footer">
          {canSelect ? (
            <label className="video-card__select" onClick={stopEvent} onMouseDown={stopEvent}>
              <input
                type="checkbox"
                checked={selected}
                onChange={handleToggle}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="video-card__selectLabel">
                <T>Add to my playlist</T>
              </span>
            </label>
          ) : null}

          {hasMemberships ? (
            <div className="video-card__membership">
              <span className="video-card__membershipText">
                <T>Already in playlist</T>: {firstPlaylistTitle}
                {manyMemberships ? ` +${playlistMemberships.length - 1}` : ''}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

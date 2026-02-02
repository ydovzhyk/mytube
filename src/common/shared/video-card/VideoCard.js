'use client'

import Link from 'next/link'
import Avatar from '../avatar/Avatar'

export default function VideoCard({ video }) {
  if (!video) return null

  const thumb = video.thumbnailUrl
  const ch = video.channelSnapshot
  const avatar = ch.avatarUrl
  const channelLabel = ch.handle ? `@${ch.handle}` : ch.name || ch.title || 'Channel'
  const views = video?.stats?.views ?? 0
  const date = new Date(video.publishedAt || video.createdAt).toLocaleDateString()
  const videoId = video._id || ''

  return (
    <div className="video-card">
      <Link className="video-card__thumbLink" href={`/watch/${videoId}`}>
        <div className="video-card__thumbnail">
          <img src={thumb} alt={video.title} />
        </div>
      </Link>

      <div className="video-card__content">
        <Avatar src={avatar} alt={ch.name || 'Channel'} size="md" />

        <div className="video-card__info">
          <h3 className="video-card__title" title={video.title}>
            {video.title}
          </h3>

          <div className="video-card__channel">{channelLabel}</div>

          <p className="video-card__meta">
            <span>{views} views</span>
            <span>{date}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

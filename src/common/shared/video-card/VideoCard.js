'use client'

import Link from 'next/link'
import Avatar from '../avatar/Avatar'

export default function VideoCard({ video }) {
  if (!video) return null

  const thumb = video.thumbnailUrl || 'https://via.placeholder.com/640x360?text=No+thumbnail'

  const avatar =
    video.channel?.avatarUrl || `https://i.pravatar.cc/36?u=${video.channel?.id || video.id}`

  const channelLabel = video.channel?.handle
    ? `@${video.channel.handle}`
    : video.channel?.name || 'Channel'

  const date = new Date(video.publishedAt || video.createdAt).toLocaleDateString()

  return (
    <div className="video-card">
      <Link className="video-card__thumbLink" href={`/watch/${video._id || video.id || ''}`}>
        <div className="video-card__thumbnail">
          <img src={thumb} alt={video.title} />
        </div>
      </Link>

      <div className="video-card__content">
        <Avatar src={avatar} alt={video.channel?.name || 'Channel'} size="md" />
        {/* <img
          src={avatar}
          alt={video.channel?.name || 'Channel'}
          className="video-card__avatar"
          width={36}
          height={36}
        /> */}

        <div className="video-card__info">
          <h3 className="video-card__title" title={video.title}>
            {video.title}
          </h3>

          <div className="video-card__channel">{channelLabel}</div>

          <p className="video-card__meta">
            <span>{video.views ?? 0} views</span>
            <span>{date}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

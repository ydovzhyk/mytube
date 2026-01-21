'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getVideos } from '../../store/videos/videos-operations'
import { getVideosList } from '../../store/videos/videos-selectors'

export default function HomePage() {
  const dispatch = useDispatch()
  const videos = useSelector(getVideosList)
  console.log('Videos on HomePage:', videos)

  useEffect(() => {
    dispatch(getVideos())
  }, [dispatch])

  return (
    <div>
      <div className="page-header">
        <h1 className="page-header__title">Welcome to MyTube!</h1>
      </div>

      <div className="video-grid">
        {videos?.length ? (
          videos.map((video) => (
            <div className="video-card" key={video.id}>
              <div className="video-card__thumbnail">
                <img
                  src={video.thumbnailUrl || "https://via.placeholder.com/640x360?text=No+thumbnail"}
                  alt={video.title}
                />
              </div>

              <div className="video-card__content">
                <img
                  src={video.channel?.avatarUrl || `https://i.pravatar.cc/36?u=${video.channel?.id || video.id}`}
                  alt={video.channel?.name || "Channel"}
                  className="video-card__avatar"
                  style={{ width: 36, height: 36, borderRadius: '50%' }}
                />

                <div className="video-card__info">
                <h3 className="video-card__title">{video.title}</h3>
                <div className="video-card__channel">
                  {video.channel?.handle ? `@${video.channel.handle}` : (video.channel?.name || 'Channel')}
                </div>
                <p className="video-card__meta">
                  <span>{video.views} views</span>
                  <span>{new Date(video.publishedAt || video.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            </div>
          </div>
        ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No videos found</div>
        )}
      </div>
    </div>
  )
}

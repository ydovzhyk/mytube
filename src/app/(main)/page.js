'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getVideos } from '../../store/videos/videos-operations'
import { getVideosList } from '../../store/videos/videos-selectors'
import VideoCard from '@/common/shared/video-card/VideoCard'

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
            <VideoCard key={video.id} video={video} />
        ))
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>No videos found</div>
        )}
      </div>
    </div>
  )
}

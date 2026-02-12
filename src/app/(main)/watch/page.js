'use client'

import { useDispatch } from 'react-redux'
import { videoView } from '@/store/videos/videos-operations'
import Avatar from '@/common/shared/avatar/Avatar'
import Button from '@/common/shared/button/Button'
import VideoPlayer from '@/common/shared/video-player/VideoPlayer'
import { HiOutlineHeart } from 'react-icons/hi'

export default function WatchPage() {
  const dispatch = useDispatch()

  const currentVideo = {
    _id: '698200fe133f75ebe64301f2',
    thumbnailUrl:
      'https://storage.googleapis.com/mytube-dev.firebasestorage.app/videos/698200fe133f75ebe64301f2/thumbnail.png',
    sources: {
      360: 'https://storage.googleapis.com/mytube-dev.firebasestorage.app/videos/698200fe133f75ebe64301f2/360p.mp4',
      480: 'https://storage.googleapis.com/mytube-dev.firebasestorage.app/videos/698200fe133f75ebe64301f2/480p.mp4',
      720: 'https://storage.googleapis.com/mytube-dev.firebasestorage.app/videos/698200fe133f75ebe64301f2/720p.mp4',
    },
    availableQualities: [360, 480, 720],
  }
  return (
    <div className="watch-page">
      <div className="watch-page__main">
        <VideoPlayer
          videoId={currentVideo._id}
          poster={currentVideo.thumbnailUrl}
          sources={currentVideo.sources}
          availableQualities={currentVideo.availableQualities}
          initialQuality={720}
          autoPlay={false}
          onView={(id) => dispatch(videoView(id))}
        />

        <div className="video-info">
          <h1 className="video-info__title">Video Title</h1>

          <div className="video-info__meta">
            <div className="video-info__stats">
              <span>12,453 views</span>
              <span>2 days ago</span>
            </div>

            <div className="video-info__actions">
              <button className="video-info__action">
                <HiOutlineHeart />
                <span>342</span>
              </button>
            </div>
          </div>
        </div>

        <div className="channel-info">
          <div className="channel-info__left">
            {/* <Avatar src={null} size="lg" /> */}
            <div className="channel-info__details">
              {/* <a href="/channel/@channel" className="channel-info__name">
                Channel Name
              </a> */}
              <span className="channel-info__subscribers">125K subscribers</span>
            </div>
          </div>

          <Button variant="primary">Subscribe</Button>
        </div>

        <div className="video-description">
          <div className="video-description__content">
            Video description will appear here Video description will appear here Video description
            will appear here Video description will appear here Video description will appear
            here...
          </div>
        </div>

        <div className="comments-section">
          <div className="comments-section__header">
            <h3>Comments</h3>
            <span>0</span>
          </div>

          <form className="comments-section__form">
            <textarea className="comments-section__input" placeholder="Add a comment..." rows={2} />
            <Button type="button" variant="primary">
              Comment
            </Button>
          </form>

          <div className="comments-section__list"></div>
        </div>
      </div>

      <div className="watch-page__sidebar">
        <div className="similar-videos">
          <h3 className="similar-videos__header">Similar Videos</h3>
          <div className="similar-videos__list">{}</div>
        </div>
      </div>
    </div>
  )
}

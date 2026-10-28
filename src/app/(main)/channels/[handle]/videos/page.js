'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import Link from 'next/link'

import { getChannels } from '@/store/channel/channel-selectors'
import ChannelManageVideos from '@/common/components/channels/ChannelManageVideos'
import T from '@/common/shared/i18n/T'

function safeHandle(raw = '') {
  const decoded = decodeURIComponent(String(raw || ''))
  return decoded.replace(/^@+/, '').trim().toLowerCase()
}

export default function ManageChannelVideosPage() {
  const params = useParams()
  const handle = safeHandle(params?.handle)
  const channels = useSelector(getChannels)

  const channel = useMemo(() => {
    if (!handle) return null
    return channels?.find((c) => String(c.handle || '').toLowerCase() === handle) || null
  }, [channels, handle])

  if (!handle) {
    return (
      <div className="channels-page">
        <p>
          <T>Channel handle is missing</T>
        </p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="channels-page">
        <p>
          <T>Channel not found</T> (@{handle})
        </p>
        <Link href="/channels">
          <T caseMode="sentence">back to channels</T>
        </Link>
      </div>
    )
  }

  return (
    <div className="channels-page">
      <ChannelManageVideos channel={channel} />
    </div>
  )
}

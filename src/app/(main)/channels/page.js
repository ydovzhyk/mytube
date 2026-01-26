'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { getChannels, getChannelsLoading } from '@/store/channel/channel-selectors'

export default function ChannelsPage() {
  const router = useRouter()
  const channels = useSelector(getChannels)
  const isLoading = useSelector(getChannelsLoading)

  useEffect(() => {
    if (isLoading) return

    if (!channels.length) {
      router.replace('/channels/create')
      return
    }

    const lastChannel = channels[0]
    router.replace(`/channels/@${lastChannel.handle}`)
  }, [channels, isLoading, router])

  return <div className="channels-page" />
}

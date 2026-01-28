'use client'

import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchMyChannels } from '@/store/channel/channel-operations'
import { channelsBoot } from '@/store/channel/channel-slice'

export default function ChannelsBootstrap() {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(channelsBoot())
    dispatch(fetchMyChannels())
  }, [dispatch])

  return null
}

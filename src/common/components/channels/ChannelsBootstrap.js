'use client'

import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { fetchMyChannels } from '@/store/channel/channel-operations'

export default function ChannelsBootstrap() {
  const dispatch = useDispatch()

  const didRunRef = useRef(false)

  useEffect(() => {
    if (didRunRef.current) return
    didRunRef.current = true

    dispatch(fetchMyChannels())
  }, [dispatch])

  return null
}

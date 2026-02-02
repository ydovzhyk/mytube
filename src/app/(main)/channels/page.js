'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDispatch } from 'react-redux'
import { fetchMyChannels } from '@/store/channel/channel-operations'

export default function ChannelsPage() {
  const router = useRouter()
  const dispatch = useDispatch()
  const didRun = useRef(false)

  useEffect(() => {
    if (didRun.current) return
    didRun.current = true
    ;(async () => {
      try {
        const data = await dispatch(fetchMyChannels()).unwrap()
        const channels = Array.isArray(data?.channels) ? data.channels : []

        if (!channels.length) {
          router.replace('/channels/create')
          return
        }

        router.replace(`/channels/@${channels[0].handle}`)
      } catch (e) {
        router.replace('/channels/create')
      }
    })()
  }, [dispatch, router])

  return <div className="channels-page" />
}

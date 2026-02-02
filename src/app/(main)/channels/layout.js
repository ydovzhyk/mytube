'use client'

import '@/styles/layout/_main.scss'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'

import ChannelsHeader from '@/common/components/channels/ChannelsHeader'
import { fetchMyChannels } from '@/store/channel/channel-operations'
import { getChannels } from '@/store/channel/channel-selectors'

export default function ChannelsLayout({ children }) {
  const pathname = usePathname()
  const dispatch = useDispatch()

  const channels = useSelector(getChannels)
  const didFetchRef = useRef(false)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  useEffect(() => {
    if (!pathname) return

    const isRootChannelsPage = pathname === '/channels'
    if (isRootChannelsPage) return

    if (didFetchRef.current) return
    didFetchRef.current = true

    dispatch(fetchMyChannels())
  }, [dispatch, pathname, channels?.length])

  return (
    <div className="channels-shell">
      <ChannelsHeader />
      <div className="channels-layout">{children}</div>
    </div>
  )
}

'use client'

import '@/styles/layout/_main.scss'
import ChannelsBootstrap from '@/common/components/channels/ChannelsBootstrap'
import ChannelsHeader from '@/common/components/channels/ChannelsHeader'

export default function ChannelsLayout({ children }) {
  return (
    <div className="channels-shell">
      <ChannelsBootstrap />
      <ChannelsHeader />
      <div className="channels-layout">
        {children}
      </div>
    </div>
  )
}

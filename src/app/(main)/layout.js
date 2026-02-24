'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import clsx from 'clsx'
import { Header } from '@/common/components/header/Header'
import { Sidebar } from '@/common/components/sidebar/Sidebar'
const PlayerShell = dynamic(() => import('@/common/shared/video-player/PlayerShell'), {
  ssr: false,
})

export default function MainLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const handleMenuClick = () => {
    setIsSidebarCollapsed((prev) => !prev)
  }

  return (
    <div
      className={clsx('main-layout', {
        'main-layout--sidebar-collapsed': isSidebarCollapsed,
      })}
    >
      <Header onMenuClick={handleMenuClick} />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main className="main-layout__content">{children}</main>
      <PlayerShell />
    </div>
  )
}

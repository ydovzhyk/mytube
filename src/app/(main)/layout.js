'use client'
import { Header } from '@/common/components/header/Header'
import { Sidebar } from '@/common/components/sidebar/Sidebar'
import clsx from 'clsx'
import { useState } from 'react'

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
    </div>
  )
}

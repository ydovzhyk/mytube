'use client'

import Link from 'next/link'
import clsx from 'clsx'
import { usePathname } from 'next/navigation'
import { useMyChannels } from '../../shared/hooks/use-channels'
import Avatar from '../../shared/avatar/Avatar'
import T from '@/common/shared/i18n/T'
import { HiClock, HiCog, HiCollection, HiHeart, HiHome } from 'react-icons/hi'

const mainNavItems = [
  { href: '/', icon: HiHome, label: 'Home' },
  { href: '/subscriptions', icon: HiCollection, label: 'Subscriptions', auth: true },
]

const libraryItems = [
  { href: '/history', icon: HiClock, label: 'History', auth: true },
  { href: '/liked', icon: HiHeart, label: 'Liked videos', auth: true },
]

export function Sidebar({ isCollapsed }) {
  const pathname = usePathname()
  const { data: channels = [] } = useMyChannels() // ✅ дефолт

  return (
    <aside
      className={clsx('sidebar', {
        'sidebar--collapsed': isCollapsed,
      })}
    >
      <div className="sidebar__content">
        <nav className="sidebar__section">
          <div className="sidebar__nav">
            {mainNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className={clsx('sidebar__item', {
                    'sidebar__item--active': isActive,
                  })}
                >
                  <Icon className="sidebar__item-icon" />
                  <span className="sidebar__item-text">
                    <T caseMode="sentence">{item.label}</T>
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        <nav className="sidebar__section">
          <h3 className="sidebar__section-title">
            <T caseMode="sentence">Library</T>
          </h3>

          <div className="sidebar__nav">
            {libraryItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx('sidebar__item', {
                    'sidebar__item--active': isActive,
                  })}
                >
                  <Icon className="sidebar__item-icon" />
                  <span className="sidebar__item-text">
                    <T caseMode="sentence">{item.label}</T>
                  </span>
                </Link>
              )
            })}
          </div>
        </nav>

        {!!channels.length && (
          <nav className="sidebar__section">
            <div className="sidebar__divider">
              <span className="sidebar__divider-text">
                <T caseMode="sentence">Subscriptions</T>
              </span>
            </div>

            <div className="sidebar__nav">
              {channels.slice(0, 5).map((channel, ind) => {
                const isActive = pathname === `/channel/${channel.handle}`

                return (
                  <Link
                    key={channel.id}
                    href={`/channel/${channel.handle}`}
                    className={clsx('sidebar__subscription', {
                      'sidebar__subscription--active': isActive,
                    })}
                  >
                    <Avatar
                      src={`https://i.pravatar.cc/36?img=${ind + 1}`}
                      alt={channel?.owner?.name || channel.handle}
                      size="xs"
                    />
                    <span className="sidebar__subscription-name">
                      {channel?.owner?.name || channel.handle}
                    </span>
                  </Link>
                )
              })}
            </div>
          </nav>
        )}

        <nav className="sidebar__section">
          <div className="sidebar__nav">
            <Link
              href="/studio/settings"
              className={clsx('sidebar__item', {
                'sidebar__item--active': pathname === '/studio/settings',
              })}
            >
              <HiCog className="sidebar__item-icon" />
              <span className="sidebar__item-text">
                <T caseMode="sentence">Settings</T>
              </span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}

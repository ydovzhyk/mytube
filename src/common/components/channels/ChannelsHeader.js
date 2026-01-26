'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useSelector } from 'react-redux'

import T from '@/common/shared/i18n/T'
import { getChannels } from '@/store/channel/channel-selectors'

export default function ChannelsHeader() {
  const pathname = usePathname()
  const channels = useSelector(getChannels) || []

  // /channels/@handle OR /channels/create OR /channels
  const isCreate = pathname === '/channels/create'
  const activeHandleFromPath = (() => {
    const m = pathname.match(/^\/channels\/@([^/]+)$/)
    return m?.[1]?.toLowerCase() || null
  })()

  return (
    <div className="channels-header">
      <div className="channels-header__inner">
        <Link
          href="/channels/create"
          className={clsx('channels-tab', 'channels-tab--add', {
            'channels-tab--active': isCreate,
          })}
        >
          <span className="channels-tab__plus" aria-hidden="true">
            +
          </span>
          <span className="channels-tab__text">
            <T caseMode="sentence">channel</T>
          </span>
        </Link>

        <div className="channels-header__tabs" role="tablist" aria-label="Your channels">
          {channels.map((ch) => {
            const handle = (ch?.handle || '').toLowerCase()
            const label = handle ? `@${handle}` : '@channel'
            const href = handle ? `/channels/@${handle}` : '/channels'

            const isActive = (!!handle && activeHandleFromPath === handle) || pathname === href

            return (
              <Link
                key={ch?._id || handle || href}
                href={href}
                className={clsx('channels-tab', {
                  'channels-tab--active': isActive,
                })}
                role="tab"
                aria-selected={isActive}
              >
                <span className="channels-tab__text">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

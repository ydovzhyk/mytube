'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { createPortal } from 'react-dom'

import T from '@/common/shared/i18n/T'
import { getChannels } from '@/store/channel/channel-selectors'

function parseActiveHandle(pathname = '') {
  const parts = pathname.split('/')
  const maybe = parts[2] // /channels/@handle/...
  if (!maybe?.startsWith('@')) return null
  return maybe.slice(1).toLowerCase()
}

function isPlaylistsRoute(pathname = '') {
  return /^\/channels\/@[^/]+\/playlists(\/|$)/.test(pathname)
}

// match helper: "/channels/@handle" + any subpath
function isInChannelPath(pathname = '', handleLower = '') {
  if (!handleLower) return false
  return new RegExp(`^\\/channels\\/@${handleLower}(\\/|$)`).test(pathname)
}

export default function ChannelsHeader({ playlists = [], activePlaylistId = null }) {
  const pathname = usePathname()
  const channels = useSelector(getChannels)

  const isCreateChannel = pathname === '/channels/create'
  const playlistsMode = isPlaylistsRoute(pathname)
  const activeHandleFromPath = useMemo(() => parseActiveHandle(pathname), [pathname])

  const activeChannel = useMemo(() => {
    if (!activeHandleFromPath) return null
    return (
      channels.find((c) => String(c?.handle || '').toLowerCase() === activeHandleFromPath) || null
    )
  }, [channels, activeHandleFromPath])

  // =========================
  // MODE B: playlists switch
  // =========================
  const [isSwitchOpen, setIsSwitchOpen] = useState(false)
  const switchRef = useRef(null)

  useEffect(() => {
    if (!isSwitchOpen) return

    const onDoc = (e) => {
      if (!switchRef.current) return
      if (!switchRef.current.contains(e.target)) setIsSwitchOpen(false)
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') setIsSwitchOpen(false)
    }

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
    }
  }, [isSwitchOpen])

  const activeHandle = activeChannel?.handle || activeHandleFromPath
  const channelHref = activeHandle ? `/channels/@${activeHandle}` : '/channels'
  const playlistsHref = activeHandle ? `/channels/@${activeHandle}/playlists` : '/channels'
  const newPlaylistHref = activeHandle ? `/channels/@${activeHandle}/playlists/create` : '/channels'

  // =========================
  // MODE A: manage dropdown (portal + fixed)
  // =========================
  const [openHandle, setOpenHandle] = useState(null) // lower-case handle or null
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 })

  const anchorWrapRef = useRef(null) // current .channels-item (pill+chevron)
  const menuRef = useRef(null)

  const closeMenu = useCallback(() => {
    setOpenHandle(null)
    anchorWrapRef.current = null
  }, [])

  const calcMenuPos = useCallback(() => {
    if (!anchorWrapRef.current) return
    const r = anchorWrapRef.current.getBoundingClientRect()
    const gap = 10

    setMenuPos({
      left: Math.max(8, r.left),
      top: Math.max(8, r.bottom + gap),
    })
  }, [])

  useEffect(() => {
    if (!openHandle) return

    calcMenuPos()

    const onDoc = (e) => {
      if (anchorWrapRef.current && anchorWrapRef.current.contains(e.target)) return
      if (menuRef.current && menuRef.current.contains(e.target)) return
      closeMenu()
    }
    const onEsc = (e) => {
      if (e.key === 'Escape') closeMenu()
    }
    const onScroll = () => calcMenuPos()
    const onResize = () => calcMenuPos()

    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onEsc)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)

    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onEsc)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [openHandle, calcMenuPos, closeMenu])

  const toggleMenuFor = (handleLower, wrapperEl) => {
    anchorWrapRef.current = wrapperEl
    setOpenHandle((prev) => (prev === handleLower ? null : handleLower))
    setTimeout(calcMenuPos, 0)
  }

  // TODO: підв’яжи свій thunk
  const onDeleteChannel = async ({ handleLower, id }) => {
    const ok = window.confirm(`Delete channel @${handleLower}? This action cannot be undone.`)
    if (!ok) return
    closeMenu()
    // dispatch(deleteChannel(id))
  }

  const renderManageMenu = (ch) => {
    if (typeof document === 'undefined') return null

    const handleLower = String(ch?.handle || '').toLowerCase()
    if (!openHandle || openHandle !== handleLower) return null

    // routes
    const editHref = `/channels/@${handleLower}/edit`
    const uploadHref = `/channels/@${handleLower}/upload`
    const createPlaylistHref = `/channels/@${handleLower}/playlists/create`
    const managePlaylistsHref = `/channels/@${handleLower}/playlists`
    const manageVideosHref = `/channels/@${handleLower}/videos`

    // active checks (make them robust)
    const editActive = pathname === editHref
    const uploadActive = pathname === uploadHref
    const playlistsActive = new RegExp(`^\\/channels\\/@${handleLower}\\/playlists(\\/|$)`).test(
      pathname
    )
    const videosActive = new RegExp(`^\\/channels\\/@${handleLower}\\/videos(\\/|$)`).test(pathname)

    // If you later add "/channels/@handle/upload/*" or "/edit/*" pages:
    // you can replace === with regex too.

    return createPortal(
      <div
        ref={menuRef}
        className={clsx('channels-switch__menu', 'channels-manage-portal')}
        role="menu"
        style={{ left: `${menuPos.left}px`, top: `${menuPos.top}px` }}
      >
        <Link
          href={editHref}
          className={clsx('channels-switch__item', 'channels-manage-item', {
            'channels-switch__item--active': editActive,
          })}
          onClick={closeMenu}
        >
          <T caseMode="sentence">edit channel</T>
        </Link>

        <Link
          href={uploadHref}
          className={clsx('channels-switch__item', 'channels-manage-item', {
            'channels-switch__item--active': uploadActive,
          })}
          onClick={closeMenu}
        >
          <T caseMode="sentence">upload video</T>
        </Link>

        <div className="channels-switch__divider" />

        <Link
          href={createPlaylistHref}
          className={clsx('channels-switch__item', 'channels-manage-item', {
            'channels-switch__item--active': pathname === createPlaylistHref,
          })}
          onClick={closeMenu}
        >
          <T caseMode="sentence">create playlist</T>
        </Link>

        <Link
          href={managePlaylistsHref}
          className={clsx('channels-switch__item', 'channels-manage-item', {
            'channels-switch__item--active': playlistsActive,
          })}
          onClick={closeMenu}
        >
          <T caseMode="sentence">manage playlists</T>
        </Link>

        <div className="channels-switch__divider" />

        <Link
          href={manageVideosHref}
          className={clsx('channels-switch__item', 'channels-manage-item', {
            'channels-switch__item--active': videosActive,
          })}
          onClick={closeMenu}
        >
          <T caseMode="sentence">manage videos</T>
        </Link>

        <div className="channels-switch__divider" />

        <button
          type="button"
          className={clsx(
            'channels-switch__item',
            'channels-manage-item',
            'channels-manage-item--danger'
          )}
          onClick={() => onDeleteChannel({ handleLower, id: ch?._id })}
        >
          <T caseMode="sentence">delete channel</T>
        </button>
      </div>,
      document.body
    )
  }

  return (
    <div className="channels-header">
      <div className="channels-header__inner">
        {playlistsMode ? (
          <>
            {/* =========================
                MODE B: PLAYLISTS CONTEXT
               ========================= */}
            <div className="channels-switch" ref={switchRef}>
              <Link
                href={channelHref}
                className={clsx('channels-tab', 'channels-tab--active', 'channels-switch__pill')}
                title={activeHandle ? `@${activeHandle}` : 'Channel'}
              >
                <span className="channels-tab__text">
                  {activeHandle ? `@${activeHandle}` : '@channel'}
                </span>
              </Link>

              <button
                type="button"
                className="channels-switch__chevron"
                aria-label="Switch channel"
                aria-haspopup="menu"
                aria-expanded={isSwitchOpen}
                onClick={() => setIsSwitchOpen((v) => !v)}
              >
                ▾
              </button>

              {isSwitchOpen ? (
                <div className="channels-switch__menu" role="menu">
                  <Link
                    href="/channels/create"
                    className="channels-switch__item"
                    onClick={() => setIsSwitchOpen(false)}
                  >
                    + <T caseMode="sentence">channel</T>
                  </Link>

                  <div className="channels-switch__divider" />

                  {channels.map((ch) => {
                    const h = String(ch?.handle || '').toLowerCase()
                    const label = h ? `@${h}` : '@channel'
                    const href = h ? `/channels/@${h}` : '/channels'
                    const isActive = !!h && h === String(activeHandle || '').toLowerCase()

                    return (
                      <Link
                        key={ch?._id || h || href}
                        href={href}
                        className={clsx('channels-switch__item', {
                          'channels-switch__item--active': isActive,
                        })}
                        onClick={() => setIsSwitchOpen(false)}
                      >
                        {label}
                      </Link>
                    )
                  })}
                </div>
              ) : null}
            </div>

            <span className="channels-tab__divider" aria-hidden="true" />

            {/* +Playlist */}
            <Link
              href={newPlaylistHref}
              className={clsx('channels-tab', 'channels-tab--add')}
              title="Create playlist"
            >
              <span className="channels-tab__plus" aria-hidden="true">
                +
              </span>
              <span className="channels-tab__text">
                <T caseMode="sentence">playlist</T>
              </span>
            </Link>

            {/* Playlists root */}
            <Link
              href={playlistsHref}
              className={clsx('channels-tab', {
                'channels-tab--active': pathname === playlistsHref,
              })}
              title="Playlists"
            >
              <span className="channels-tab__text">
                <T caseMode="sentence">playlists</T>
              </span>
            </Link>

            {/* Playlist tabs */}
            {playlists?.length ? (
              <div className="channels-header__tabs" role="tablist" aria-label="Channel playlists">
                {playlists.map((pl) => {
                  const id = String(pl?._id || pl?.id || '')
                  const title = String(pl?.title || 'Playlist')
                  const href = activeHandle
                    ? `/channels/@${activeHandle}/playlists/${id}`
                    : `/channels/playlists/${id}`

                  const isActive = activePlaylistId && String(activePlaylistId) === id

                  return (
                    <Link
                      key={id || href}
                      href={href}
                      className={clsx('channels-tab', { 'channels-tab--active': isActive })}
                      role="tab"
                      aria-selected={isActive}
                      title={title}
                    >
                      <span className="channels-tab__text">{title}</span>
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </>
        ) : (
          <>
            {/* =========================
                MODE A: CHANNELS TABS + dropdown per channel
               ========================= */}
            <Link
              href="/channels/create"
              className={clsx('channels-tab', 'channels-tab--add', {
                'channels-tab--active': isCreateChannel,
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
                const handleLower = String(ch?.handle || '').toLowerCase()
                const label = handleLower ? `@${handleLower}` : '@channel'
                const href = handleLower ? `/channels/@${handleLower}` : '/channels'

                // ✅ active channel tab should be active on ANY subpage: /@h, /@h/edit, /@h/upload, /@h/playlists...
                const isActive = !!handleLower && isInChannelPath(pathname, handleLower)

                return (
                  <div
                    key={ch?._id || handleLower || href}
                    className="channels-item"
                    ref={(el) => {
                      if (openHandle === handleLower) anchorWrapRef.current = el
                    }}
                  >
                    <Link
                      href={href}
                      className={clsx('channels-tab', { 'channels-tab--active': isActive })}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <span className="channels-tab__text">{label}</span>
                    </Link>

                    <button
                      type="button"
                      className="channels-item__chevron"
                      aria-label={`Open channel menu for ${label}`}
                      aria-haspopup="menu"
                      aria-expanded={openHandle === handleLower}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()

                        const wrapperEl = e.currentTarget.closest('.channels-item')
                        toggleMenuFor(handleLower, wrapperEl)
                      }}
                    >
                      ▾
                    </button>

                    {renderManageMenu(ch)}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

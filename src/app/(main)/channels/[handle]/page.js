'use client'

import { useParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'

import { getChannels } from '@/store/channel/channel-selectors'
import { useTranslate } from '@/utils/translating/translating'

import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'
import ChannelVideosSection from '@/common/components/channels/ChannelVideosSection'

import { HiCog } from 'react-icons/hi'

const DESC_LIMIT = 320
const BIO_LIMIT = 140

function safeHandle(raw = '') {
  const decoded = decodeURIComponent(String(raw || ''))
  return decoded.replace(/^@+/, '').trim().toLowerCase()
}

function normalizeUrl(url = '') {
  const u = String(url || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

function shortHost(url = '') {
  try {
    const u = new URL(normalizeUrl(url))
    return u.host.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function ChannelHandlePage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const params = useParams()
  const handle = safeHandle(params?.handle)

  const channels = useSelector(getChannels)

  const channel = useMemo(() => {
    if (!handle) return null
    return channels?.find((c) => String(c.handle || '').toLowerCase() === handle) || null
  }, [channels, handle])

  const [showMoreBio, setShowMoreBio] = useState(false)
  const [showMoreDesc, setShowMoreDesc] = useState(false)

  const more = useTranslate('...more')
  const less = useTranslate('less')

  const bio = useTranslate(channel?.bio || '')
  const bioShort = useMemo(() => {
    if (!bio) return ''
    if (bio.length <= BIO_LIMIT) return bio
    return bio.slice(0, BIO_LIMIT).trim() + '…'
  }, [bio])

  const description = useTranslate(channel?.description || '')
  const descShort = useMemo(() => {
    if (!description) return ''
    if (description.length <= DESC_LIMIT) return description
    return description.slice(0, DESC_LIMIT).trim() + '…'
  }, [description])

  const hasBanner = Boolean(channel?.bannerUrl)

  const subs = channel?.followersCount ?? 0
  const videoCount = channel?.videosCount ?? 0

  const links = Array.isArray(channel?.links) ? channel.links : []
  const contactEmail = String(channel?.contactEmail || '').trim()

  useEffect(() => {
    if (!isSettingsOpen) return

    const onDocClick = (e) => {
      if (!settingsRef.current) return
      if (!settingsRef.current.contains(e.target)) setIsSettingsOpen(false)
    }

    const onEsc = (e) => {
      if (e.key === 'Escape') setIsSettingsOpen(false)
    }

    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [isSettingsOpen])

  if (!handle) {
    return (
      <div className="channel-page">
        <div className="channel-empty">
          <T>Loading…</T>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="channel-page">
        <div className="channel-empty">
          <T>Channel not found</T>
        </div>
      </div>
    )
  }

  return (
    <div className="channel-page">
      {/* Banner */}
      {hasBanner ? (
        <div className="channel-banner">
          <img className="channel-banner__img" src={channel.bannerUrl} alt="channel banner" />
        </div>
      ) : null}

      {/* Hero */}
      <section className={hasBanner ? 'channel-hero channel-hero--withBanner' : 'channel-hero'}>
        <div className="channel-hero__left">
          <div className="channel-hero__avatarWrap">
            <img
              className="channel-hero__avatar"
              src={channel.avatarUrl || '/fallback-avatar.png'}
              alt="channel avatar"
            />
          </div>

          <div className="channel-hero__meta">
            <h1 className="channel-hero__name">{channel.name || channel.title}</h1>

            <div className="channel-hero__stats">
              <span className="channel-hero__handle">@{channel.handle || handle}</span>
              <span className="channel-hero__dot">•</span>
              <span>
                {subs} <T caseMode="lower">subscribers</T>
              </span>
              <span className="channel-hero__dot">•</span>
              <span>
                {videoCount} <T caseMode="lower">videos</T>
              </span>
            </div>

            {/* BIO */}
            {bio ? (
              <div className="channel-hero__bio">
                <span>{showMoreBio ? bio : bioShort}</span>
                {bio.length > BIO_LIMIT ? (
                  <button
                    type="button"
                    className="channel-hero__more"
                    onClick={() => setShowMoreBio((v) => !v)}
                  >
                    {showMoreBio ? less : more}
                  </button>
                ) : null}
              </div>
            ) : null}

            {/* LINKS + CONTACT */}
            {links.length || contactEmail ? (
              <div className="channel-hero__contacts">
                {links.map((l, idx) => {
                  const url = normalizeUrl(l?.url)
                  if (!url) return null
                  const title = String(l?.title || '').trim()
                  return (
                    <a
                      key={`${url}-${idx}`}
                      className="channel-hero__contactBtn"
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      title={title || url}
                    >
                      {title ? title : shortHost(url)}
                    </a>
                  )
                })}

                {contactEmail ? (
                  <a
                    className="channel-hero__contactBtn"
                    href={`mailto:${contactEmail}`}
                    title="Contact channel owner"
                  >
                    <T>Contact me</T>
                  </a>
                ) : null}
              </div>
            ) : null}

            {/* Actions */}
            <div className="channel-hero__actions">
              <Button variant="primary" height="40px" disabled>
                <T>Subscribe</T>
              </Button>

              <div className="channel-settings" ref={settingsRef}>
                <Button
                  variant="primary"
                  height="40px"
                  leftIcon={<HiCog size={20} />}
                  onClick={() => setIsSettingsOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={isSettingsOpen}
                >
                  <T>Settings</T>
                </Button>

                {isSettingsOpen ? (
                  <div className="channel-settings__menu" role="menu">
                    <Link
                      href={`/channels/@${channel.handle}/edit`}
                      className="channel-settings__item"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <T caseMode="sentence">edit channel</T>
                    </Link>

                    <Link
                      href={`/channels/@${channel.handle}/upload`}
                      className="channel-settings__item"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <T caseMode="sentence">upload video</T>
                    </Link>

                    <div className="channel-settings__divider" />

                    <Link
                      href={`/channels/@${channel.handle}/playlists/new`}
                      className="channel-settings__item"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <T caseMode="sentence">create playlist</T>
                    </Link>

                    <Link
                      href={`/channels/@${channel.handle}/playlists`}
                      className="channel-settings__item"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <T caseMode="sentence">manage playlists</T>
                    </Link>

                    <div className="channel-settings__divider" />

                    <Link
                      href={`/channels/@${channel.handle}/videos`}
                      className="channel-settings__item"
                      onClick={() => setIsSettingsOpen(false)}
                    >
                      <T caseMode="sentence">manage videos</T>
                    </Link>

                    <div className="channel-settings__divider" />

                    <button
                      type="button"
                      className="channel-settings__item channel-settings__item--danger"
                      onClick={() => {
                        setIsSettingsOpen(false)
                        // TODO confirm modal
                      }}
                    >
                      <T caseMode="sentence">delete channel</T>
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DESCRIPTION */}
      {description ? (
        <div className="channel-description">
          <span className="channel-description__text">
            {showMoreDesc ? description : descShort}
          </span>

          {description.length > DESC_LIMIT ? (
            <button
              type="button"
              className="channel-description__more"
              onClick={() => setShowMoreDesc((v) => !v)}
            >
              {showMoreDesc ? less : more}
            </button>
          ) : null}
        </div>
      ) : null}

      {/* VIDEOS (owner: all videos) */}
      <ChannelVideosSection channelId={channel._id} publishedOnly={false} />
    </div>
  )
}


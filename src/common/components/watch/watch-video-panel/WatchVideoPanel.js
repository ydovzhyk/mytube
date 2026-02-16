'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'

import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { HiOutlineThumbDown, HiOutlineThumbUp } from 'react-icons/hi'
import { IoNotificationsOutline, IoShareOutline } from 'react-icons/io5'

function formatDate(d) {
  try {
    return new Date(d).toLocaleDateString()
  } catch {
    return ''
  }
}

async function copyToClipboard(text) {
  if (!text) return false

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {}

  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.top = '-9999px'
    document.body.appendChild(ta)
    ta.select()

    const ok = document.execCommand('copy')

    document.body.removeChild(ta)
    return Boolean(ok)
  } catch {
    return false
  }
}

export default function WatchVideoPanel({ video, videoId }) {
  const [copied, setCopied] = useState(false)
  const v = video || {}
  const views = v?.stats?.views ?? 0
  const likes = v?.stats?.likes ?? 0

  const dateLabel = useMemo(() => {
    const d = v?.publishedAt || v?.createdAt
    return d ? formatDate(d) : ''
  }, [v?.publishedAt, v?.createdAt])

  const ch = v?.channelSnapshot || {}
  const rawHandle = String(ch.handle || '')
    .trim()
    .replace(/^@+/, '')
  const handleLabel = rawHandle ? `@${rawHandle}` : ''
  const channelHref = rawHandle ? `/channel/@${rawHandle}` : null

  const channelTitle = String(ch.title || '').trim() || String(ch.name || '').trim() || 'Channel'

  const channelAvatar = String(ch.avatarUrl || '').trim() || '/fallback-avatar.png'

  const onShare = useCallback(async () => {
    const id = String(videoId || '').trim()
    if (!id) return

    const url =
      typeof window !== 'undefined' ? `${window.location.origin}/watch/${id}` : `/watch/${id}`

    const ok = await copyToClipboard(url)
    if (!ok) return

    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }, [videoId])

  if (!video) return null

  return (
    <section className="watch-video" aria-label="Video info">
      <h2 className="watch-video__title">{v.title}</h2>

      <div className="watch-video__metaRow">
        <div className="watch-video__stats">
          <span>{views} views</span>
          {dateLabel ? <span className="watch-video__dot">•</span> : null}
          {dateLabel ? <span>{dateLabel}</span> : null}
        </div>

        <div className="watch-video__actions">
          <div className="watch-video__segmented" role="group" aria-label="Reactions">
            <button type="button" className="watch-video__segBtn" aria-label="Like">
              <HiOutlineThumbUp />
              <span>{likes}</span>
            </button>

            <div className="watch-video__segDivider" />

            <button type="button" className="watch-video__segBtn" aria-label="Dislike">
              <HiOutlineThumbDown />
            </button>
          </div>

          <button
            type="button"
            className={clsx('watch-video__pillBtn', copied && 'watch-video__pillBtn--active')}
            onClick={onShare}
            aria-label="Share"
            title={copied ? 'Copied!' : 'Copy link'}
          >
            <IoShareOutline />
            <span>{copied ? <T>Copied</T> : <T>Share</T>}</span>
          </button>

          <button
            type="button"
            className="watch-video__iconBtn"
            aria-label="Notifications"
            title="Notifications (coming soon)"
            disabled
          >
            <IoNotificationsOutline />
          </button>
        </div>
      </div>

      <div className="watch-video__channelRow">
        <div className="watch-video__channelLeft">
          <div className="watch-video__channelBox">
            <img className="watch-video__channelAvatar" src={channelAvatar} alt="channel avatar" />

            <div className="watch-video__channelMeta">
              <div className="watch-video__channelName" title={channelTitle}>
                {channelTitle}
              </div>

              {channelHref ? (
                <Link href={channelHref} className="watch-video__channelHandleLink">
                  <div className="watch-video__channelHandle">{handleLabel}</div>
                </Link>
              ) : (
                <div className="watch-video__channelHandle">{handleLabel || '—'}</div>
              )}
            </div>
          </div>
        </div>

        <Button variant="primary" height="40px" className="watch-video__subscribeBtn">
          <T>Subscribe</T>
        </Button>
      </div>
    </section>
  )
}

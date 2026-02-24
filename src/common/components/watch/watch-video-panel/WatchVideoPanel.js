'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import { useDispatch, useSelector } from 'react-redux'
import { getUser, getLogin } from '@/store/auth/auth-selectors'
import { getVisitorId, getVisitorData } from '@/store/visitor/visitor-selectors'
import { reactVideo } from '@/store/videos/videos-operations'
import { subscribeChannel } from '@/store/channel/channel-operations'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'
import formatRelativeDateNode from '@/utils/formatRelativeDateNode'
import { HiOutlineThumbDown, HiOutlineThumbUp } from 'react-icons/hi'
import { IoNotificationsOutline, IoShareOutline } from 'react-icons/io5'

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

function getMyReaction(reactions, videoId) {
  const id = String(videoId || '').trim()
  if (!id) return 0
  if (!Array.isArray(reactions) || !reactions.length) return 0

  const found = reactions.find((r) => String(r?.videoId) === id)
  const v = Number(found?.value || 0)
  return v === 1 || v === -1 ? v : 0
}

function isSubscribedToChannel(user, channelId) {
  const id = String(channelId || '').trim()
  if (!id) return false
  const arr = Array.isArray(user?.subscribedChannels) ? user.subscribedChannels : []
  return arr.some((x) => String(x) === id)
}

export default function WatchVideoPanel({ video, videoId }) {
  const dispatch = useDispatch()
  const [copied, setCopied] = useState(false)
  const [subLoading, setSubLoading] = useState(false)

  const loggedIn = useSelector(getLogin)
  const user = useSelector(getUser)
  const visitor = useSelector(getVisitorData)
  const visitorId = useSelector(getVisitorId)

  const v = video || {}
  const views = v?.stats?.views ?? 0
  const likes = v?.stats?.likes ?? 0
  const dislikes = v?.stats?.dislikes ?? 0

  const reactions = loggedIn ? user?.videoReactions : visitor?.videoReactions

  const myReaction = useMemo(() => getMyReaction(reactions, videoId), [reactions, videoId])
  const likeActive = myReaction === 1
  const dislikeActive = myReaction === -1

  const dateLabel = useMemo(() => {
    const d = v?.publishedAt || v?.createdAt
    return d ? formatRelativeDateNode(d) : null
  }, [v?.publishedAt, v?.createdAt])

  const ch = v?.channelSnapshot || {}
  const rawHandle = String(ch.handle || '')
    .trim()
    .replace(/^@+/, '')
  const handleLabel = rawHandle ? `@${rawHandle}` : ''
  const channelHref = rawHandle ? `/channel/@${rawHandle}` : null

  const channelTitle = String(ch.title || '').trim() || String(ch.name || '').trim() || 'Channel'
  const channelAvatar = String(ch.avatarUrl || '').trim() || '/fallback-avatar.png'

  const channelId = useMemo(() => {
    const id = v?.channelRef || ch?._id
    return id ? String(id).trim() : ''
  }, [v?.channelRef, ch?._id])

  const subscribed = useMemo(() => {
    if (!loggedIn) return false
    return isSubscribedToChannel(user, channelId)
  }, [loggedIn, user, channelId])

  const subscribeDisabled = !loggedIn || !channelId || subLoading

  const subscribeLabel = useMemo(() => {
    if (!loggedIn) return 'Subscribe'
    return subscribed ? 'Unsubscribe' : 'Subscribe'
  }, [loggedIn, subscribed])

  const subscribeTitle = useMemo(() => {
    if (!loggedIn) return 'Please sign in to subscribe'
    return subscribed ? 'Unsubscribe from channel' : 'Subscribe to channel'
  }, [loggedIn, subscribed])

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

  const onLike = useCallback(() => {
    const id = String(videoId || '').trim()
    if (!id) return
    if (likeActive) return

    dispatch(reactVideo({ id, value: 1 }))
  }, [dispatch, videoId, likeActive])

  const onDislike = useCallback(() => {
    const id = String(videoId || '').trim()
    if (!id) return
    if (dislikeActive) return

    dispatch(reactVideo({ id, value: -1 }))
  }, [dispatch, videoId, dislikeActive])

  const onToggleSubscribe = useCallback(async () => {
    if (!loggedIn) return
    if (!channelId) return
    if (subLoading) return

    try {
      setSubLoading(true)
      dispatch(subscribeChannel(channelId))
    } finally {
      setSubLoading(false)
    }
  }, [dispatch, loggedIn, channelId, subLoading])

  if (!video) return null

  const reactDisabled = !loggedIn && !visitorId

  return (
    <section className="watch-video" aria-label="Video info">
      <h2 className="watch-video__title">{v.title}</h2>

      <div className="watch-video__metaRow">
        <div className="watch-video__stats">
          <span>
            {views} <T caseMode="lower">views</T>
          </span>

          {dateLabel ? <span className="watch-video__dot">•</span> : null}
          {dateLabel ? <span>{dateLabel}</span> : null}
        </div>

        <div className="watch-video__actions">
          <div className="watch-video__segmented" role="group" aria-label="Reactions">
            <button
              type="button"
              className={clsx('watch-video__segBtn', likeActive && 'watch-video__segBtn--active')}
              aria-label="Like"
              aria-pressed={likeActive}
              onClick={onLike}
              disabled={reactDisabled}
              title={reactDisabled ? 'Initializing…' : 'Like'}
            >
              <HiOutlineThumbUp />
              <span>{likes}</span>
            </button>

            <div className="watch-video__segDivider" />

            <button
              type="button"
              className={clsx(
                'watch-video__segBtn',
                dislikeActive && 'watch-video__segBtn--active'
              )}
              aria-label="Dislike"
              aria-pressed={dislikeActive}
              onClick={onDislike}
              disabled={reactDisabled}
              title={
                reactDisabled ? 'Initializing…' : dislikes ? `Dislikes: ${dislikes}` : 'Dislike'
              }
            >
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

        <Button
          type="button"
          variant={subscribed ? 'secondary' : 'primary'}
          height="40px"
          disabled={subscribeDisabled}
          isLoading={subLoading}
          className="watch-video__subscribeBtn"
          onClick={onToggleSubscribe}
          aria-pressed={loggedIn ? subscribed : undefined}
          title={subscribeTitle}
        >
          <T>{subscribeLabel}</T>
        </Button>
      </div>
    </section>
  )
}

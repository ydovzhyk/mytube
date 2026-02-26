'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { useDispatch, useSelector } from 'react-redux'

import { getLogin, getUser } from '@/store/auth/auth-selectors'
import T from '@/common/shared/i18n/T'
import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import Avatar from '@/common/shared/avatar/Avatar'

import { HiOutlineThumbUp, HiOutlineThumbDown } from 'react-icons/hi'
import { IoCloseOutline } from 'react-icons/io5'
import { HiChevronDown, HiChevronUp } from 'react-icons/hi2'

function toId(v) {
  const s = String(v || '').trim()
  return s ? s : ''
}

function shortText(s = '', limit = 120) {
  const str = String(s || '').trim()
  if (!str) return ''
  if (str.length <= limit) return str
  return str.slice(0, limit).trim() + '…'
}

function formatCount(n) {
  const x = Number(n || 0)
  if (!Number.isFinite(x)) return '0'
  return String(x)
}

function toTime(v) {
  const t = v ? new Date(v).getTime() : 0
  return Number.isFinite(t) ? t : 0
}

function getVideoId(video) {
  return toId(video?._id)
}

function getVideoOwnerId(video) {
  return toId(video?.ownerId)
}

function getVideoChannelId(video) {
  return toId(video?.channelRef) || toId(video?.channelSnapshot?._id)
}

function getAuthorChannelIdFromComment(c) {
  return (
    toId(c?.authorChannelId) || toId(c?.authorSnapshot?.channelId) || toId(c?.authorSnapshot?._id)
  )
}

function getDisplayNameFromSnapshot(snap) {
  const title = String(snap?.title || '').trim()
  const name = String(snap?.name || '').trim()
  return title || name || 'Channel'
}

function getHandleFromSnapshot(snap) {
  return String(snap?.handle || '').trim()
}

function getAvatarFromSnapshot(snap) {
  return String(snap?.avatarUrl || snap?.avatar || '').trim()
}

/**
 * props:
 * - video: current video doc (required for ownerId + ids)
 * - comments: array (optional, until you wire redux)
 */
export default function WatchCommentsSection({ video, comments: commentsProp }) {
  const dispatch = useDispatch()
  const loggedIn = useSelector(getLogin)
  const user = useSelector(getUser)

  const videoId = useMemo(() => getVideoId(video), [video])
  const ownerId = useMemo(() => getVideoOwnerId(video), [video])
  const videoChannelId = useMemo(() => getVideoChannelId(video), [video])

  const myUserId = toId(user?._id)
  const isOwner = Boolean(myUserId && ownerId && myUserId === ownerId)

  const canComment = Boolean(loggedIn)
  const myAvatarSrc = String(user?.userAvatar || user?.avatarUrl || '')

  const rawComments = useMemo(() => {
    const arr = Array.isArray(commentsProp) ? commentsProp : []
    return arr.filter(Boolean)
  }, [commentsProp])

  const pinnedCount = useMemo(
    () => rawComments.reduce((acc, c) => acc + (c?.pinnedAt ? 1 : 0), 0),
    [rawComments]
  )

  // ---- Build threads: root comments + replies grouped by replyTo
  const threads = useMemo(() => {
    const byId = new Map()
    const repliesByParent = new Map()

    for (const c of rawComments) {
      const id = toId(c?._id)
      if (!id) continue
      byId.set(id, c)

      const parentId = toId(c?.replyTo)
      if (parentId) {
        const arr = repliesByParent.get(parentId) || []
        arr.push(c)
        repliesByParent.set(parentId, arr)
      }
    }

    // roots: those without replyTo OR those whose parent is missing (defensive)
    const roots = rawComments.filter((c) => {
      const parentId = toId(c?.replyTo)
      if (!parentId) return true
      return !byId.has(parentId)
    })

    // sort roots: pinnedAt desc, createdAt desc
    const rootsSorted = [...roots].sort((a, b) => {
      const ap = a?.pinnedAt ? toTime(a.pinnedAt) : 0
      const bp = b?.pinnedAt ? toTime(b.pinnedAt) : 0
      if (bp !== ap) return bp - ap

      const ac = toTime(a?.createdAt)
      const bc = toTime(b?.createdAt)
      if (bc !== ac) return bc - ac

      return String(b?._id || '').localeCompare(String(a?._id || ''))
    })

    const out = rootsSorted.map((root) => {
      const rid = toId(root?._id)
      const replies = rid ? repliesByParent.get(rid) || [] : []
      // sort replies: oldest first (YouTube-like)
      const repliesSorted = [...replies].sort((a, b) => {
        const ac = toTime(a?.createdAt)
        const bc = toTime(b?.createdAt)
        if (ac !== bc) return ac - bc
        return String(a?._id || '').localeCompare(String(b?._id || ''))
      })
      return { root, replies: repliesSorted }
    })

    return out
  }, [rawComments])

  const totalLabel = useMemo(() => {
    const n = Number(video?.stats?.comments)
    if (Number.isFinite(n) && n >= 0) return String(n)
    return String(rawComments.length)
  }, [video?.stats?.comments, rawComments.length])

  const listRef = useRef(null)
  const itemRefs = useRef(new Map())

  const [text, setText] = useState('')
  const [pinOnCreate, setPinOnCreate] = useState(false)

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyTo, setReplyTo] = useState(null)
  const [replyText, setReplyText] = useState('')

  // expanded threads map: rootId -> boolean
  const [expanded, setExpanded] = useState(() => ({}))

  const submitDisabled = !canComment || !String(text || '').trim() || !videoId

  const scrollToComment = useCallback((commentId) => {
    const id = toId(commentId)
    if (!id) return
    const el = itemRefs.current.get(id)
    const container = listRef.current
    if (!el || !container) return

    const cRect = container.getBoundingClientRect()
    const eRect = el.getBoundingClientRect()
    const isAbove = eRect.top < cRect.top
    const isBelow = eRect.bottom > cRect.bottom

    if (isAbove || isBelow) {
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
      })
    }
  }, [])

  const onOpenReply = useCallback((comment) => {
    setReplyTo(comment || null)
    setReplyText('')
    setReplyOpen(true)
  }, [])

  const onCloseReply = useCallback(() => {
    setReplyOpen(false)
    setReplyTo(null)
    setReplyText('')
  }, [])

  const onSubmitRoot = useCallback(async () => {
    if (!canComment) return
    if (!videoId) return

    const t = String(text || '').trim()
    if (!t) return

    // TODO:
    // dispatch(createComment({ videoId, text: t, pin: isOwner ? Boolean(pinOnCreate) : false }))
    setText('')
    setPinOnCreate(false)
  }, [canComment, videoId, text, isOwner, pinOnCreate])

  const onSubmitReply = useCallback(async () => {
    if (!canComment) return
    if (!videoId) return

    const t = String(replyText || '').trim()
    if (!t) return

    const parentId = toId(replyTo?._id)
    if (!parentId) return

    // TODO:
    // dispatch(createComment({ videoId, text: t, replyTo: parentId }))
    onCloseReply()
  }, [canComment, videoId, replyText, replyTo, onCloseReply])

  const onPinToggle = useCallback(
    async (comment) => {
      if (!isOwner) return
      const id = toId(comment?._id)
      if (!id) return

      const isPinned = Boolean(comment?.pinnedAt)
      if (!isPinned && pinnedCount >= 3) return

      // TODO:
      // if (isPinned) dispatch(unpinComment({ commentId: id }))
      // else dispatch(pinComment({ commentId: id }))
    },
    [isOwner, pinnedCount]
  )

  const toggleThread = useCallback((rootId) => {
    const id = toId(rootId)
    if (!id) return
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  useEffect(() => {
    if (!replyOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCloseReply()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [replyOpen, onCloseReply])

  return (
    <section className="watch-comments" aria-label="Comments">
      <div className="watch-comments__topRow">
        <h3 className="watch-comments__title">
          {totalLabel} <T>Comments</T>
        </h3>

        <div className="watch-comments__sort">
          <span className="watch-comments__sortLabel">
            <T>Sort by</T>
          </span>

          <button type="button" className="watch-comments__sortBtn" disabled title="Coming soon">
            <T>Top</T>
          </button>
        </div>
      </div>

      {/* composer */}
      <div className="watch-comments__composer">
        <Avatar src={myAvatarSrc} alt="Me" size="md" className="watch-comments__avatar" />

        <div className="watch-comments__composerMain">
          <Input
            as="textarea"
            rows={3}
            placeholder={canComment ? 'Add a comment…' : 'Sign in to comment'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canComment || !videoId}
          />

          <div className="watch-comments__composerActions">
            {isOwner ? (
              <label className="watch-comments__pinCreate">
                <input
                  type="checkbox"
                  checked={Boolean(pinOnCreate)}
                  onChange={(e) => setPinOnCreate(e.target.checked)}
                  disabled={!canComment || pinnedCount >= 3}
                />
                <span>
                  <T>Pin this comment</T>
                </span>
              </label>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              height="36px"
              onClick={() => {
                setText('')
                setPinOnCreate(false)
              }}
              disabled={!canComment || (!text && !pinOnCreate)}
            >
              <T>Cancel</T>
            </Button>

            <Button
              type="button"
              variant="primary"
              height="36px"
              onClick={onSubmitRoot}
              disabled={submitDisabled}
            >
              <T>Comment</T>
            </Button>
          </div>
        </div>
      </div>

      {/* list */}
      <div ref={listRef} className="watch-comments__list">
        {!threads.length ? (
          <div className="watch-comments__empty">
            <T>No comments yet</T>
          </div>
        ) : (
          threads.map(({ root, replies }) => {
            const rootId = toId(root?._id)
            if (!rootId) return null

            const author = root?.authorSnapshot || {}
            const displayName = getDisplayNameFromSnapshot(author)
            const handle = getHandleFromSnapshot(author)
            const avatarSrc = getAvatarFromSnapshot(author)

            const isDeleted = Boolean(root?.isDeleted)
            const body = isDeleted ? 'Comment deleted' : String(root?.text || '')

            const isPinned = Boolean(root?.pinnedAt)

            const authorChannelId = getAuthorChannelIdFromComment(root)
            const isOwnerComment = Boolean(
              videoChannelId && authorChannelId && videoChannelId === authorChannelId
            )

            const canPinThis = isOwner && !isDeleted && (isPinned || pinnedCount < 3)

            const hasReplies = replies.length > 0
            const isExpanded = Boolean(expanded[rootId])

            return (
              <div key={rootId} className="comment-thread">
                {/* ROOT COMMENT */}
                <article
                  ref={(node) => {
                    if (node) itemRefs.current.set(rootId, node)
                    else itemRefs.current.delete(rootId)
                  }}
                  className={clsx('comment', isPinned && 'comment--pinned')}
                >
                  <Avatar src={avatarSrc} alt="Avatar" size="md" className="comment__avatar" />

                  <div className="comment__main">
                    <div className="comment__meta">
                      <span className="comment__name">{displayName}</span>
                      {handle ? <span className="comment__handle">@{handle}</span> : null}

                      {isOwnerComment ? (
                        <span className="comment__badge">
                          <T>Owner</T>
                        </span>
                      ) : null}

                      {isPinned ? (
                        <span className="comment__badge comment__badge--pinned">
                          <T>Pinned</T>
                        </span>
                      ) : null}
                    </div>

                    <div className={clsx('comment__body', isDeleted && 'comment__body--deleted')}>
                      {isDeleted ? <T>{body}</T> : body}
                    </div>

                    <div className="comment__actions">
                      <button
                        type="button"
                        className="comment__iconBtn"
                        disabled
                        title="Coming soon"
                      >
                        <HiOutlineThumbUp />
                        <span>{formatCount(root?.likesCount)}</span>
                      </button>

                      <button
                        type="button"
                        className="comment__iconBtn"
                        disabled
                        title="Coming soon"
                      >
                        <HiOutlineThumbDown />
                        <span>{formatCount(root?.dislikesCount)}</span>
                      </button>

                      <button
                        type="button"
                        className="comment__replyBtn"
                        onClick={() => onOpenReply(root)}
                        disabled={!canComment || isDeleted || !videoId}
                        title={!canComment ? 'Sign in to reply' : 'Reply'}
                      >
                        <T>Reply</T>
                      </button>

                      {isOwner ? (
                        <button
                          type="button"
                          className="comment__pinBtn"
                          onClick={() => onPinToggle(root)}
                          disabled={!canPinThis}
                          title={
                            !canPinThis ? 'Pinned limit reached (3)' : isPinned ? 'Unpin' : 'Pin'
                          }
                        >
                          {isPinned ? <T>Unpin</T> : <T>Pin</T>}
                        </button>
                      ) : null}
                    </div>

                    {/* REPLIES TOGGLE (YouTube-like) */}
                    {hasReplies ? (
                      <button
                        type="button"
                        className="comment-thread__toggle"
                        onClick={() => toggleThread(rootId)}
                      >
                        {isExpanded ? <HiChevronUp /> : <HiChevronDown />}
                        <span>
                          {isExpanded ? <T>Hide replies</T> : <T>View replies</T>} ({replies.length}
                          )
                        </span>
                      </button>
                    ) : null}
                  </div>
                </article>

                {/* REPLIES LIST */}
                {hasReplies && isExpanded ? (
                  <div className="comment-thread__replies">
                    {replies.map((c) => {
                      const id = toId(c?._id)
                      if (!id) return null

                      const a = c?.authorSnapshot || {}
                      const dn = getDisplayNameFromSnapshot(a)
                      const h = getHandleFromSnapshot(a)
                      const av = getAvatarFromSnapshot(a)

                      const del = Boolean(c?.isDeleted)
                      const txt = del ? 'Comment deleted' : String(c?.text || '')
                      const replyPreview = c?.replyPreview || null

                      const aChId = getAuthorChannelIdFromComment(c)
                      const isOwnerReply = Boolean(
                        videoChannelId && aChId && videoChannelId === aChId
                      )

                      return (
                        <article
                          key={id}
                          ref={(node) => {
                            if (node) itemRefs.current.set(id, node)
                            else itemRefs.current.delete(id)
                          }}
                          className={clsx('comment', 'comment--reply')}
                        >
                          <Avatar src={av} alt="Avatar" size="sm" className="comment__avatar" />

                          <div className="comment__main">
                            <div className="comment__meta">
                              <span className="comment__name">{dn}</span>
                              {h ? <span className="comment__handle">@{h}</span> : null}

                              {isOwnerReply ? (
                                <span className="comment__badge">
                                  <T>Owner</T>
                                </span>
                              ) : null}
                            </div>

                            {replyPreview ? (
                              <button
                                type="button"
                                className="comment__replyPreview"
                                onClick={() => scrollToComment(replyPreview.commentId)}
                                title="Go to original comment"
                              >
                                <Avatar
                                  src={String(replyPreview.authorAvatar || '')}
                                  alt="Reply avatar"
                                  size="xs"
                                  className="comment__replyAvatar"
                                />

                                <div className="comment__replyText">
                                  <div className="comment__replyName">
                                    {String(replyPreview.authorName || 'Channel')}
                                  </div>
                                  <div className="comment__replyShort">
                                    {String(replyPreview.textShort || '')}
                                  </div>
                                </div>
                              </button>
                            ) : null}

                            <div className={clsx('comment__body', del && 'comment__body--deleted')}>
                              {del ? <T>{txt}</T> : txt}
                            </div>

                            <div className="comment__actions">
                              <button
                                type="button"
                                className="comment__iconBtn"
                                disabled
                                title="Coming soon"
                              >
                                <HiOutlineThumbUp />
                                <span>{formatCount(c?.likesCount)}</span>
                              </button>

                              <button
                                type="button"
                                className="comment__iconBtn"
                                disabled
                                title="Coming soon"
                              >
                                <HiOutlineThumbDown />
                                <span>{formatCount(c?.dislikesCount)}</span>
                              </button>

                              <button
                                type="button"
                                className="comment__replyBtn"
                                onClick={() => onOpenReply(c)}
                                disabled={!canComment || del || !videoId}
                              >
                                <T>Reply</T>
                              </button>
                            </div>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>

      {/* reply modal */}
      {replyOpen ? (
        <div className="comment-modal" role="dialog" aria-modal="true" aria-label="Reply">
          <button className="comment-modal__backdrop" onClick={onCloseReply} aria-label="Close" />

          <div className="comment-modal__card">
            <div className="comment-modal__head">
              <div className="comment-modal__title">
                <T>Reply</T>
              </div>

              <button className="comment-modal__close" onClick={onCloseReply} aria-label="Close">
                <IoCloseOutline />
              </button>
            </div>

            <div className="comment-modal__preview">
              {replyTo ? (
                <div className="comment-modal__previewTop">
                  <Avatar
                    src={String(
                      replyTo?.authorSnapshot?.avatarUrl || replyTo?.authorSnapshot?.avatar || ''
                    )}
                    alt="Avatar"
                    size="sm"
                    className="comment-modal__previewAvatar"
                  />

                  <div className="comment-modal__previewMeta">
                    <div className="comment-modal__previewName">
                      {String(
                        replyTo?.authorSnapshot?.title || replyTo?.authorSnapshot?.name || 'Channel'
                      )}
                    </div>

                    <div className="comment-modal__previewShort">
                      {shortText(replyTo?.text, 180)}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="comment-modal__form">
              <Input
                as="textarea"
                rows={4}
                placeholder="Write your reply…"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                disabled={!canComment || !videoId}
              />

              <div className="comment-modal__actions">
                <Button type="button" variant="secondary" height="36px" onClick={onCloseReply}>
                  <T>Cancel</T>
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  height="36px"
                  onClick={onSubmitReply}
                  disabled={!canComment || !String(replyText || '').trim() || !videoId}
                >
                  <T>Reply</T>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

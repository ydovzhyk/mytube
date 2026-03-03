'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'

import { getLogin, getUser } from '@/store/auth/auth-selectors'
import T from '@/common/shared/i18n/T'
import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import Avatar from '@/common/shared/avatar/Avatar'

import { HiOutlineThumbUp, HiOutlineThumbDown } from 'react-icons/hi'
import { IoCloseOutline } from 'react-icons/io5'

import {
  getCommentsItemsByVideoId,
  getCommentsLoadingByVideoId,
  getCommentsHasMoreByVideoId,
  getCommentsCursorByVideoId,
} from '@/store/comments/comments-selectors'

import {
  getCommentsByVideoId,
  createComment,
  reactComment,
  editComment,
  deleteComment,
} from '@/store/comments/comments-operations'

/* ================= helpers ================= */

function toId(v) {
  const s = String(v || '').trim()
  return s ? s : ''
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

function getDisplayNameFromSnapshot(snap) {
  const title = String(snap?.title || '').trim()
  const name = String(snap?.name || '').trim()
  return title || name || 'User'
}

function getAvatarFromSnapshot(snap) {
  return String(snap?.avatarUrl || snap?.avatar || '').trim()
}

function getHandleFromSnapshot(snap) {
  const h = String(snap?.handle || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
  return h ? `@${h}` : ''
}

// very small snippet for modal preview
function shortText(s = '', limit = 180) {
  const str = String(s || '').trim()
  if (!str) return ''
  if (str.length <= limit) return str
  return str.slice(0, limit).trim() + '…'
}

// Linkify URLs inside text -> <a target="_blank" ...>
function renderTextWithLinks(text) {
  const str = String(text || '')
  if (!str) return null

  // matches http(s)://... OR www....
  const re = /(\bhttps?:\/\/[^\s]+|\bwww\.[^\s]+)/gi
  const parts = str.split(re)

  return parts.map((part, idx) => {
    const p = String(part || '')
    const isUrl = re.test(p)
    re.lastIndex = 0

    if (!isUrl) return <span key={idx}>{p}</span>

    const href = p.startsWith('http') ? p : `https://${p}`
    return (
      <a
        key={idx}
        className="comment__link"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {p}
      </a>
    )
  })
}

/**
 * Body scroll lock without layout shift:
 * - lock overflow
 * - add padding-right equal to scrollbar gap
 */
function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return
    if (typeof document === 'undefined' || typeof window === 'undefined') return

    const body = document.body
    const root = document.documentElement

    const prevOverflow = body.style.overflow
    const prevPaddingRight = body.style.paddingRight
    const prevGapVar = root.style.getPropertyValue('--scrollbar-gap')

    const gap = window.innerWidth - root.clientWidth

    root.style.setProperty('--scrollbar-gap', gap > 0 ? `${gap}px` : '0px')

    body.style.overflow = 'hidden'
    if (gap > 0) body.style.paddingRight = `${gap}px`

    return () => {
      body.style.overflow = prevOverflow
      body.style.paddingRight = prevPaddingRight
      root.style.setProperty('--scrollbar-gap', prevGapVar || '0px')
    }
  }, [locked])
}

/* ===================================================== */

export default function WatchCommentsSection({ video }) {
  const dispatch = useDispatch()
  const loggedIn = useSelector(getLogin)
  const user = useSelector(getUser)

  const videoId = useMemo(() => toId(video?._id), [video])
  const ownerId = useMemo(() => toId(video?.ownerId), [video])

  const myUserId = toId(user?._id)
  const isOwner = Boolean(myUserId && ownerId && myUserId === ownerId)

  const myAvatarSrc = String(user?.userAvatar || user?.avatarUrl || '')
  const channelAvatar = String(
    video?.channelSnapshot?.avatarUrl || video?.channelSnapshot?.avatar || ''
  )

  // for owner-channel checks (pin/edit own channel comment)
  const videoChannelHandle = useMemo(() => {
    const raw = String(video?.channelSnapshot?.handle || '')
      .trim()
      .replace(/^@+/, '')
      .toLowerCase()
    return raw ? `@${raw}` : ''
  }, [video?.channelSnapshot?.handle])

  // NOTE: коментити можуть лише залогінені
  const canComment = Boolean(loggedIn && videoId)

  const storeItems = useSelector(getCommentsItemsByVideoId(videoId))
  const loading = useSelector(getCommentsLoadingByVideoId(videoId))
  const hasMore = useSelector(getCommentsHasMoreByVideoId(videoId))
  const cursor = useSelector(getCommentsCursorByVideoId(videoId))

  const rawComments = useMemo(() => {
    return Array.isArray(storeItems) ? storeItems.filter(Boolean) : []
  }, [storeItems])

  const pinnedCount = useMemo(() => {
    return rawComments.reduce((acc, c) => {
      const isRoot = !toId(c?.replyTo)
      return acc + (isRoot && c?.pinnedAt ? 1 : 0)
    }, 0)
  }, [rawComments])

  function isMyUserComment(comment) {
    const authorUserId = toId(comment?.authorUserId)
    return Boolean(authorUserId && myUserId && authorUserId === myUserId)
  }

  function isMyChannelComment(comment) {
    if (!isOwner) return false
    const h = getHandleFromSnapshot(comment?.authorSnapshot)
    return Boolean(videoChannelHandle && h && h === videoChannelHandle)
  }

  function isMyComment(comment) {
    return isMyUserComment(comment) || isMyChannelComment(comment)
  }

  /* ================= reactions (from user) ================= */

  // ✅ build reaction map once per user change
  const myCommentReactionMap = useMemo(() => {
    const arr = Array.isArray(user?.commentReactions) ? user.commentReactions : []
    const map = new Map()
    for (const r of arr) {
      const cid = toId(r?.commentId)
      if (!cid) continue
      const v = Number(r?.value || 0)
      map.set(cid, [1, -1].includes(v) ? v : 0)
    }
    return map
  }, [user?.commentReactions])

  const getMyReactionByCommentId = useCallback(
    (commentId) => {
      const id = toId(commentId)
      if (!id) return 0
      return myCommentReactionMap.get(id) || 0
    },
    [myCommentReactionMap]
  )

  /* ================= composer ================= */

  const [text, setText] = useState('')
  const [pinOnCreate, setPinOnCreate] = useState(false)

  const submitDisabled = !canComment || !String(text || '').trim()

  const onSubmitRoot = useCallback(() => {
    if (!canComment) return
    const content = String(text || '').trim()
    if (!content) return

    dispatch(
      createComment({
        videoId,
        content,
        replyTo: null,
        // owner can pin ONLY their own comment. Root composer is owner channel comment, so ok.
        pin: isOwner ? Boolean(pinOnCreate) : false,
      })
    )

    setText('')
    setPinOnCreate(false)
  }, [dispatch, canComment, text, videoId, isOwner, pinOnCreate])

  /* ================= initial load ================= */

  const attemptedInitialRef = useRef(new Set())

  useEffect(() => {
    if (!videoId) return

    const hasAny = rawComments.length > 0
    if (attemptedInitialRef.current.has(videoId) && hasAny) return

    attemptedInitialRef.current.add(videoId)

    dispatch(
      getCommentsByVideoId({
        videoId,
        cursor: '',
        limit: 10,
        includeReplies: 1,
        repliesLimit: 50,
        reset: true,
      })
    )
  }, [dispatch, videoId, rawComments.length])

  /* ================= reactions ================= */

  const onReact = useCallback(
    (comment, nextValue) => {
      if (!loggedIn) return
      if (!videoId) return

      const id = toId(comment?._id)
      if (!id) return
      if (comment?.isDeleted) return

      // ✅ read from user.commentReactions (NOT from comment.myReaction)
      const current = getMyReactionByCommentId(id)
      const value = current === nextValue ? 0 : nextValue

      dispatch(reactComment({ id, value, videoId }))
    },
    [dispatch, loggedIn, videoId, getMyReactionByCommentId]
  )

  /* ================= pin/unpin ================= */

  const onPinToggle = useCallback(
    (comment) => {
      if (!isOwner) return
      if (!videoId) return
      if (!comment || comment?.isDeleted) return

      // ✅ owner can pin ONLY own channel comment
      const mine = isMyComment(comment)
      if (!mine) return

      const id = toId(comment?._id)
      if (!id) return

      const isPinned = Boolean(comment?.pinnedAt)
      if (!isPinned && pinnedCount >= 3) return

      dispatch(
        editComment({
          id,
          videoId,
          pin: !isPinned,
        })
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, isOwner, pinnedCount, videoId, myUserId, videoChannelHandle]
  )

  /* ================= threads ================= */

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

    const roots = rawComments.filter((c) => {
      const parentId = toId(c?.replyTo)
      if (!parentId) return true
      return !byId.has(parentId)
    })

    const rootsSorted = [...roots].sort((a, b) => {
      const ap = a?.pinnedAt ? toTime(a.pinnedAt) : 0
      const bp = b?.pinnedAt ? toTime(b.pinnedAt) : 0
      if (bp !== ap) return bp - ap

      const ac = toTime(a?.createdAt)
      const bc = toTime(b?.createdAt)
      if (bc !== ac) return bc - ac

      return String(b?._id || '').localeCompare(String(a?._id || ''))
    })

    return rootsSorted.map((root) => {
      const rid = toId(root?._id)
      const replies = rid ? repliesByParent.get(rid) || [] : []
      const repliesSorted = [...replies].sort((a, b) => toTime(a?.createdAt) - toTime(b?.createdAt))
      return { root, replies: repliesSorted }
    })
  }, [rawComments])

  /* ================= infinite scroll ================= */

  const sentinelRef = useRef(null)
  const loadingMoreRef = useRef(false)

  useEffect(() => {
    loadingMoreRef.current = loading
  }, [loading])

  useEffect(() => {
    if (!videoId) return
    if (!hasMore) return
    if (loading) return
    if (!cursor) return

    const el = sentinelRef.current
    if (!el) return

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (!hasMore) return
        if (!cursor) return
        if (loadingMoreRef.current) return

        loadingMoreRef.current = true

        const promise = dispatch(
          getCommentsByVideoId({
            videoId,
            cursor,
            limit: 10,
            includeReplies: 1,
            repliesLimit: 50,
            reset: false,
          })
        )

        Promise.resolve(promise).finally(() => {
          loadingMoreRef.current = false
        })
      },
      { rootMargin: '800px 0px' }
    )

    io.observe(el)
    return () => io.disconnect()
  }, [dispatch, videoId, cursor, hasMore, loading])

  /* ================= modal (reply/edit) ================= */

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('reply') // 'reply' | 'edit'
  const [modalText, setModalText] = useState('')
  const [modalRootId, setModalRootId] = useState('')
  const [modalTarget, setModalTarget] = useState(null) // comment doc (preview)

  useBodyScrollLock(modalOpen)

  const closeModal = useCallback(() => {
    setModalOpen(false)
    setModalText('')
    setModalRootId('')
    setModalTarget(null)
    setModalMode('reply')
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modalOpen, closeModal])

  const openReplyModal = useCallback(
    (comment, rootId) => {
      if (!loggedIn) return
      if (!videoId) return
      if (!comment || comment?.isDeleted) return

      // ✅ no reply to own comment
      const mine = (function () {
        const authorUserId = toId(comment?.authorUserId)
        if (authorUserId && myUserId && authorUserId === myUserId) return true
        if (isOwner) {
          const h = getHandleFromSnapshot(comment?.authorSnapshot)
          if (videoChannelHandle && h && h === videoChannelHandle) return true
        }
        return false
      })()
      if (mine) return

      setModalMode('reply')
      setModalTarget(comment)
      setModalRootId(toId(rootId || comment?._id))
      setModalText('')
      setModalOpen(true)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, videoId, myUserId, isOwner, videoChannelHandle]
  )

  const openEditModal = useCallback(
    (comment, rootId) => {
      if (!loggedIn) return
      if (!videoId) return
      if (!comment || comment?.isDeleted) return

      setModalMode('edit')
      setModalTarget(comment)
      setModalRootId(toId(rootId || comment?._id))
      setModalText(String(comment?.text || comment?.content || '').trim())
      setModalOpen(true)
    },
    [loggedIn, videoId]
  )

  const onModalSubmit = useCallback(() => {
    if (!loggedIn) return
    if (!videoId) return

    const content = String(modalText || '').trim()
    if (!content) return

    if (modalMode === 'reply') {
      const replyTo = toId(modalRootId)
      if (!replyTo) return

      dispatch(
        createComment({
          videoId,
          content,
          replyTo,
          pin: false,
        })
      )
      closeModal()
      return
    }

    if (modalMode === 'edit') {
      const id = toId(modalTarget?._id)
      if (!id) return

      dispatch(
        editComment({
          id,
          videoId,
          content,
        })
      )
      closeModal()
    }
  }, [dispatch, loggedIn, videoId, modalText, modalMode, modalRootId, modalTarget, closeModal])

  /* ================= edit/delete permissions (UI) ================= */

  const canEditDelete = useCallback(
    (comment) => {
      if (!loggedIn) return false
      if (!comment || comment?.isDeleted) return false

      // user comments: only author
      const authorUserId = toId(comment?.authorUserId)
      if (authorUserId && myUserId && authorUserId === myUserId) return true

      // channel comments: only owner of this video/channel
      if (isOwner) {
        const h = getHandleFromSnapshot(comment?.authorSnapshot)
        if (videoChannelHandle && h && h === videoChannelHandle) return true
      }

      return false
    },
    [loggedIn, myUserId, isOwner, videoChannelHandle]
  )

  const onDelete = useCallback(
    (comment) => {
      if (!videoId) return
      if (!comment || comment?.isDeleted) return
      if (!canEditDelete(comment)) return

      const id = toId(comment?._id)
      if (!id) return

      const ok = window.confirm('Delete this comment?')
      if (!ok) return

      dispatch(deleteComment({ id, videoId }))
    },
    [dispatch, videoId, canEditDelete]
  )

  /* ================= render ================= */

  const modalNode =
    modalOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="comment-modal" role="dialog" aria-modal="true">
            <div className="comment-modal__backdrop" onClick={closeModal} />

            <div className="comment-modal__card">
              <div className="comment-modal__head">
                <div className="comment-modal__title">
                  {modalMode === 'reply' ? <T>Reply</T> : <T>Edit comment</T>}
                </div>

                <button
                  type="button"
                  className="comment-modal__close"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <IoCloseOutline />
                </button>
              </div>

              {modalTarget ? (
                <div className="comment-modal__preview">
                  <div className="comment-modal__previewTop">
                    <Avatar
                      src={getAvatarFromSnapshot(modalTarget?.authorSnapshot)}
                      size="sm"
                      className="comment-modal__previewAvatar"
                    />

                    <div className="comment-modal__previewMeta">
                      <div className="comment-modal__previewName">
                        {getDisplayNameFromSnapshot(modalTarget?.authorSnapshot)}
                        {getHandleFromSnapshot(modalTarget?.authorSnapshot) ? (
                          <span className="comment-modal__previewHandle">
                            {' '}
                            {getHandleFromSnapshot(modalTarget?.authorSnapshot)}
                          </span>
                        ) : null}
                      </div>

                      <div className="comment-modal__previewShort">
                        {shortText(String(modalTarget?.text || modalTarget?.content || ''), 220)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="comment-modal__form">
                <Input
                  as="textarea"
                  rows={4}
                  placeholder={modalMode === 'reply' ? 'Write a reply…' : 'Edit your comment…'}
                  value={modalText}
                  onChange={(e) => setModalText(e.target.value)}
                />

                <div className="comment-modal__actions">
                  <Button type="button" variant="secondary" height="36px" onClick={closeModal}>
                    <T>Cancel</T>
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    height="36px"
                    onClick={onModalSubmit}
                    disabled={!String(modalText || '').trim()}
                  >
                    {modalMode === 'reply' ? <T>Reply</T> : <T>Save</T>}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <section className="watch-comments">
      {/* COMPOSER */}
      <div className="watch-comments__composer">
        <Avatar
          src={isOwner ? channelAvatar : myAvatarSrc}
          alt="Me"
          size="md"
          className="watch-comments__avatar"
        />

        <div className="watch-comments__composerMain">
          <Input
            as="textarea"
            rows={1}
            className="textarea textarea--compact"
            placeholder={canComment ? 'Add a comment…' : 'Sign in to comment'}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={!canComment}
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

      {/* LIST */}
      <div className="watch-comments__list">
        {!threads.length && !loading ? (
          <div className="watch-comments__empty">
            <T>No comments yet</T>
          </div>
        ) : null}

        {threads.map(({ root, replies }) => {
          const rootId = toId(root?._id)
          if (!rootId) return null

          const author = root?.authorSnapshot || {}
          const displayName = getDisplayNameFromSnapshot(author)
          const avatarSrc = getAvatarFromSnapshot(author)
          const handle = getHandleFromSnapshot(author)

          const isDeleted = Boolean(root?.isDeleted)
          const textValue = String(root?.text || root?.content || '')
          const isPinned = Boolean(root?.pinnedAt)

          const canManageRoot = canEditDelete(root)

          // ✅ reply only if not my comment
          const canReplyRoot = Boolean(loggedIn && !isDeleted && !isMyComment(root))

          // ✅ pin only owner + only own comment
          const canPinThis = Boolean(
            isOwner && isMyComment(root) && !isDeleted && (isPinned || pinnedCount < 3)
          )

          // ✅ read reaction from user map
          const rootMyReaction = getMyReactionByCommentId(rootId)

          return (
            <div key={rootId} className="comment-thread">
              {/* ROOT */}
              <article className={clsx('comment', isPinned && 'comment--pinned')}>
                <Avatar src={avatarSrc} size="md" className="comment__avatar" />

                <div className="comment__main">
                  <div className="comment__meta">
                    <span className="comment__name">{displayName}</span>

                    {handle ? (
                      <a
                        className="comment__handleLink"
                        href={`/channel/${handle}`}
                        title="Open channel"
                      >
                        {handle}
                      </a>
                    ) : (
                      <span className="comment__handle" />
                    )}

                    {isPinned ? (
                      <span className="comment__badge comment__badge--pinned">
                        <T>Pinned</T>
                      </span>
                    ) : null}
                  </div>

                  <div className={clsx('comment__body', isDeleted && 'comment__body--deleted')}>
                    {isDeleted ? <T>Comment deleted</T> : renderTextWithLinks(textValue)}
                  </div>

                  <div className="comment__actions">
                    <button
                      type="button"
                      className={clsx('comment__iconBtn', rootMyReaction === 1 && 'is-active')}
                      onClick={() => onReact(root, 1)}
                      disabled={!loggedIn || isDeleted}
                      title={!loggedIn ? 'Sign in to react' : 'Like'}
                    >
                      <HiOutlineThumbUp />
                      <span>{formatCount(root?.likesCount)}</span>
                    </button>

                    <button
                      type="button"
                      className={clsx('comment__iconBtn', rootMyReaction === -1 && 'is-active')}
                      onClick={() => onReact(root, -1)}
                      disabled={!loggedIn || isDeleted}
                      title={!loggedIn ? 'Sign in to react' : 'Dislike'}
                    >
                      <HiOutlineThumbDown />
                      <span>{formatCount(root?.dislikesCount)}</span>
                    </button>

                    {canReplyRoot ? (
                      <button
                        type="button"
                        className="comment__replyBtn"
                        onClick={() => openReplyModal(root, rootId)}
                        disabled={!loggedIn || isDeleted}
                        title={!loggedIn ? 'Sign in to reply' : 'Reply'}
                      >
                        <T>Reply</T>
                      </button>
                    ) : null}

                    {canManageRoot ? (
                      <>
                        <button
                          type="button"
                          className="comment__editBtn"
                          onClick={() => openEditModal(root, rootId)}
                          disabled={isDeleted}
                        >
                          <T>Edit</T>
                        </button>

                        <button
                          type="button"
                          className="comment__deleteBtn"
                          onClick={() => onDelete(root)}
                          disabled={isDeleted}
                        >
                          <T>Delete</T>
                        </button>
                      </>
                    ) : null}

                    {canPinThis ? (
                      <button
                        type="button"
                        className="comment__pinBtn"
                        onClick={() => onPinToggle(root)}
                        title={isPinned ? 'Unpin' : 'Pin'}
                      >
                        {isPinned ? <T>Unpin</T> : <T>Pin</T>}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>

              {/* REPLIES */}
              {replies.length > 0 ? (
                <div className="comment-thread__replies">
                  {replies.map((c) => {
                    const id = toId(c?._id)
                    if (!id) return null

                    const del = Boolean(c?.isDeleted)
                    const a = c?.authorSnapshot || {}
                    const dn = getDisplayNameFromSnapshot(a)
                    const av = getAvatarFromSnapshot(a)
                    const h = getHandleFromSnapshot(a)
                    const replyText = String(c?.text || c?.content || '')

                    const canManageReply = canEditDelete(c)
                    const canReplyReply = Boolean(loggedIn && !del && !isMyComment(c))

                    // ✅ read reaction from user map
                    const replyMyReaction = getMyReactionByCommentId(id)

                    return (
                      <article key={id} className="comment comment--reply">
                        <Avatar src={av} size="sm" className="comment__avatar" />

                        <div className="comment__main">
                          <div className="comment__meta">
                            <span className="comment__name">{dn}</span>
                            {h ? (
                              <a
                                className="comment__handleLink"
                                href={`/channel/${h}`}
                                title="Open channel"
                              >
                                {h}
                              </a>
                            ) : null}
                          </div>

                          <div className={clsx('comment__body', del && 'comment__body--deleted')}>
                            {del ? <T>Comment deleted</T> : renderTextWithLinks(replyText)}
                          </div>

                          <div className="comment__actions">
                            <button
                              type="button"
                              className={clsx(
                                'comment__iconBtn',
                                replyMyReaction === 1 && 'is-active'
                              )}
                              onClick={() => onReact(c, 1)}
                              disabled={!loggedIn || del}
                            >
                              <HiOutlineThumbUp />
                              <span>{formatCount(c?.likesCount)}</span>
                            </button>

                            <button
                              type="button"
                              className={clsx(
                                'comment__iconBtn',
                                replyMyReaction === -1 && 'is-active'
                              )}
                              onClick={() => onReact(c, -1)}
                              disabled={!loggedIn || del}
                            >
                              <HiOutlineThumbDown />
                              <span>{formatCount(c?.dislikesCount)}</span>
                            </button>

                            {canReplyReply ? (
                              <button
                                type="button"
                                className="comment__replyBtn"
                                onClick={() => openReplyModal(c, rootId)}
                                disabled={!loggedIn || del}
                                title={!loggedIn ? 'Sign in to reply' : 'Reply'}
                              >
                                <T>Reply</T>
                              </button>
                            ) : null}

                            {canManageReply ? (
                              <>
                                <button
                                  type="button"
                                  className="comment__editBtn"
                                  onClick={() => openEditModal(c, rootId)}
                                  disabled={del}
                                >
                                  <T>Edit</T>
                                </button>

                                <button
                                  type="button"
                                  className="comment__deleteBtn"
                                  onClick={() => onDelete(c)}
                                  disabled={del}
                                >
                                  <T>Delete</T>
                                </button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              ) : null}
            </div>
          )
        })}

        <div ref={sentinelRef} style={{ height: 1 }} />

        {loading ? (
          <div className="watch-comments__empty">
            <T>Loading…</T>
          </div>
        ) : null}
      </div>

      {/* MODAL (PORTAL) */}
      {modalNode}
    </section>
  )
}

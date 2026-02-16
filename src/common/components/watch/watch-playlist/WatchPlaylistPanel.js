'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import MiniVideoCard from '@/common/shared/mini-video-card/MiniVideoCard'
import { useTranslate } from '@/utils/translating/translating'

const DESC_LIMIT = 85

export default function WatchPlaylistPanel({ playlist, currentId, onSelectVideo }) {
  const [collapsed, setCollapsed] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const more = useTranslate('more')
  const less = useTranslate('less')
  const description = useTranslate(String(playlist?.description || ''))

  const listRef = useRef(null)
  const itemRefs = useRef(new Map())

  const items = useMemo(() => {
    const arr = playlist?.items
    return Array.isArray(arr) ? arr : []
  }, [playlist])

  const currentIndex = useMemo(() => {
    if (!currentId || !items.length) return -1
    return items.findIndex((v) => String(v?._id) === String(currentId))
  }, [items, currentId])

  useEffect(() => {
    if (!currentId) return
    if (!items.length) return
    if (collapsed) return

    const el = itemRefs.current.get(String(currentId))
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
  }, [currentId, items.length, collapsed])

  const hasDesc = Boolean(description)
  const descShort = useMemo(() => {
    if (!description) return ''
    if (description.length <= DESC_LIMIT) return description
    return description.slice(0, DESC_LIMIT).trim() + '…'
  }, [description])

  if (!playlist || !items.length) return null

  const title = playlist?.title || 'Playlist'
  const coverUrl = String(playlist?.coverUrl || '').trim()

  const indexLabel =
    currentIndex >= 0 ? `${currentIndex + 1} / ${items.length}` : `0 / ${items.length}`

  return (
    <section className="watch-playlist" aria-label="Playlist">
      <div className="watch-playlist__header">
        {coverUrl ? (
          <div className="watch-playlist__cover" aria-hidden="true">
            <img src={coverUrl} alt="Playlist cover" />
          </div>
        ) : null}

        <div className="watch-playlist__headMain">
          <div className="watch-playlist__titleRow">
            <div className="watch-playlist__title" title={title}>
              {title}
            </div>

            {/* <button type="button" onClick={() => setCollapsed(v => !v)}>...</button> */}
          </div>

          {hasDesc ? (
            <div className="watch-playlist__desc">
              <span className="watch-playlist__descText">{showMore ? description : descShort}</span>
              {description.length > DESC_LIMIT ? (
                <button
                  type="button"
                  className="watch-playlist__moreBtn"
                  onClick={() => setShowMore((v) => !v)}
                >
                  {showMore ? less : more}
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="watch-playlist__count">{indexLabel}</div>
        </div>
      </div>

      <div
        ref={listRef}
        className={clsx('watch-playlist__list', collapsed && 'watch-playlist__list--collapsed')}
      >
        {items.map((v) => {
          const id = String(v?._id || '')
          const isActive = id && String(currentId) === id

          return (
            <div
              key={id}
              ref={(node) => {
                if (!id) return
                if (node) itemRefs.current.set(id, node)
                else itemRefs.current.delete(id)
              }}
              data-active={isActive ? '1' : '0'}
            >
              <MiniVideoCard
                video={v}
                active={isActive}
                onClick={() => onSelectVideo?.(v._id)}
                showChannel={true}
                size="sm"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

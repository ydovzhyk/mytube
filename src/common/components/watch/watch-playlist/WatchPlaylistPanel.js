'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import MiniVideoCard from '@/common/shared/mini-video-card/MiniVideoCard'
import T from '@/common/shared/i18n/T'
import { useTranslate } from '@/utils/translating/translating'

const DESC_LIMIT = 85

export default function WatchPlaylistPanel({
  playlist,
  currentId,
  onSelectVideo,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [showMore, setShowMore] = useState(false)

  const more = useTranslate('more')
  const less = useTranslate('less')
  const description = useTranslate(String(playlist?.description || ''))

  const items = useMemo(() => {
    const arr = playlist?.items
    return Array.isArray(arr) ? arr : []
  }, [playlist])

  const currentIndex = useMemo(() => {
    if (!currentId || !items.length) return -1
    return items.findIndex((v) => String(v?._id) === String(currentId))
  }, [items, currentId])

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
      {/* HEADER */}
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
          </div>

          {/* DESCRIPTION */}
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

      {/* LIST */}
      <div className={clsx('watch-playlist__list', collapsed && 'watch-playlist__list--collapsed')}>
        {items.map((v) => (
          <MiniVideoCard
            key={v._id}
            video={v}
            active={String(v?._id) === String(currentId)}
            onClick={() => onSelectVideo?.(v._id)}
            showChannel={true}
            size="sm"
          />
        ))}
      </div>
    </section>
  )
}

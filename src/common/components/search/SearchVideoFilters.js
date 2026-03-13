'use client'

import clsx from 'clsx'
import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslate } from '@/utils/translating/translating'
import T from '@/common/shared/i18n/T'

const FILTERS = [
  { key: 'relevance', label: 'Relevance' },
  { key: 'latest', label: 'Latest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'popular', label: 'Popular' },
]

export default function SearchVideoFilters({ sortFromUrl, inMyPlaylistsFromUrl, isLoggedIn }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const tFilters = useTranslate('Search filters')

  const activeSort = sortFromUrl || 'relevance'
  const notInPlaylistsActive = isLoggedIn && inMyPlaylistsFromUrl === '0'

  const updateParams = useCallback(
    (mutate) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)

      const next = params.toString()
      router.push(next ? `${pathname}?${next}` : pathname, { scroll: false })
    },
    [router, pathname, searchParams]
  )

  const applySort = useCallback(
    (sortKey) => {
      updateParams((params) => {
        params.set('sort', sortKey || 'relevance')
      })
    },
    [updateParams]
  )

  const toggleNotInPlaylists = useCallback(() => {
    if (!isLoggedIn) return

    updateParams((params) => {
      const current = String(params.get('inMyPlaylists') || '').trim()

      if (current === '0') {
        params.delete('inMyPlaylists')
      } else {
        params.set('inMyPlaylists', '0')

        if (!params.get('sort')) {
          params.set('sort', sortFromUrl || 'relevance')
        }
      }
    })
  }, [isLoggedIn, sortFromUrl, updateParams])

  return (
    <section className="search-filters">
      <div className="search-filters__list" role="tablist" aria-label={tFilters}>
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={clsx(
              'search-filters__item',
              activeSort === item.key && 'search-filters__item--active'
            )}
            onClick={() => applySort(item.key)}
            role="tab"
            aria-selected={activeSort === item.key}
          >
            <T>{item.label}</T>
          </button>
        ))}

        {isLoggedIn ? (
          <button
            type="button"
            className={clsx(
              'search-filters__item',
              notInPlaylistsActive && 'search-filters__item--active'
            )}
            onClick={toggleNotInPlaylists}
            aria-pressed={notInPlaylistsActive}
          >
            <T>Not in playlists</T>
          </button>
        ) : null}
      </div>
    </section>
  )
}

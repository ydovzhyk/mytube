'use client'

import Link from 'next/link'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'

import { getLogin, getUser } from '@/store/auth/auth-selectors'
import { logout } from '@/store/auth/auth-operations'
import { getVisitor } from '@/store/visitor/visitor-selectors'

import Avatar from '../../shared/avatar/Avatar'
import TranslateMe from '@/utils/translating/translating'
import T from '@/common/shared/i18n/T'
import { useTranslate } from '@/utils/translating/translating'

import { FaPlay } from 'react-icons/fa'
import { HiBell, HiMenu, HiPlus, HiSearch } from 'react-icons/hi'
import { RxDividerVertical } from 'react-icons/rx'

function cleanQ(v) {
  return String(v || '')
    .trim()
    .replace(/\s+/g, ' ')
}

function toIsoOrEmpty(d) {
  const x = d ? new Date(d) : null
  return x && !Number.isNaN(x.getTime()) ? x.toISOString() : ''
}

export function Header({ onMenuClick }) {
  const dispatch = useDispatch()
  const router = useRouter()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const isLoggedIn = useSelector(getLogin)
  const user = useSelector(getUser)
  const visitor = useSelector(getVisitor)

  const tSearchPlaceholder = useTranslate('Search videos, channels...')
  const tAddChannel = useTranslate('add channel')
  const tYourChannel = useTranslate('your channel')
  const tYourChannels = useTranslate('your channels')

  const [query, setQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchWrapRef = useRef(null)

  const rawHistory = isLoggedIn ? user?.searchHistory : visitor?.searchHistory

  const historyItems = useMemo(() => {
    if (!Array.isArray(rawHistory)) return []
    return rawHistory
      .map((it) => ({
        q: cleanQ(it?.q),
        at: toIsoOrEmpty(it?.at),
      }))
      .filter((it) => it.q)
  }, [rawHistory])

  const filteredHistory = useMemo(() => {
    const q = cleanQ(query).toLowerCase()
    if (!q) return historyItems
    return historyItems.filter((it) => it.q.toLowerCase().includes(q))
  }, [historyItems, query])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useEffect(() => {
    function handleOutsideClick(event) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setIsSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const goToSearchPage = useCallback(
    (rawQ) => {
      const value = cleanQ(rawQ)
      if (value.length < 2) return
      setQuery('')
      setIsSearchOpen(false)
      router.push(`/search?q=${encodeURIComponent(value)}`)
    },
    [router]
  )

  const onSubmitSearch = useCallback(
    (e) => {
      e.preventDefault()
      goToSearchPage(query)
    },
    [goToSearchPage, query]
  )

  const onClickSearchIcon = useCallback(() => {
    goToSearchPage(query)
  }, [goToSearchPage, query])

  const onKeyDownSearch = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsSearchOpen(false)
    }
  }, [])

  const onPickHistory = useCallback(
    (item) => {
      const q = cleanQ(item?.q)
      if (!q) return
      setQuery(q)
      goToSearchPage(q)
    },
    [goToSearchPage]
  )

  const showHistory = isSearchOpen

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__left">
          <button className="header__menu-btn" onClick={onMenuClick}>
            <HiMenu />
          </button>

          <Link href="/" className="header__logo">
            <FaPlay className="header__logo-icon" />
            <span>MyTube</span>
          </Link>
        </div>

        <div className="header__center">
          <div className="search-field-wrap" ref={searchWrapRef}>
            <form className="search-field" onSubmit={onSubmitSearch}>
              <button
                type="button"
                className="search-field__icon-btn"
                onClick={onClickSearchIcon}
                aria-label="Search"
              >
                <HiSearch className="search-field__icon" />
              </button>

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDownSearch}
                onFocus={() => setIsSearchOpen(true)}
                placeholder={tSearchPlaceholder}
                className="search-field__input"
                autoComplete="off"
                enterKeyHint="search"
                name="q"
              />
            </form>

            {showHistory && (
              <div className="search-suggest">
                {filteredHistory.length === 0 ? (
                  <div className="search-suggest__hint">No recent searches</div>
                ) : (
                  <div className="search-suggest__list">
                    {filteredHistory.slice(0, 30).map((it) => {
                      const key = `${it.q}__${it.at || ''}`
                      return (
                        <button
                          key={key}
                          type="button"
                          className="search-suggest__item search-suggest__item--history"
                          onClick={() => onPickHistory(it)}
                          title={it.q}
                        >
                          <div className="search-suggest__meta">
                            <div className="search-suggest__title">{it.q}</div>
                            {it.at ? (
                              <div className="search-suggest__sub">
                                {new Date(it.at).toLocaleString()}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                <button
                  type="button"
                  className="search-suggest__all"
                  onClick={() => setIsSearchOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="header__right">
          <TranslateMe />

          {!isLoggedIn ? (
            <div className="header__auth-links">
              <Link href="/auth/login" className="header__text-link header__text-link--primary">
                <T caseMode="sentence">login</T>
              </Link>

              <span className="header__auth-divider" aria-hidden="true">
                <RxDividerVertical size={20} />
              </span>

              <Link href="/auth/register" className="header__text-link header__text-link--primary">
                <T caseMode="sentence">register</T>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/studio" className="header__action">
                <HiPlus />
              </Link>

              <button className="header__action">
                <HiBell />
              </button>

              <div className="dropdown" ref={dropdownRef}>
                <button
                  className="header__profile"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Avatar
                    src={user?.userAvatar || '/images/avatar.png'}
                    alt={user?.name || 'User'}
                    size="sm"
                  />
                </button>

                <div
                  className={clsx('dropdown__content', {
                    'dropdown__content--open': isDropdownOpen,
                  })}
                >
                  <div className="dropdown__header">
                    <Avatar
                      src={user?.userAvatar || '/images/avatar.png'}
                      alt={user?.name || 'User'}
                      size="lg"
                    />
                    <div className="dropdown__header-info">
                      <div>{user?.name || 'User Name'}</div>
                      <div className="dropdown__header-username">@{user?.name || 'User'}</div>
                    </div>
                  </div>

                  <div className="dropdown__body">
                    {(() => {
                      const channelIds = user?.channels
                      const count = Array.isArray(channelIds) ? channelIds.length : 0

                      const label =
                        count === 0 ? tAddChannel : count === 1 ? tYourChannel : tYourChannels

                      return (
                        <Link
                          href="/channels"
                          className="dropdown__item"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <T caseMode="sentence">{label}</T>
                        </Link>
                      )
                    })()}

                    <Link
                      href="/studio"
                      className="dropdown__item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <T caseMode="sentence">studio</T>
                    </Link>

                    <Link
                      href="/studio/settings"
                      className="dropdown__item"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <T caseMode="sentence">settings</T>
                    </Link>

                    <div className="dropdown__divider" />

                    <button
                      className="dropdown__item dropdown__item--danger"
                      onClick={async () => {
                        setIsDropdownOpen(false)
                        try {
                          await dispatch(logout()).unwrap()
                        } finally {
                          router.push('/')
                        }
                      }}
                    >
                      <T caseMode="sentence">sign out</T>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

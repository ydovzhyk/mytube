'use client'

import Link from 'next/link'
import clsx from 'clsx'
import { useEffect, useRef, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useRouter } from 'next/navigation'

import Avatar from '../../shared/avatar/Avatar'
import { getLogin, getUser } from '@/store/auth/auth-selectors'
import { logout } from '@/store/auth/auth-operations'

import TranslateMe from '@/utils/translating/translating'
import T from '@/common/shared/i18n/T'
import { useTranslate } from '@/utils/translating/translating'

import { FaPlay } from 'react-icons/fa'
import { HiBell, HiMenu, HiPlus, HiSearch } from 'react-icons/hi'
import { RxDividerVertical } from 'react-icons/rx'

export function Header({ onMenuClick }) {
  const dispatch = useDispatch()
  const router = useRouter()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const isLoggedIn = useSelector(getLogin)
  const user = useSelector(getUser)
  const tSearchPlaceholder = useTranslate('Search videos, channels...')
  const tAddChannel = useTranslate('add channel')
  const tYourChannel = useTranslate('your channel')
  const tYourChannels = useTranslate('your channels')

  useEffect(() => {
    function handleOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

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
          <form className="search-field">
            <HiSearch className="search-field__icon" />
            <input placeholder={tSearchPlaceholder} className="search-field__input" />
          </form>
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
                      onClick={() => {
                        setIsDropdownOpen(false)
                        dispatch(logout())
                        router.push('/')
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

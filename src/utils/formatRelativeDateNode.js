import React from 'react'
import T from '@/common/shared/i18n/T'

function startOfDayMs(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function diffDays(fromDate, toDate) {
  // calendar days difference (not 24h chunks)
  const a = startOfDayMs(fromDate)
  const b = startOfDayMs(toDate)
  return Math.floor((b - a) / 86400000)
}

function safeDate(input) {
  if (!input) return null
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * YouTube-like relative date label:
 * today / yesterday / X days ago / 1 week ago / X weeks ago / 1 month ago / X months ago / 1 year ago / X years ago
 *
 * Returns ReactNode so you can compose numbers + <T>.
 *
 * @param {string|number|Date} input
 * @param {object} [opts]
 * @param {Date} [opts.now] optional override (tests)
 * @returns {import('react').ReactNode|null}
 */
export default function formatRelativeDateNode(input, opts = {}) {
  const d = safeDate(input)
  if (!d) return null

  const now = opts.now instanceof Date ? opts.now : new Date()

  // Future (scheduled). If you don't want this, change to fallback date.
  const deltaDays = diffDays(d, now)
  if (deltaDays < 0) return <T caseMode="lower">scheduled</T>

  if (deltaDays === 0) return <T caseMode="lower">today</T>
  if (deltaDays === 1) return <T caseMode="lower">yesterday</T>

  if (deltaDays < 7) {
    // 2..6 days
    return (
      <>
        {deltaDays} <T caseMode="lower">days ago</T>
      </>
    )
  }

  const weeks = Math.floor(deltaDays / 7)
  if (deltaDays < 30) {
    if (weeks === 1) return <T caseMode="lower">1 week ago</T>
    return (
      <>
        {weeks} <T caseMode="lower">weeks ago</T>
      </>
    )
  }

  const months = Math.floor(deltaDays / 30)
  if (deltaDays < 365) {
    if (months <= 1) return <T caseMode="lower">1 month ago</T>
    return (
      <>
        {months} <T caseMode="lower">months ago</T>
      </>
    )
  }

  const years = Math.floor(deltaDays / 365)
  if (years <= 1) return <T caseMode="lower">1 year ago</T>
  return (
    <>
      {years} <T caseMode="lower">years ago</T>
    </>
  )
}

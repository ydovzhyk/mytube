'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { useLanguage } from '@/providers/languageContext'
import { translateMyText } from '@/utils/translating/translating'

import { getChannelsError, getChannelsMessage } from '@/store/channel/channel-selectors'
import { clearChannelsError, clearChannelsMessage } from '@/store/channel/channel-slice'

import { getAuthError, getAuthMessage } from '@/store/auth/auth-selectors'
import { clearAuthError, clearAuthMessage } from '@/store/auth/auth-slice'

import { getTechnicalError, getTechnicalMessage } from '@/store/technical/technical-selectors'
import { clearTechnicalError, clearTechnicalMessage } from '@/store/technical/technical-slice'

import { getVideosError, getVideosMessage } from '@/store/videos/videos-selectors'
import { clearVideosError, clearVideosMessage } from '@/store/videos/videos-slice'

const toStr = (v) => {
  if (!v) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'object') return v.message || v.error || JSON.stringify(v)
  return String(v)
}

function useToastPair({ error, message, clearError, clearMessage }) {
  const dispatch = useDispatch()
  const { languageIndex, hydrated } = useLanguage()

  const lastErrorRef = useRef({ text: null, ts: 0 })
  const lastMsgRef = useRef({ text: null, ts: 0 })

  const DEDUPE_WINDOW_MS = 900

  useEffect(() => {
    const raw = toStr(error)
    if (!raw || !hydrated) return

    const now = Date.now()
    if (
      lastErrorRef.current.text === raw &&
      now - lastErrorRef.current.ts < DEDUPE_WINDOW_MS
    ) {
      dispatch(clearError())
      return
    }

    lastErrorRef.current = { text: raw, ts: now }

    let cancelled = false
    ;(async () => {
      const translated = await translateMyText(raw, languageIndex)
      if (cancelled) return
      toast.error(translated)
      dispatch(clearError())
    })()

    return () => {
      cancelled = true
    }
  }, [error, hydrated, languageIndex, dispatch, clearError])

  useEffect(() => {
    const raw = toStr(message)
    if (!raw || !hydrated) return

    const now = Date.now()
    if (
      lastMsgRef.current.text === raw &&
      now - lastMsgRef.current.ts < DEDUPE_WINDOW_MS
    ) {
      dispatch(clearMessage())
      return
    }

    lastMsgRef.current = { text: raw, ts: now }

    let cancelled = false
    ;(async () => {
      const translated = await translateMyText(raw, languageIndex)
      if (cancelled) return
      toast.success(translated)
      dispatch(clearMessage())
    })()

    return () => {
      cancelled = true
    }
  }, [message, hydrated, languageIndex, dispatch, clearMessage])
}

export default function ToastListener() {
  const channelsError = useSelector(getChannelsError)
  const channelsMessage = useSelector(getChannelsMessage)

  const authError = useSelector(getAuthError)
  const authMessage = useSelector(getAuthMessage)

  const technicalError = useSelector(getTechnicalError)
  const technicalMessage = useSelector(getTechnicalMessage)

  const videosError = useSelector(getVideosError)
  const videosMessage = useSelector(getVideosMessage)

  useToastPair({
    error: channelsError,
    message: channelsMessage,
    clearError: clearChannelsError,
    clearMessage: clearChannelsMessage,
  })

  useToastPair({
    error: authError,
    message: authMessage,
    clearError: clearAuthError,
    clearMessage: clearAuthMessage,
  })

  useToastPair({
    error: technicalError,
    message: technicalMessage,
    clearError: clearTechnicalError,
    clearMessage: clearTechnicalMessage,
  })

  useToastPair({
    error: videosError,
    message: videosMessage,
    clearError: clearVideosError,
    clearMessage: clearVideosMessage,
  })

  return null
}


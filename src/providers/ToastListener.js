'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

import { getChannelError, getChannelMessage } from '@/store/channel/channel-selectors'
import { clearChannelError, clearChannelMessage } from '@/store/channel/channel-slice'

import { getAuthError, getAuthMessage } from '@/store/auth/auth-selectors'
import { clearAuthError, clearAuthMessage } from '@/store/auth/auth-slice'

import { getTechnicalError, getTechnicalMessage } from '@/store/technical/technical-selectors'
import { clearTechnicalError, clearTechnicalMessage } from '@/store/technical/technical-slice'

import { getVideosError, getVideosMessage } from '@/store/videos/videos-selectors'
import { clearVideosError, clearVideosMessage } from '@/store/videos/videos-slice'

function useToastPair({ error, message, clearError, clearMessage }) {
  const dispatch = useDispatch()

  useEffect(() => {
    if (!error) return
    toast.error(error)
    dispatch(clearError())
  }, [error, dispatch, clearError])

  useEffect(() => {
    if (!message) return
    toast.success(message)
    dispatch(clearMessage())
  }, [message, dispatch, clearMessage])
}

export default function ToastListener() {
  const channelError = useSelector(getChannelError)
  const channelMessage = useSelector(getChannelMessage)

  const authError = useSelector(getAuthError)
  const authMessage = useSelector(getAuthMessage)

  const technicalError = useSelector(getTechnicalError)
  const technicalMessage = useSelector(getTechnicalMessage)

  const videosError = useSelector(getVideosError)
  const videosMessage = useSelector(getVideosMessage)

  useToastPair({
    error: channelError,
    message: channelMessage,
    clearError: clearChannelError,
    clearMessage: clearChannelMessage,
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

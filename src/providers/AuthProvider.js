'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useRouter } from 'next/navigation'

import { getLogin } from '@/store/auth/auth-selectors'
import { getCurrentUser } from '@/store/auth/auth-operations'
import { setRefreshUserData } from '@/store/auth/auth-slice'

export default function AuthProvider() {
  const dispatch = useDispatch()
  const router = useRouter()
  const isLogin = useSelector(getLogin)
  const sid = useSelector((state) => state.auth.sid)

  const oauthInitRef = useRef(false)

  // 1) Якщо є sid у сторах/персисті, але користувача ще нема — підтягнемо
  useEffect(() => {
    if (oauthInitRef.current) return
    if (sid && !isLogin) {
      dispatch(getCurrentUser())
    }
  }, [dispatch, sid, isLogin])

  // 2) OAuth init з URL: ?accessToken=...&sid=...
  useEffect(() => {
    const initAuthFromUrl = async () => {
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = urlParams.get('accessToken')
      const sidFromUrl = urlParams.get('sid')

      if (!accessToken || !sidFromUrl) return

      oauthInitRef.current = true

      const data = { accessToken, sid: sidFromUrl }

      try {
        localStorage.setItem('mytube.authData', JSON.stringify(data))
      } catch {}

      dispatch(setRefreshUserData(data))

      try {
        await dispatch(getCurrentUser())
      } finally {
        router.replace(window.location.pathname)
        setTimeout(() => {
          oauthInitRef.current = false
        }, 0)
      }
    }

    initAuthFromUrl()
  }, [dispatch, router])

  return null
}

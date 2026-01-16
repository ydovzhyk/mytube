'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useSelector } from 'react-redux'
import { getIsRefreshing, getLogin } from '@/store/auth/auth-selectors'
import Loader from '@/common/shared/loader/Loader'

const AUTH_ONLY = ['/auth/login', '/auth/register'] // не можна коли залогінений
const PROTECTED_PREFIXES = ['/upload', '/studio', '/profile'] // приклад, розшириш

export default function RouteGuard({ children }) {
  const router = useRouter()
  const pathname = usePathname()

  const isRefreshing = useSelector(getIsRefreshing)
  const isLogin = useSelector(getLogin)
  const isAuthed = Boolean(isLogin) // коли true — точно залогінений

  useEffect(() => {
    if (isRefreshing) return

    const isAuthOnly = AUTH_ONLY.includes(pathname)
    const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))

    // 1) якщо не залогінений і зайшов у protected → на login
    if (!isAuthed && isProtected) {
      router.replace('/auth/login')
      return
    }

    // 2) якщо залогінений і зайшов у login/register → на головну
    if (isAuthed && isAuthOnly) {
      router.replace('/')
      return
    }
  }, [isRefreshing, isAuthed, pathname, router])

  // поки refresh — показуємо глобальний лоадер, щоб не було flicker
  if (isRefreshing) return <Loader />

  return children
}

'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getLogin } from '@/store/auth/auth-selectors'
import { getCurrentUser } from '@/store/auth/auth-operations'
import { initVisitor } from '@/store/visitor/visitor-operations'

export default function AuthProvider() {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)
  const didInit = useRef(false)

  useEffect(() => {
    if (didInit.current) return
    didInit.current = true

    dispatch(initVisitor())

    if (isLogin === null) {
      dispatch(getCurrentUser())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  return null
}

// 'use client'

// import { useEffect, useRef } from 'react'
// import { useDispatch, useSelector } from 'react-redux'
// import { getLogin } from '@/store/auth/auth-selectors'
// import { getCurrentUser } from '@/store/auth/auth-operations'

// export default function AuthProvider() {
//   const dispatch = useDispatch()
//   const isLogin = useSelector(getLogin)
//   const didInit = useRef(false)

//   useEffect(() => {
//     if (didInit.current) return
//     didInit.current = true

//     if (isLogin === null) {
//       dispatch(getCurrentUser())
//     }
//   }, [dispatch, isLogin])

//   return null
// }

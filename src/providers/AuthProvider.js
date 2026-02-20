'use client'

import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getLogin } from '@/store/auth/auth-selectors'
import { getCurrentUser } from '@/store/auth/auth-operations'
import { initVisitor } from '@/store/visitor/visitor-operations'
import { resetVisitor } from '@/store/visitor/visitor-slice'

// export default function AuthProvider() {
//   const dispatch = useDispatch()
//   const isLogin = useSelector(getLogin)
//   const didInit = useRef(false)

//   useEffect(() => {
//     if (didInit.current) return
//     didInit.current = true

//     dispatch(initVisitor())

//     if (isLogin === null) {
//       dispatch(getCurrentUser())
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [dispatch])

//   return null
// }

export default function AuthProvider() {
  const dispatch = useDispatch()
  const isLogin = useSelector(getLogin)

  useEffect(() => {
    dispatch(initVisitor())
    dispatch(getCurrentUser())
  }, [dispatch])

  useEffect(() => {
    if (isLogin === true) {
      dispatch(resetVisitor())
      return
    }
    if (isLogin === false) {
      dispatch(resetVisitor())
      dispatch(initVisitor())
    }
  }, [dispatch, isLogin])

  return null
}
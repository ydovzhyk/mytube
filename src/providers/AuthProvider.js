'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getLogin } from '@/store/auth/auth-selectors'
import { getCurrentUser } from '@/store/auth/auth-operations'
import { initVisitor } from '@/store/visitor/visitor-operations'
import { resetVisitor } from '@/store/visitor/visitor-slice'

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
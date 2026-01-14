'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const LanguageContext = createContext(undefined)
const STORAGE_KEY = 'mytube.settings'

function readIndexFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    const idx = Number(parsed?.selectedIndex)
    return Number.isFinite(idx) && idx >= 0 ? idx : 0
  } catch {
    return 0
  }
}

export const LanguageProvider = ({ children }) => {
  const [languageIndex, setLanguageIndex] = useState(0)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const idx = readIndexFromStorage()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLanguageIndex(idx)
    setHydrated(true)
  }, [])

  const updateLanguageIndex = useCallback((index) => {
    setLanguageIndex(index)
  }, [])

  const value = useMemo(
    () => ({ languageIndex, hydrated, updateLanguageIndex }),
    [languageIndex, hydrated, updateLanguageIndex]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export const useLanguage = () => {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}

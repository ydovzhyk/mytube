'use client'

import { useTranslate } from '@/utils/translating/translating'

function applyCaseMode(text, mode) {
  const s = String(text ?? '')
  if (!s) return s

  switch (mode) {
    case 'lower':
      return s.toLowerCase()

    case 'title':
      return s.replace(/\b\p{L}/gu, (c) => c.toUpperCase())

    case 'sentence':
    default:
      return s.replace(/^\s*\p{L}/u, (c) => c.toUpperCase())
  }
}

export default function T({ children, noTranslate = false, caseMode = 'sentence' }) {
  const isPrimitive = typeof children === 'string' || typeof children === 'number'
  const raw = isPrimitive ? String(children) : ''

  const translated = useTranslate(raw)

  if (!isPrimitive) return <>{children}</>

  const out = noTranslate ? raw : translated
  return <>{applyCaseMode(out, caseMode)}</>
}

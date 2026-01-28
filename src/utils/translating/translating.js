'use client'

import Select, { components } from 'react-select'
import { useMemo, useState, useEffect } from 'react'
import { useLanguage } from '@/providers/languageContext'
import languagesAndCodes from './languagesAndCodes'

const STORAGE_KEY = 'mytube.settings'

function writeSettings(patch) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const prev = raw ? JSON.parse(raw) : {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, ...patch }))
  } catch {}
}

function Flag({ src, alt }) {
  return <img className="langrs__flag" src={src} alt={alt} />
}

const SingleValue = (props) => {
  const { data } = props
  return (
    <components.SingleValue {...props}>
      <span className="langrs__value">
        <Flag src={data.flag} alt={data.lang} />
        <span className="langrs__ui">{data.ui}</span>
      </span>
    </components.SingleValue>
  )
}

const Option = (props) => {
  const { data } = props
  return (
    <components.Option {...props}>
      <span className="langrs__option">
        <Flag src={data.flag} alt={data.lang} />
        <span className="langrs__ui">{data.ui}</span>
      </span>
    </components.Option>
  )
}

const DropdownIndicator = (props) => (
  <components.DropdownIndicator {...props}>
    <span className="langrs__chev" aria-hidden="true" />
  </components.DropdownIndicator>
)

const selectStyles = {
  menuPortal: (base) => ({ ...base, zIndex: 20000 }),
  menu: (base) => ({ ...base, zIndex: 20000 }),
}

export default function TranslateMe() {
  const { languageIndex, hydrated, updateLanguageIndex } = useLanguage()

  const options = useMemo(() => {
    const langs = languagesAndCodes?.languages ?? []
    return langs.map((l, idx) => ({ value: idx, ...l }))
  }, [])

  if (!hydrated) return null
  if (!options.length) return null

  const value = options[languageIndex] || options[0]

  return (
    <div className="lang-select">
      <Select
        classNamePrefix="langrs"
        className="langrs"
        isSearchable={false}
        options={options}
        value={value}
        onChange={(opt) => {
          const idx = Number(opt?.value)
          if (!Number.isFinite(idx)) return
          updateLanguageIndex(idx)
          writeSettings({ selectedIndex: idx })
        }}
        components={{ SingleValue, Option, DropdownIndicator, IndicatorSeparator: null }}
        styles={selectStyles}
        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
        menuPosition="fixed"
        menuPlacement="bottom"
      />
    </div>
  )
}

const _cache = new Map() // key: `${to}::${text}`

export async function translateMyText(text = '', languageIndex) {
  const { languages } = languagesAndCodes
  const lang = languages?.[languageIndex]

  const str = Array.isArray(text) ? text.join('') : String(text ?? '')
  if (!str.trim()) return ''
  if (!lang) return str
  if (lang.code === 'en') return str

  const key = `${lang.code}::${str}`
  if (_cache.has(key)) return _cache.get(key)

  try {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: str, to: lang.code }),
    })

    if (!res.ok) return str
    const data = await res.json()
    const out = data?.result ?? str

    _cache.set(key, out)
    return out
  } catch {
    return str
  }
}

export const useTranslate = (text) => {
  const [translatedText, setTranslatedText] = useState(text)
  const { languageIndex } = useLanguage()

  useEffect(() => {
    let cancelled = false

    translateMyText(text, languageIndex)
      .then((res) => {
        if (cancelled) return
        setTranslatedText(res)
      })
      .catch((err) => console.error(err))

    return () => {
      cancelled = true
    }
  }, [text, languageIndex])

  return translatedText
}

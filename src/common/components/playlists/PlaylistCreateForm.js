'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

import { useTranslate } from '@/utils/translating/translating'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { getChannels } from '@/store/channel/channel-selectors'
import { getVideosPicker } from '@/store/videos/videos-operations'
import {
  getVideosLoading,
  getVideosError,
  getVideosMessage,
  getVideosPickerItems,
  getVideosPickerChannelId,
} from '@/store/videos/videos-selectors'
import { resetVideosPicker } from '@/store/videos/videos-slice'

const normalizeHandle = (raw = '') => String(raw).trim().toLowerCase().replace(/^@+/, '')

function parseActiveHandle(pathname = '') {
  const parts = String(pathname || '').split('/')
  const maybe = parts[2] // /channels/@handle/...
  if (!maybe?.startsWith('@')) return null
  return normalizeHandle(maybe.slice(1))
}

function sortSelectedItems(selectedMap) {
  // selectedMap: { [videoId]: { included:boolean, order:number|string|null } }
  const out = []
  Object.entries(selectedMap || {}).forEach(([videoId, v]) => {
    if (!v?.included) return
    const n = Number(v?.order)
    if (!Number.isFinite(n) || n <= 0) return
    out.push({ videoId, order: n })
  })
  out.sort((a, b) => a.order - b.order)
  return out
}

function nextAvailableOrder(selectedMap) {
  const used = new Set()
  Object.values(selectedMap || {}).forEach((v) => {
    if (!v?.included) return
    const n = Number(v?.order)
    if (Number.isFinite(n) && n > 0) used.add(n)
  })
  let i = 1
  while (used.has(i)) i += 1
  return i
}

function useResettableState(initialValue, resetKey) {
  const [state, setState] = useState(initialValue)
  const [prevKey, setPrevKey] = useState(resetKey)

  if (prevKey !== resetKey) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setPrevKey(resetKey)
    // eslint-disable-next-line react-hooks/rules-of-hooks
    setState(initialValue)
  }

  return [state, setState]
}

export default function PlaylistCreateForm() {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const router = useRouter()

  const channels = useSelector(getChannels)
  const loading = useSelector(getVideosLoading)
  const error = useSelector(getVideosError)
  const message = useSelector(getVideosMessage)

  const pickerItems = useSelector(getVideosPickerItems)
  console.log('pickerItems:', pickerItems)
  const pickerChannelId = useSelector(getVideosPickerChannelId)


  const activeHandleFromPath = useMemo(() => parseActiveHandle(pathname), [pathname])

  const activeChannel = useMemo(() => {
    if (!activeHandleFromPath) return null
    return channels.find((c) => normalizeHandle(c?.handle) === activeHandleFromPath) || null
  }, [channels, activeHandleFromPath])

  const selectionResetKey = useMemo(() => String(activeChannel?._id || ''), [activeChannel?._id])
  const [selected, setSelected] = useResettableState({}, selectionResetKey)

  // playlist cover (required at creation)
  const [coverFile, setCoverFile] = useState(null)
  const coverLabel = useMemo(() => {
    if (!coverFile) return ''
    const mb = (coverFile.size / 1024 / 1024).toFixed(1)
    return `${coverFile.name} • ${mb}MB`
  }, [coverFile])

  const titlePlaceholder = useTranslate('Give your playlist a name')
  const descPlaceholder = useTranslate('Optional')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      visibility: 'public', // public | unlisted | private
      channelRef: '',
    },
  })

  const watchedTitle = watch('title')

  // channelRef + handle validation (like upload form)
  useEffect(() => {
    if (!activeHandleFromPath) {
      setValue('channelRef', '', { shouldValidate: true })
      setError('channelRef', { type: 'manual', message: 'Channel handle is missing in URL' })
      return
    }

    if (activeHandleFromPath && !activeChannel?._id) {
      setValue('channelRef', '', { shouldValidate: true })
      setError('channelRef', {
        type: 'manual',
        message: `Channel @${activeHandleFromPath} not found`,
      })
      return
    }

    clearErrors('channelRef')
    setValue('channelRef', String(activeChannel._id), { shouldValidate: true, shouldDirty: true })
  }, [activeHandleFromPath, activeChannel?._id, setValue, setError, clearErrors])

  // load picker videos
  useEffect(() => {
    if (!activeChannel?._id) return

    const chId = String(activeChannel._id)

    if (pickerChannelId && String(pickerChannelId) !== chId) {
      dispatch(resetVideosPicker())
    }

    const alreadyForThisChannel = String(pickerChannelId || '') === chId
    const hasItems = Array.isArray(pickerItems) && pickerItems.length > 0
    if (alreadyForThisChannel && hasItems) return

    dispatch(getVideosPicker({ channelId: chId }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, activeChannel?._id, pickerChannelId])

  const disabled = loading || isSubmitting

  const includedCount = useMemo(() => {
    return Object.values(selected).filter((v) => v?.included).length
  }, [selected])

  const nextOrder = useMemo(() => nextAvailableOrder(selected), [selected])

  // ✅ selected items for submit + for button state
  const selectedItems = useMemo(() => sortSelectedItems(selected), [selected])

  // ✅ button active only when form is really ready
  const hasChannel = Boolean(activeChannel?._id) && !errors.channelRef?.message
  const hasTitle = String(watchedTitle || '').trim().length >= 2
  const hasCover = Boolean(coverFile)
  const hasAtLeastOneVideo = selectedItems.length > 0

  const canSubmit = hasChannel && hasTitle && hasCover && hasAtLeastOneVideo && !disabled

  const onToggleInclude = (videoId) => {
    setSelected((prev) => {
      const cur = prev?.[videoId] || { included: false, order: '' }
      const nextIncluded = !cur.included
      const next = { ...prev }

      if (nextIncluded) {
        next[videoId] = { included: true, order: cur.order || nextOrder }
      } else {
        next[videoId] = { included: false, order: '' }
      }
      return next
    })
  }

  const onChangeOrder = (videoId, value) => {
    setSelected((prev) => ({
      ...prev,
      [videoId]: {
        included: true,
        order: value,
      },
    }))
  }

  const validateSelected = () => {
    const items = sortSelectedItems(selected)
    if (!items.length) return { ok: false, msg: 'Pick at least one video and set order' }

    const seen = new Set()
    for (const it of items) {
      if (seen.has(it.order)) return { ok: false, msg: 'Order numbers must be unique' }
      seen.add(it.order)
    }

    return { ok: true, items }
  }

  const onSubmit = async (data) => {
    if (!activeChannel?._id) return

    const v = validateSelected()
    if (!v.ok) {
      setError('root', { type: 'manual', message: v.msg })
      return
    }
    clearErrors('root')

    if (!coverFile) {
      setError('root', { type: 'manual', message: 'Playlist cover image is required' })
      return
    }

    const fd = new FormData()
    fd.append('channelRef', String(activeChannel._id))
    fd.append('title', String(data.title || '').trim())
    fd.append('description', String(data.description || ''))
    fd.append('visibility', String(data.visibility || 'public'))
    fd.append('cover', coverFile)
    fd.append('items', JSON.stringify(v.items))

    // TODO: dispatch(createPlaylist(fd)).unwrap()
    console.log('CREATE PLAYLIST payload:', {
      channelRef: String(activeChannel._id),
      title: data.title,
      visibility: data.visibility,
      items: v.items,
    })

    reset()
    setCoverFile(null)
    router.push(`/channels/@${normalizeHandle(activeChannel.handle)}/playlists`)
  }

  return (
    <div className="playlist-card">
      <h1 className="playlist-card__title">
        <T>Create playlist</T>
      </h1>

      <p className="playlist-card__subtitle">
        <T caseMode="sentence">Pick videos, set their order, and upload a cover image</T>
      </p>

      {/* CHANNEL INFO */}
      <div className="playlist-channel">
        <div className="playlist-channel__label">
          <T>Channel</T>
        </div>

        {activeChannel ? (
          <div className="playlist-channel__value">
            @{normalizeHandle(activeChannel.handle)}{' '}
            <span className="playlist-channel__muted">
              • {activeChannel.title || activeChannel.name}
            </span>
          </div>
        ) : (
          <div className="playlist-channel__value playlist-channel__value--bad">
            <T>Channel not found</T>
            {activeHandleFromPath ? (
              <span className="playlist-channel__muted"> (@{activeHandleFromPath})</span>
            ) : null}
          </div>
        )}
      </div>

      <form className="playlist-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Title</T>}
          placeholder={titlePlaceholder}
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 2, message: 'Min 2 chars' },
            maxLength: { value: 80, message: 'Max 80 chars' },
          })}
          error={errors.title?.message}
        />

        <Input
          as="textarea"
          rows={5}
          label={<T>Description</T>}
          placeholder={descPlaceholder}
          {...register('description', { maxLength: { value: 5000, message: 'Max 5000 chars' } })}
          error={errors.description?.message}
        />

        {/* visibility */}
        <div className="playlist-visibility">
          <div className="playlist-visibility__label">
            <T>Visibility</T>
          </div>

          <div className="playlist-visibility__row">
            {[
              { key: 'public', label: 'Public' },
              { key: 'unlisted', label: 'Unlisted' },
              { key: 'private', label: 'Private' },
            ].map((it) => (
              <label key={it.key} className="playlist-visibility__pill">
                <input type="radio" value={it.key} {...register('visibility')} />
                <span>
                  <T>{it.label}</T>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* hidden channelRef */}
        <input type="hidden" {...register('channelRef', { required: 'channelRef is required' })} />
        {errors.channelRef?.message ? (
          <div className="playlist-alert playlist-alert--error">{errors.channelRef.message}</div>
        ) : null}

        {/* COVER */}
        <label className="playlist-file">
          <input
            className="playlist-file__input"
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="playlist-file__btn">
            <T>Select cover</T>
          </span>
          <span className="playlist-file__name">
            {coverFile ? coverLabel : <T>No cover selected</T>}
          </span>
        </label>

        {/* PICKER */}
        <div className="playlist-picker">
          <div className="playlist-picker__head">
            <div className="playlist-picker__title">
              <T>Videos</T>
              <span className="playlist-picker__meta">
                <T caseMode="sentence">Selected:</T> {includedCount}
              </span>
            </div>

            <div className="playlist-picker__hint">
              <T caseMode="sentence">Tip:</T> <span>#</span> = order in playlist
            </div>
          </div>

          {loading ? (
            <div className="playlist-picker__empty">
              <T>Loading videos…</T>
            </div>
          ) : pickerItems?.length ? (
            <div className="playlist-picker__list">
              {pickerItems.map((v) => {
                const id = String(v?._id || v?.id || '')
                const sel = selected?.[id]
                const included = Boolean(sel?.included)
                const orderVal = sel?.order ?? ''
                const isPublished = Boolean(v?.isPublished)

                return (
                  <div key={id} className={clsx('picker-row', { 'picker-row--active': included })}>
                    <label className="picker-row__check">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => onToggleInclude(id)}
                      />
                    </label>

                    <div className="picker-row__order">
                      <input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        placeholder={String(nextOrder)}
                        value={included ? String(orderVal) : ''}
                        onChange={(e) => onChangeOrder(id, e.target.value)}
                        disabled={disabled}
                        className="picker-order"
                      />
                    </div>

                    <div className="picker-row__thumb">
                      {v?.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.thumbnailUrl} alt="thumb" />
                      ) : (
                        <div className="picker-row__thumb--empty" />
                      )}
                    </div>

                    <div className="picker-row__info">
                      <div className="picker-row__title">{v?.title || 'Untitled'}</div>

                      <div className="picker-row__meta">
                        <span
                          className={clsx('picker-badge', {
                            'picker-badge--ok': isPublished,
                            'picker-badge--muted': !isPublished,
                          })}
                        >
                          <T>{isPublished ? 'Published' : 'Draft'}</T>
                        </span>

                        <span className="picker-row__muted">
                          • {Number(v?.stats?.views || 0)} <T>views</T>
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="playlist-picker__empty">
              <T>No videos yet</T>
            </div>
          )}
        </div>

        {errors.root?.message ? (
          <div className="playlist-alert playlist-alert--error">{errors.root.message}</div>
        ) : null}

        {error ? <div className="playlist-alert playlist-alert--error">{error}</div> : null}
        {message ? <div className="playlist-alert playlist-alert--ok">{message}</div> : null}

        <Button
          type="submit"
          variant="primary"
          height="40px"
          maxWidth="300px"
          disabled={!canSubmit}
        >
          <T>Create playlist</T>
        </Button>
      </form>
    </div>
  )
}

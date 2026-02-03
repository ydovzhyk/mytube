'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm, useFieldArray } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'

import { createChannel, updateChannel } from '@/store/channel/channel-operations'
import { getChannels } from '@/store/channel/channel-selectors'
import { axiosCheckHandle } from '@/lib/api/channel'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

function normalizeHandle(raw = '') {
  return String(raw).trim().toLowerCase().replace(/^@+/, '')
}

function normalizeUrl(raw = '') {
  const u = String(raw || '').trim()
  if (!u) return ''
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  function decodeParam(v) {
    try {
      return decodeURIComponent(String(v ?? ''))
    } catch {
      return String(v ?? '')
    }
  }
export default function ChannelForm({ mode = 'create' }) {
  const dispatch = useDispatch()
  const params = useParams()
  const router = useRouter()

  const urlHandle = useMemo(() => {
    const raw = decodeParam(params?.handle)
    return normalizeHandle(raw)
  }, [params?.handle])

  const channels = useSelector(getChannels)

  const channel = useMemo(() => {
    if (mode !== 'edit') return null
    if (!urlHandle) return null
    return channels?.find((c) => normalizeHandle(c?.handle) === urlHandle) || null
  }, [channels, urlHandle, mode])

  const [banner, setBanner] = useState(null)

  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const [checkLoading, setCheckLoading] = useState(false)
  const [handleAvailable, setHandleAvailable] = useState(null)
  const [handleHint, setHandleHint] = useState('')

  const [submitError, setSubmitError] = useState('')
  const [submitOk, setSubmitOk] = useState('')

  const lastCheckAbort = useRef(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      handle: '',
      name: '',
      title: '',
      bio: '',
      description: '',
      avatarUrl: '',
      contactEmail: '',
      links: [{ title: '', url: '' }],
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'links',
  })

  const disabled = isSubmitting

  const bannerLabel = useMemo(() => {
    if (!banner) return ''
    const mb = (banner.size / 1024 / 1024).toFixed(1)
    return `${banner.name} • ${mb}MB`
  }, [banner])

  const avatarLabel = useMemo(() => {
    if (!avatarFile) return ''
    const mb = (avatarFile.size / 1024 / 1024).toFixed(1)
    return `${avatarFile.name} • ${mb}MB`
  }, [avatarFile])

  useEffect(() => {
    return () => {
      if (lastCheckAbort.current) lastCheckAbort.current.abort()
    }
  }, [])

  // ====== EDIT MODE: hydrate form from store channel ======
  useEffect(() => {
    if (mode !== 'edit') return
    if (!channel) return

    const links =
      Array.isArray(channel?.links) && channel.links.length
        ? channel.links.map((l) => ({
            title: String(l?.title || '').trim(),
            url: String(l?.url || '').trim(),
          }))
        : [{ title: '', url: '' }]

    reset({
      handle: normalizeHandle(channel?.handle || ''),
      name: String(channel?.name || '').trim(),
      title: String(channel?.title || '').trim(),
      bio: String(channel?.bio || ''),
      description: String(channel?.description || ''),
      avatarUrl: String(channel?.avatarUrl || ''),
      contactEmail: String(channel?.contactEmail || ''),
      links: [{ title: '', url: '' }],
    })

    replace(links)

    setAvatarPreview(String(channel?.avatarUrl || ''))
    setBanner(null)
    setAvatarFile(null)

    setHandleAvailable(null)
    setHandleHint('')
    setSubmitError('')
    setSubmitOk('')
  }, [mode, channel, reset, replace])

  const handleValue = watch('handle')
  useEffect(() => {
    if (mode !== 'create') return
    setHandleAvailable(null)
    setHandleHint('')
    setSubmitError('')
    setSubmitOk('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleValue, mode])

  // ----- avatar -> avatarUrl (dataURL) -----
  const onPickAvatar = async (file) => {
    setSubmitError('')
    setSubmitOk('')

    setAvatarFile(file || null)

    if (!file) {
      if (mode === 'create') {
        setAvatarPreview('')
        setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      }
      return
    }

    if (!file.type?.startsWith('image/')) {
      setAvatarFile(null)
      if (mode === 'create') {
        setAvatarPreview('')
        setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      }
      setSubmitError('Avatar must be an image')
      return
    }

    const MAX_AVATAR_MB = 1
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarFile(null)
      if (mode === 'create') {
        setAvatarPreview('')
        setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      }
      setSubmitError(`Avatar is too large (max ${MAX_AVATAR_MB}MB)`)
      return
    }

    try {
      const dataUrl = await readFileAsDataURL(file)
      const str = String(dataUrl || '')
      setAvatarPreview(str)
      setValue('avatarUrl', str, { shouldValidate: true, shouldDirty: true })
    } catch {
      setAvatarFile(null)
      if (mode === 'create') {
        setAvatarPreview('')
        setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      }
      setSubmitError('Could not read avatar file')
    }
  }

  // ----- handle availability check (ONLY create) -----
  const checkHandle = async () => {
    if (mode !== 'create') return

    const normalized = normalizeHandle(handleValue)
    setValue('handle', normalized, { shouldValidate: true, shouldDirty: true })

    setSubmitError('')
    setSubmitOk('')

    const okLocal = await trigger('handle')
    if (!okLocal) {
      setHandleAvailable(null)
      setHandleHint('')
      return
    }

    if (lastCheckAbort.current) lastCheckAbort.current.abort()
    const controller = new AbortController()
    lastCheckAbort.current = controller

    setCheckLoading(true)
    setHandleHint('')
    setHandleAvailable(null)

    try {
      const data = await axiosCheckHandle({ handle: normalized, signal: controller.signal })
      const available = Boolean(data?.available)

      setHandleAvailable(available)
      setHandleHint(available ? 'Available' : 'Already taken')

      if (!available) {
        setError('handle', { type: 'manual', message: 'Handle already taken' })
      } else {
        clearErrors('handle')
      }
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.name === 'AbortError') return
      setHandleAvailable(null)
      setHandleHint('Could not check now')
    } finally {
      setCheckLoading(false)
    }
  }

  const onSubmit = async (values) => {
    setSubmitError('')
    setSubmitOk('')

    if (mode === 'create' && !banner) {
      setSubmitError('Banner is required')
      return
    }

    if (mode === 'create' && handleAvailable === false) {
      setSubmitError('Handle already taken')
      return
    }

    const linksClean = (values.links || [])
      .map((l) => ({
        title: String(l?.title || '').trim(),
        url: normalizeUrl(l?.url || ''),
      }))
      .filter((l) => l.url)

    for (const l of linksClean) {
      try {
        // eslint-disable-next-line no-new
        new URL(l.url)
      } catch {
        setSubmitError(`Invalid link URL: ${l.url}`)
        return
      }
    }

    const fd = new FormData()

    // create: required, edit: optional
    if (banner) fd.append('banner', banner)

    fd.append('handle', normalizeHandle(values.handle))
    fd.append('name', values.name.trim())
    fd.append('title', values.title.trim())

    fd.append('bio', values.bio || '')
    fd.append('description', values.description || '')

    fd.append('avatarUrl', values.avatarUrl || '')
    fd.append('contactEmail', values.contactEmail || '')

    fd.append('links', JSON.stringify(linksClean))

    try {
      if (mode === 'edit') {
        const updated = await dispatch(updateChannel({ id: channel._id, formData: fd })).unwrap()
        console.log('updated channel:', updated)
        setSubmitOk('Channel updated')
        const nextHandle = normalizeHandle(updated?.handle || channel?.handle || urlHandle)
        router.push(`/channels/@${nextHandle}`)
        router.refresh()
        return
      }

      const created = await dispatch(createChannel(fd)).unwrap()
      setSubmitOk('Channel created')
      const nextHandle = normalizeHandle(created?.handle || values?.handle)
      router.push(`/channels/@${nextHandle}`)
      router.refresh()

      reset()
      replace([{ title: '', url: '' }])
      setBanner(null)
      setAvatarFile(null)
      setAvatarPreview('')
      setHandleAvailable(null)
      setHandleHint('')
    } catch (e) {
      const msg = e?.message || e?.data?.message || ''
      if (msg) setSubmitError(msg)
    }
  }

  // ====== early UI states for edit ======
  if (mode === 'edit' && !urlHandle) {
    return (
      <div className="channel-card">
        <div className="channel-empty">
          <T>Loading…</T>
        </div>
      </div>
    )
  }

  if (mode === 'edit' && urlHandle && !channel) {
    return (
      <div className="channel-card">
        <div className="channel-empty">
          <T>Channel not found</T>
        </div>
      </div>
    )
  }

  const handleErr = errors.handle?.message

  return (
    <div className="channel-card">
      <h1 className="channel-card__title">
        <T>{mode === 'edit' ? 'Edit channel' : 'Create channel'}</T>
      </h1>

      <p className="channel-card__subtitle">
        <T caseMode="sentence">
          {mode === 'edit'
            ? 'Update channel details, links and visuals.'
            : 'Pick a channel name, title and unique handle. Add links and upload a banner.'}
        </T>
      </p>

      <form className="channel-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Channel name</T>}
          placeholder="E.g. ITStudio"
          {...register('name', {
            required: 'Channel name is required',
            minLength: { value: 2, message: 'Min 2 chars' },
            maxLength: { value: 30, message: 'Max 30 chars' },
          })}
          error={errors.name?.message}
        />

        <Input
          label={<T>Channel title</T>}
          placeholder="E.g. Next.js & React projects"
          {...register('title', {
            required: 'Channel title is required',
            minLength: { value: 2, message: 'Min 2 chars' },
            maxLength: { value: 60, message: 'Max 60 chars' },
          })}
          error={errors.title?.message}
        />

        <Input
          label={<T>Handle</T>}
          placeholder="E.g. itstudio"
          disabled={mode === 'edit'}
          {...register('handle', {
            required: 'Handle is required',
            minLength: { value: 3, message: 'Min 3 chars' },
            maxLength: { value: 40, message: 'Max 40 chars' },
            pattern: { value: /^[a-z0-9_]+$/, message: 'Only a-z, 0-9 and _' },
            setValueAs: (v) => normalizeHandle(v),
          })}
          error={errors.handle?.message}
          onBlur={mode === 'create' ? checkHandle : undefined}
        />

        {/* hint тільки в create */}
        {mode === 'create' ? (
          <div className="channel-handle-hint" aria-live="polite">
            {!handleErr && checkLoading ? (
              <span>
                <T>Checking...</T>
              </span>
            ) : null}

            {!handleErr && !checkLoading && handleHint ? (
              <span
                className={
                  handleAvailable === true
                    ? 'channel-handle-hint__ok'
                    : handleAvailable === false
                      ? 'channel-handle-hint__bad'
                      : ''
                }
              >
                <T>{handleHint}</T>
              </span>
            ) : null}
          </div>
        ) : null}

        <Input
          as="textarea"
          rows={4}
          label={<T>Bio</T>}
          placeholder="Optional"
          {...register('bio', { maxLength: { value: 2000, message: 'Max 2000 chars' } })}
          error={errors.bio?.message}
        />

        <Input
          as="textarea"
          rows={8}
          label={<T>Description</T>}
          placeholder="Optional"
          {...register('description', { maxLength: { value: 2000, message: 'Max 2000 chars' } })}
          error={errors.description?.message}
        />

        {/* LINKS */}
        <div className="channel-links">
          <div className="channel-links__head">
            <div className="channel-links__title">
              <T>Links</T>
              <span className="channel-links__subtitle">
                <T caseMode="sentence">Optional (up to 10)</T>
              </span>
            </div>

            <button
              type="button"
              className="channel-links__add"
              onClick={() => {
                if (fields.length >= 10) return
                append({ title: '', url: '' })
              }}
              disabled={disabled || fields.length >= 10}
            >
              <T>Add link</T>
            </button>
          </div>

          <div className="channel-links__list">
            {fields.map((f, idx) => (
              <div className="channel-links__row" key={f.id}>
                <div className="channel-links__col">
                  <Input
                    label={<T>Title</T>}
                    placeholder="E.g. Telegram"
                    {...register(`links.${idx}.title`, {
                      maxLength: { value: 40, message: 'Max 40 chars' },
                    })}
                    error={errors?.links?.[idx]?.title?.message}
                  />
                </div>

                <div className="channel-links__col channel-links__col--url">
                  <Input
                    label={<T>URL</T>}
                    placeholder="E.g. t.me/your_channel"
                    {...register(`links.${idx}.url`, {
                      maxLength: { value: 500, message: 'Max 500 chars' },
                    })}
                    error={errors?.links?.[idx]?.url?.message}
                  />
                </div>

                <button
                  type="button"
                  className="channel-links__remove"
                  onClick={() => remove(idx)}
                  disabled={disabled || fields.length <= 1}
                  aria-label="Remove link"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AVATAR FILE */}
        <label className="channel-file">
          <input
            className="channel-file__input"
            type="file"
            accept="image/*"
            onChange={(e) => onPickAvatar(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="channel-file__btn">
            <T>Select avatar</T>
          </span>
          <span className="channel-file__name">
            {avatarFile ? avatarLabel : <T>No avatar selected</T>}
          </span>
        </label>

        {avatarPreview ? (
          <div className="channel-avatar-preview">
            <img src={avatarPreview} alt="avatar preview" />
          </div>
        ) : null}

        <Input
          label={<T>Contact Email</T>}
          placeholder="Optional"
          {...register('contactEmail', {
            maxLength: { value: 120, message: 'Max 120 chars' },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email',
            },
          })}
          error={errors.contactEmail?.message}
        />

        {/* BANNER */}
        <label className="channel-file">
          <input
            className="channel-file__input"
            type="file"
            accept="image/*"
            onChange={(e) => setBanner(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="channel-file__btn">
            <T>{mode === 'edit' ? 'Select new banner' : 'Select banner'}</T>
          </span>
          <span className="channel-file__name">
            {banner ? (
              bannerLabel
            ) : mode === 'edit' ? (
              <T>No new banner selected</T>
            ) : (
              <T>No banner selected</T>
            )}
          </span>
        </label>

        {submitError ? (
          <div className="channel-alert channel-alert--error">{submitError}</div>
        ) : null}
        {submitOk ? <div className="channel-alert channel-alert--ok">{submitOk}</div> : null}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          height="40px"
          maxWidth="300px"
          disabled={disabled || (mode === 'create' && !banner)}
        >
          <T>{mode === 'edit' ? 'Save changes' : 'Create'}</T>
        </Button>
      </form>
    </div>
  )
}


'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'

import { createChannel } from '../../../store/channel/channel-operations'
import { axiosCheckHandle } from '@/lib/api/channel'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

function normalizeHandle(raw = '') {
  return String(raw).trim().toLowerCase().replace(/^@+/, '')
}

const readFileAsDataURL = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

export default function CreateChannelForm() {
  const dispatch = useDispatch()

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
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '', // Channel name
      handle: '', // @handle
      bio: '', // description
      avatarUrl: '',
      contactEmail: '',
    },
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

  // ----- handle blur check -----
  const handleValue = watch('handle')

  const checkHandle = async () => {
    const handle = normalizeHandle(handleValue)
    setValue('handle', handle, { shouldValidate: true, shouldDirty: true })

    setSubmitError('')
    setSubmitOk('')

    if (!handle || handle.length < 3) {
      setHandleAvailable(false)
      setHandleHint('Min 3 chars')
      return
    }
    if (!/^[a-z0-9_]+$/.test(handle)) {
      setHandleAvailable(false)
      setHandleHint('Only a-z, 0-9 and _')
      return
    }

    if (lastCheckAbort.current) lastCheckAbort.current.abort()
    const controller = new AbortController()
    lastCheckAbort.current = controller

    setCheckLoading(true)
    setHandleHint('')

    try {
      const data = await axiosCheckHandle({ handle, signal: controller.signal })
      const ok = Boolean(data?.available)

      setHandleAvailable(ok)
      setHandleHint(ok ? 'Available' : 'Already taken')

      if (!ok) setError('handle', { type: 'manual', message: 'Handle already taken' })
      else clearErrors('handle')
    } catch (e) {
      if (e?.name === 'CanceledError' || e?.name === 'AbortError') return
      setHandleAvailable(null)
      setHandleHint('Could not check now')
    } finally {
      setCheckLoading(false)
    }
  }

  useEffect(() => {
    setHandleAvailable(null)
    setHandleHint('')
    setSubmitError('')
    setSubmitOk('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleValue])

  // ----- avatar file -> dataURL into avatarUrl -----
  const onPickAvatar = async (file) => {
    setSubmitError('')
    setSubmitOk('')

    setAvatarFile(file || null)

    if (!file) {
      setAvatarPreview('')
      setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      return
    }

    if (!file.type?.startsWith('image/')) {
      setAvatarFile(null)
      setAvatarPreview('')
      setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      setSubmitError('Avatar must be an image')
      return
    }

    const MAX_AVATAR_MB = 1
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      setAvatarFile(null)
      setAvatarPreview('')
      setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      setSubmitError(`Avatar is too large (max ${MAX_AVATAR_MB}MB)`)
      return
    }

    try {
      const dataUrl = await readFileAsDataURL(file)
      setAvatarPreview(String(dataUrl || ''))
      setValue('avatarUrl', String(dataUrl || ''), { shouldValidate: true, shouldDirty: true })
    } catch {
      setAvatarFile(null)
      setAvatarPreview('')
      setValue('avatarUrl', '', { shouldValidate: true, shouldDirty: true })
      setSubmitError('Could not read avatar file')
    }
  }

  // ----- submit -----
  const onSubmit = async (values) => {
    setSubmitError('')
    setSubmitOk('')

    if (!banner) {
      setSubmitError('Banner is required')
      return
    }

    if (handleAvailable === false) {
      setSubmitError('Handle already taken')
      return
    }

    const fd = new FormData()
    fd.append('banner', banner)
    fd.append('title', values.title)
    fd.append('handle', normalizeHandle(values.handle))
    fd.append('bio', values.bio || '')
    fd.append('avatarUrl', values.avatarUrl || '')
    fd.append('contactEmail', values.contactEmail || '')

    try {
      await dispatch(createChannel(fd)).unwrap()

      setSubmitOk('Channel created')
      reset()
      setBanner(null)
      setAvatarFile(null)
      setAvatarPreview('')
      setHandleAvailable(null)
      setHandleHint('')
    } catch (e) {
      // no op
    }
  }

  return (
    <div className="channel-card">
      <h1 className="channel-card__title">
        <T>Create channel</T>
      </h1>

      <p className="channel-card__subtitle">
        <T caseMode="sentence">
          Pick a channel name and unique handle. Upload a banner right away.
        </T>
      </p>

      <form className="channel-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Channel name</T>}
          placeholder="E.g. Tech Insider"
          {...register('title', {
            required: 'Channel name is required',
            minLength: { value: 2, message: 'Min 2 chars' },
            maxLength: { value: 60, message: 'Max 60 chars' },
          })}
          error={errors.title?.message}
        />

        <Input
          label={<T>Handle</T>}
          placeholder="E.g. @tech_insider"
          {...register('handle', {
            required: 'Handle is required',
            minLength: { value: 3, message: 'Min 3 chars' },
            maxLength: { value: 40, message: 'Max 40 chars' },
            pattern: { value: /^[a-z0-9_]+$/, message: 'Only a-z, 0-9 and _' },
          })}
          error={errors.handle?.message}
          onBlur={checkHandle}
        />

        <div className="channel-handle-hint" aria-live="polite">
          {checkLoading ? (
            <span>
              <T>Checking...</T>
            </span>
          ) : null}

          {!checkLoading && handleHint ? (
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

        <Input
          label={<T>Bio</T>}
          placeholder="Optional"
          {...register('bio', { maxLength: { value: 2000, message: 'Max 2000 chars' } })}
          error={errors.bio?.message}
        />

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
            <T>Select banner</T>
          </span>
          <span className="channel-file__name">
            {banner ? bannerLabel : <T>No banner selected</T>}
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
          disabled={disabled || !banner}
        >
          <T>Create</T>
        </Button>
      </form>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { usePathname, useRouter } from 'next/navigation'
import clsx from 'clsx'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { uploadVideo } from '@/store/videos/videos-operations'
import {
  getVideosUploadLoading,
  getVideosUploadProgress,
  getVideosError,
  getVideosMessage,
} from '@/store/videos/videos-selectors'

import { getChannels } from '@/store/channel/channel-selectors'

const normalizeHandle = (raw = '') => String(raw).trim().toLowerCase().replace(/^@+/, '')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function VideoUploadForm() {
  const dispatch = useDispatch()
  const pathname = usePathname()
  const router = useRouter()

  const uploadLoading = useSelector(getVideosUploadLoading)
  const progress = useSelector(getVideosUploadProgress)
  const error = useSelector(getVideosError)
  const message = useSelector(getVideosMessage)

  const channels = useSelector(getChannels)

  const [file, setFile] = useState(null)
  const [thumb, setThumb] = useState(null)

  // handle from /channels/@handle/upload
  const activeHandleFromPath = useMemo(() => {
    const parts = String(pathname || '').split('/')
    const maybe = parts[2]
    if (!maybe?.startsWith('@')) return null
    return normalizeHandle(maybe.slice(1))
  }, [pathname])

  const activeChannel = useMemo(() => {
    if (!activeHandleFromPath) return null
    return channels.find((c) => normalizeHandle(c?.handle) === activeHandleFromPath) || null
  }, [channels, activeHandleFromPath])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: {
      title: '',
      description: '',
      channelRef: '',
      isPublished: true,
    },
  })

  // set channelRef automatically
  useEffect(() => {
    if (!activeHandleFromPath) {
      setValue('channelRef', '', { shouldValidate: true })
      setError('channelRef', { type: 'manual', message: 'Channel handle is missing in URL' })
      return
    }

    if (!activeChannel?._id) {
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

  const disabled = uploadLoading || isSubmitting
  const canUpload = Boolean(file && thumb && activeChannel?._id)

  const pct = useMemo(() => {
    const n = Number(progress) || 0
    return Math.max(0, Math.min(100, n))
  }, [progress])

  const phase = useMemo(() => {
    if (errors.channelRef?.message) return 'error'
    if (error) return 'error'
    if (message) return 'done'
    if (uploadLoading) return pct >= 100 ? 'processing' : 'uploading'
    return 'idle'
  }, [errors.channelRef?.message, error, message, uploadLoading, pct])

  const statusText = useMemo(() => {
    if (phase === 'uploading') return { title: 'Uploading…', meta: `${pct}%` }
    if (phase === 'processing')
      return { title: 'Video sent. Processing on server…', meta: 'transcoding 360p/480p/720p' }
    if (phase === 'done') return { title: 'Upload complete', meta: '✅' }
    if (phase === 'error') return { title: 'Upload failed', meta: '⚠️' }
    return null
  }, [phase, pct])

  const fileLabel = useMemo(() => {
    if (!file) return ''
    const mb = (file.size / 1024 / 1024).toFixed(1)
    return `${file.name} • ${mb}MB`
  }, [file])

  const thumbLabel = useMemo(() => {
    if (!thumb) return ''
    const mb = (thumb.size / 1024 / 1024).toFixed(1)
    return `${thumb.name} • ${mb}MB`
  }, [thumb])

  const onSubmit = async (data) => {
    if (!file || !thumb) return
    if (!activeChannel?._id) return

    const fd = new FormData()
    fd.append('video', file)
    fd.append('thumbnail', thumb)

    fd.append('title', data.title)
    fd.append('description', data.description || '')
    fd.append('channelRef', String(activeChannel._id))
    fd.append('isPublished', String(Boolean(data.isPublished)))

    try {
      await dispatch(uploadVideo(fd)).unwrap()
      await sleep(2000)

      reset()
      setFile(null)
      setThumb(null)

      router.push(`/channels/@${normalizeHandle(activeChannel.handle)}`)
    } catch {
      // no-op
    }
  }

  return (
    <div className="upload-card">
      <h1 className="upload-card__title">
        <T>Upload video</T>
      </h1>

      <p className="upload-card__subtitle">
        <T caseMode="sentence">
          Select a video and a thumbnail, and we will generate 360p/480p/720p versions
        </T>
      </p>

      {/* CHANNEL INFO */}
      <div className="upload-channel">
        <div className="upload-channel__label">
          <T>Channel</T>
        </div>

        {activeChannel ? (
          <div className="upload-channel__value">
            @{normalizeHandle(activeChannel.handle)}{' '}
            <span className="upload-channel__muted">
              • {activeChannel.title || activeChannel.name}
            </span>
          </div>
        ) : (
          <div className="upload-channel__value upload-channel__value--bad">
            <T>Channel not found</T>
            {activeHandleFromPath ? (
              <span className="upload-channel__muted"> (@{activeHandleFromPath})</span>
            ) : null}
          </div>
        )}
      </div>

      <form className="upload-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Title</T>}
          placeholder="E.g. My first MyTube video"
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 2, message: 'Min 2 chars' },
          })}
          error={errors.title?.message}
        />

        <Input
          as="textarea"
          rows={6}
          label={<T>Description</T>}
          placeholder="Optional"
          {...register('description', {
            maxLength: { value: 5000, message: 'Max 5000 chars' },
          })}
          error={errors.description?.message}
        />

        {/* HIDDEN FIELD */}
        <input type="hidden" {...register('channelRef', { required: 'channelRef is required' })} />

        {/* VIDEO */}
        <label className="upload-file">
          <input
            className="upload-file__input"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="upload-file__btn">
            <T>Select video</T>
          </span>
          <span className="upload-file__name">{file ? fileLabel : <T>No video selected</T>}</span>
        </label>

        {/* THUMBNAIL */}
        <label className="upload-file">
          <input
            className="upload-file__input"
            type="file"
            accept="image/*"
            onChange={(e) => setThumb(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="upload-file__btn">
            <T>Select thumbnail</T>
          </span>
          <span className="upload-file__name">
            {thumb ? thumbLabel : <T>No thumbnail selected</T>}
          </span>
        </label>

        <label className="upload-publish">
          <input type="checkbox" {...register('isPublished')} defaultChecked />
          <span>
            <T>Publish immediately</T>
          </span>
        </label>

        {/* PROGRESS BLOCK */}
        {phase !== 'idle' ? (
          <div className="upload-flow" aria-live="polite">
            <div className="upload-flow__top">
              <div className="upload-flow__title">
                <T caseMode="sentence">{statusText?.title || ''}</T>
              </div>
              <div className="upload-flow__meta">{statusText?.meta || ''}</div>
            </div>

            <div className="upload-flow__bar">
              <div
                className={clsx('upload-flow__fill', {
                  'upload-flow__fill--indeterminate': phase === 'processing',
                  'upload-flow__fill--done': phase === 'done',
                  'upload-flow__fill--error': phase === 'error',
                })}
                style={phase === 'uploading' ? { width: `${pct}%` } : undefined}
              />
            </div>

            <div className="upload-flow__steps">
              <div
                className={clsx('upload-step', {
                  'upload-step--done': phase !== 'uploading',
                  'upload-step--active': phase === 'uploading',
                })}
              >
                <T>Upload</T>
              </div>
              <div
                className={clsx('upload-step', {
                  'upload-step--active': phase === 'processing',
                  'upload-step--done': phase === 'done',
                })}
              >
                <T>Processing</T>
              </div>
              <div className={clsx('upload-step', { 'upload-step--done': phase === 'done' })}>
                <T>Done</T>
              </div>
            </div>
          </div>
        ) : null}

        {errors.channelRef?.message ? (
          <div className="upload-alert upload-alert--error">{errors.channelRef.message}</div>
        ) : null}

        {error ? <div className="upload-alert upload-alert--error">{error}</div> : null}
        {message ? <div className="upload-alert upload-alert--ok">{message}</div> : null}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          height="40px"
          disabled={disabled || !canUpload}
        >
          <T>Upload</T>
        </Button>
      </form>
    </div>
  )
}


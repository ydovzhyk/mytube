'use client'

import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

import Input from '@/common/shared/input/Input'
import Button from '@/common/shared/button/Button'
import T from '@/common/shared/i18n/T'

import { getManageVideo, updateVideo } from '@/store/videos/videos-operations'
import {
  getManageVideo as selectManageVideo,
  getVideosUploadLoading,
  getVideosUploadProgress,
  getVideosError,
  getVideosMessage,
  getVideosLoading,
} from '@/store/videos/videos-selectors'

const normalizeHandle = (raw = '') =>
  String(raw).trim().toLowerCase().replace(/^@+/, '')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export default function VideoEditForm() {
  const dispatch = useDispatch()
  const router = useRouter()
  const params = useParams()

  const handle = normalizeHandle(
    decodeURIComponent(String(params?.handle || '')).replace(/^@+/, '')
  )
  const videoId = String(params?.videoId || '').trim()

  const video = useSelector(selectManageVideo)
  const loading = useSelector(getVideosLoading)
  const uploadLoading = useSelector(getVideosUploadLoading)
  const progress = useSelector(getVideosUploadProgress)
  const error = useSelector(getVideosError)
  const message = useSelector(getVideosMessage)

  const [file, setFile] = useState(null)
  const [thumb, setThumb] = useState(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onSubmit',
    defaultValues: {
      title: '',
      description: '',
      isPublished: true,
    },
  })

  useEffect(() => {
    if (!videoId) return
    dispatch(getManageVideo(videoId))
  }, [dispatch, videoId])

  useEffect(() => {
    if (!video || String(video._id) !== videoId) return
    reset({
      title: video.title || '',
      description: video.description || '',
      isPublished: Boolean(video.isPublished),
    })
  }, [video, videoId, reset])

  const disabled = uploadLoading || isSubmitting || loading
  const pct = Math.max(0, Math.min(100, Number(progress) || 0))
  const replacingMedia = Boolean(file)

  const phase = useMemo(() => {
    if (error) return 'error'
    if (message && !uploadLoading) return 'done'
    if (uploadLoading) return pct >= 100 && replacingMedia ? 'processing' : 'uploading'
    return 'idle'
  }, [error, message, uploadLoading, pct, replacingMedia])

  const statusText = useMemo(() => {
    if (phase === 'uploading') {
      return {
        title: replacingMedia ? 'Uploading new video…' : 'Saving…',
        meta: replacingMedia ? `${pct}%` : '',
      }
    }
    if (phase === 'processing') {
      return {
        title: 'Replacing video. Processing on server…',
        meta: 'transcoding 360p/480p/720p',
      }
    }
    if (phase === 'done') return { title: 'Saved', meta: '✅' }
    if (phase === 'error') return { title: 'Save failed', meta: '⚠️' }
    return null
  }, [phase, pct, replacingMedia])

  const onSubmit = async (data) => {
    if (!videoId) return

    const fd = new FormData()
    fd.append('title', data.title)
    fd.append('description', data.description || '')
    fd.append('isPublished', String(Boolean(data.isPublished)))
    if (file) fd.append('video', file)
    if (thumb) fd.append('thumbnail', thumb)

    if (!isDirty && !file && !thumb) return

    try {
      await dispatch(updateVideo({ videoId, formData: fd })).unwrap()
      await sleep(1200)
      setFile(null)
      setThumb(null)
      router.push(`/channels/@${handle}/videos`)
    } catch {
      // toast via listener
    }
  }

  if (!videoId) {
    return (
      <div className="upload-card">
        <p>
          <T>Video id is missing</T>
        </p>
      </div>
    )
  }

  if (!loading && !video) {
    return (
      <div className="upload-card">
        <p>
          <T>Video not found</T>
        </p>
        <Link href={`/channels/@${handle}/videos`}>
          <T caseMode="sentence">back to manage videos</T>
        </Link>
      </div>
    )
  }

  return (
    <div className="upload-card">
      <div className="upload-card__nav">
        <Link href={`/channels/@${handle}/videos`} className="upload-card__back">
          ← <T caseMode="sentence">manage videos</T>
        </Link>
      </div>

      <h1 className="upload-card__title">
        <T caseMode="sentence">Edit video</T>
      </h1>
      <p className="upload-card__subtitle">
        <T caseMode="sentence">
          Update title, description, cover or replace the video file
        </T>
      </p>

      {video?.thumbnailUrl ? (
        <div className="edit-video-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt={video.title || 'thumbnail'} />
          <div className="edit-video-preview__meta">
            <span className={`edit-video-preview__status edit-video-preview__status--${video.status}`}>
              <T>{video.status || 'ready'}</T>
            </span>
            {video.errorMessage ? (
              <span className="edit-video-preview__error">{video.errorMessage}</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <form className="upload-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Title</T>}
          {...register('title', {
            required: 'Title is required',
            minLength: { value: 2, message: 'Min 2 chars' },
            maxLength: { value: 140, message: 'Max 140 chars' },
          })}
          error={errors.title?.message}
        />

        <Input
          as="textarea"
          rows={6}
          label={<T>Description</T>}
          {...register('description', {
            maxLength: { value: 5000, message: 'Max 5000 chars' },
          })}
          error={errors.description?.message}
        />

        <label className="upload-file">
          <input
            className="upload-file__input"
            type="file"
            accept="image/*"
            onChange={(e) => setThumb(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="upload-file__btn">
            <T>New thumbnail</T>
          </span>
          <span className="upload-file__name">
            {thumb ? thumb.name : <T>Keep current thumbnail</T>}
          </span>
        </label>

        <label className="upload-file">
          <input
            className="upload-file__input"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="upload-file__btn">
            <T>Replace video</T>
          </span>
          <span className="upload-file__name">
            {file ? file.name : <T>Keep current video file</T>}
          </span>
        </label>

        <label className="upload-publish">
          <input type="checkbox" {...register('isPublished')} />
          <span>
            <T>Published</T>
          </span>
        </label>

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
                style={phase === 'uploading' && replacingMedia ? { width: `${pct}%` } : undefined}
              />
            </div>
          </div>
        ) : null}

        {error ? <div className="upload-alert upload-alert--error">{error}</div> : null}
        {message ? <div className="upload-alert upload-alert--ok">{message}</div> : null}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          height="40px"
          maxWidth="300px"
          disabled={disabled || (!isDirty && !file && !thumb)}
        >
          <T>Save</T>
        </Button>
      </form>
    </div>
  )
}

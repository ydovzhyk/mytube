'use client'

import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'

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

export default function VideoUploadForm() {
  const dispatch = useDispatch()

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

  const disabled = uploadLoading || isSubmitting

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
    if (!file) return
    if (!thumb) return

    const fd = new FormData()
    fd.append('video', file)          // multer field: video
    fd.append('thumbnail', thumb)     // multer field: thumbnail

    fd.append('title', data.title)
    fd.append('description', data.description || '')
    fd.append('channelRef', data.channelRef)
    fd.append('isPublished', String(Boolean(data.isPublished)))

    try {
      await dispatch(uploadVideo(fd)).unwrap()
      reset()
      setFile(null)
      setThumb(null)
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

      <form className="upload-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={<T>Title</T>}
          placeholder="E.g. My first MyTube video"
          {...register('title', { required: 'Title is required', minLength: { value: 2, message: 'Min 2 chars' } })}
          error={errors.title?.message}
        />

        <Input
          label={<T>Description</T>}
          placeholder="Optional"
          {...register('description')}
          error={errors.description?.message}
        />

        <Input
          label={<T>Channel ID</T>}
          placeholder="Paste your channelRef for now"
          {...register('channelRef', { required: 'channelRef is required' })}
          error={errors.channelRef?.message}
        />

        {/* VIDEO */}
        <label className="upload-file">
          <input
            className="upload-file__input"
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            disabled={disabled}
          />
          <span className="upload-file__btn"><T>Select video</T></span>
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
          <span className="upload-file__btn"><T>Select thumbnail</T></span>
          <span className="upload-file__name">{thumb ? thumbLabel : <T>No thumbnail selected</T>}</span>
        </label>

        <label className="upload-publish">
          <input type="checkbox" {...register('isPublished')} defaultChecked />
          <span><T>Publish immediately</T></span>
        </label>

        {uploadLoading ? (
          <div className="upload-progress" aria-live="polite">
            <div className="upload-progress__bar" style={{ width: `${progress || 0}%` }} />
            <span className="upload-progress__text">{progress || 0}%</span>
          </div>
        ) : null}

        {error ? <div className="upload-alert upload-alert--error">{error}</div> : null}
        {message ? <div className="upload-alert upload-alert--ok">{message}</div> : null}

        <Button type="submit" variant="primary" fullWidth height="40px" disabled={disabled || !file || !thumb}>
          <T>Upload</T>
        </Button>
      </form>
    </div>
  )
}


import { instance } from './auth'

// helper: build params safely
const cleanParams = (params) => {
  if (!params || typeof params !== 'object') return undefined
  const out = {}
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    out[k] = v
  })
  return Object.keys(out).length ? out : undefined
}

const UPLOAD_TRANSFER_TIMEOUT_MS = 30 * 60 * 1000 // large files over slow links
const UPLOAD_PROCESS_MAX_WAIT_MS = 20 * 60 * 1000
const DEFAULT_POLL_AFTER_MS = 3000

export const axiosUploadVideo = async (formData, { onUploadProgress } = {}) => {
  const { data } = await instance.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: UPLOAD_TRANSFER_TIMEOUT_MS,
  })
  return data
}

export const axiosGetVideoUploadStatus = async (videoId) => {
  const id = String(videoId || '').trim()
  if (!id) throw new Error('Video id is required')
  const { data } = await instance.get(`/videos/${id}/status`, {
    timeout: 30_000,
  })
  return data
}

export const pollVideoUploadUntilDone = async (
  videoId,
  { pollAfterMs = DEFAULT_POLL_AFTER_MS, signal } = {},
) => {
  const started = Date.now()
  let delay = Math.max(1000, Number(pollAfterMs) || DEFAULT_POLL_AFTER_MS)

  while (Date.now() - started < UPLOAD_PROCESS_MAX_WAIT_MS) {
    if (signal?.aborted) {
      const err = new Error('Upload polling aborted')
      err.code = 'UPLOAD_POLL_ABORTED'
      throw err
    }

    await new Promise((resolve) => setTimeout(resolve, delay))

    const status = await axiosGetVideoUploadStatus(videoId)
    if (status?.status === 'ready') {
      return {
        message: 'Video uploaded',
        videoId: status.videoId,
        video: status.video,
      }
    }
    if (status?.status === 'failed') {
      const err = new Error(status.errorMessage || 'Video processing failed')
      err.code = 'UPLOAD_PROCESSING_FAILED'
      err.response = { status: 500, data: { message: err.message } }
      throw err
    }

    delay = Math.max(1000, Number(status?.pollAfterMs) || delay)
  }

  const err = new Error('Video processing timed out')
  err.code = 'UPLOAD_PROCESSING_TIMEOUT'
  err.response = { status: 504, data: { message: err.message } }
  throw err
}

export const axiosGetVideos = async (params) => {
  const { data } = await instance.get('/videos', {
    params: cleanParams(params),
  })
  return data
}

export const axiosGetMyChannelVideos = async (params) => {
  const isOwner = params?.publishedOnly === false
  const url = isOwner ? '/videos/channel/owner' : '/videos/channel'
  const { data } = await instance.get(url, {
    params: cleanParams(params),
  })
  return data
}

export const axiosGetSubscriptionVideos = async (params) => {
  const { data } = await instance.get('/videos/subscriptions', {
    params: cleanParams(params),
  })
  return data
}

export const axiosGetVideosPicker = async (params) => {
  const { data } = await instance.get('/videos/picker', {
    params: cleanParams(params),
  })
  return data
}

export const axiosDeleteVideo = async (params) => {
  const id = params?.videoId ?? params?.id
  if (!id) {
    throw new Error('Video id is required')
  }
  const { data } = await instance.delete(`/videos/${id}`)
  return data
}

export const axiosGetManageVideo = async (videoId) => {
  const id = String(videoId || '').trim()
  if (!id) throw new Error('Video id is required')
  const { data } = await instance.get(`/videos/${id}/manage`)
  return data
}

export const axiosUpdateVideo = async (videoId, formData, { onUploadProgress } = {}) => {
  const id = String(videoId || '').trim()
  if (!id) throw new Error('Video id is required')
  const { data, status } = await instance.patch(`/videos/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
    timeout: UPLOAD_TRANSFER_TIMEOUT_MS,
  })
  return { ...data, __httpStatus: status }
}

export const axiosVideoView = async (videoId) => {
  const id = String(videoId || '').trim()
  if (!id) throw new Error('Video id is required')
  const { data } = await instance.post(`/videos/view-count/${id}`, null)
  return data
}

export const axiosGetWatchVideo = async ({ id, list } = {}) => {
  console.log('Getting watch video with id:', id, 'and list:', list)
  const videoId = String(id || '').trim()
  if (!videoId) throw new Error('Video id is required')
  const { data } = await instance.get(`/videos/${videoId}`, {
    params: cleanParams({ list }),
  })
  return data
}

export const axiosGetSimilarVideos = async ({ id, cursor, filter, visitorId } = {}) => {
  const videoId = String(id || '').trim()
  const { data } = await instance.get(`/videos/${videoId}/similar`, {
    params: cleanParams({ cursor, filter, visitorId }),
  })
  return data
}

export const axiosReactVideo = async ({ id, value, visitorId } = {}) => {
  const videoId = String(id || '').trim()
  if (!videoId) throw new Error('Video id is required for react')
  const { data } = await instance.post(`/videos/${videoId}/react`, { value, visitorId })
  return data
}

export const axiosSearchVideos = async (params) => {
  console.log('Searching videos with params:', params)
  const { data } = await instance.get('/videos/search', {
    params: cleanParams(params),
  })
  return data
}
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

export const axiosUploadVideo = async (formData, { onUploadProgress } = {}) => {
  const { data } = await instance.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  })
  return data
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

export const axiosVideoView = async (videoId) => {
  const id = String(videoId || '').trim()
  if (!id) throw new Error('Video id is required')
  const { data } = await instance.post(`/videos/view-count/${id}`, null)
  return data
}

export const axiosGetWatchVideo = async ({ id, list } = {}) => {
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
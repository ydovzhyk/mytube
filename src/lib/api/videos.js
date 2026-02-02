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
  console.log('axiosGetVideos data:', data)
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
  // params: { channelId }
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



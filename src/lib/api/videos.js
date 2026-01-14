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
  const { data } = await instance.get('/videos/my', {
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

export const axiosDeleteVideo = async (params) => {
  const id = params?.videoId ?? params?.id
  if (!id) {
    // Let thunk catch it as a normal error if you want, but it's better to throw
    throw new Error('Video id is required')
  }

  const { data } = await instance.delete(`/videos/${id}`)
  return data
}

import { instance } from './auth'

// CREATE: POST /channels/create  (banner required)
export const axiosCreateChannel = async (formData) => {
  const { data } = await instance.post('/channels/create', formData)
  return data // { channel }
}

// GET MY CHANNELS: GET /channels
export const axiosGetMyChannels = async () => {
  const { data } = await instance.get('/channels')
  return data // { channels }
}

// GET PUBLIC BY HANDLE: GET /channels/by-handle/:handle
export const axiosGetPublicChannelByHandle = async (handle) => {
  const safe = String(handle || '').replace(/^@+/, '')
  const { data } = await instance.get(`/channels/by-handle/${safe}`)
  return data // { channel }
}

// GET PUBLIC BY ID: GET /channels/:id
export const axiosGetChannelById = async (id) => {
  const { data } = await instance.get(`/channels/${id}`)
  return data // { channel }
}

// UPDATE: PATCH /channels/:id  (banner optional, can be only banner)
export const axiosUpdateChannel = async ({ id, formData }) => {
  const { data } = await instance.patch(`/channels/${id}`, formData)
  return data // { channel }
}

// DELETE: DELETE /channels/:id
export const axiosDeleteChannel = async (id) => {
  const { data } = await instance.delete(`/channels/${id}`)
  return data // { message }
}

export const axiosCheckHandle = async ({ handle, signal }) => {
  const safe = String(handle || '')
    .replace(/^@+/, '')
    .trim()
    .toLowerCase()
  const { data } = await instance.get(`/channels/check-handle?handle=${encodeURIComponent(safe)}`, {
    signal,
  })
  return data // { handle, available }
}


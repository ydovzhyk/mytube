import { instance } from './auth'

export const axiosCreatePlaylist = async (formData) => {
  const { data } = await instance.post('/playlists/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export const axiosSearchPlaylists = async (params) => {
  console.log('Searching playlists with params:', params)
  const { data } = await instance.get('/playlists/search', { params })
  return data
}
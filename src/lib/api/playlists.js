import { instance } from './auth'

export const axiosCreatePlaylist = async (formData) => {
  const { data } = await instance.post('/playlists/create', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

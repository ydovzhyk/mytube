import { instance } from './auth'

export const axiosCreateMyPlaylist = async (userData) => {
  const { data } = await instance.post('/my-playlists/create', userData)
  return data
}

export const axiosAddToMyPlaylists = async (payload) => {
  const { data } = await instance.post('/my-playlists/add', payload)
  return data
}

export const axiosAddPlaylistToMyPlaylists = async (payload) => {
  const { data } = await instance.post('/my-playlists/add-playlist', payload)
  return data
}

export const axiosGetMyPlaylists = async () => {
  const { data } = await instance.get('/my-playlists')
  return data
}

export const axiosGetCurrentMyPlaylist = async (playlistId) => {
  const { data } = await instance.get(`/my-playlists/current/${playlistId}`)
  return data
}

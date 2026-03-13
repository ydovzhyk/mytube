import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateMyPlaylist,
  axiosAddToMyPlaylists,
  axiosAddPlaylistToMyPlaylists,
  axiosGetMyPlaylists,
  axiosGetCurrentMyPlaylist,
} from '@/lib/api/my-playlists'
import { setUser } from '@/store/auth/auth-slice'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const createMyPlaylist = createAsyncThunk(
  'my-playlists/create',
  async (userData, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosCreateMyPlaylist(userData)
      if (data?.user) {
        dispatch(setUser(data.user))
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const addToMyPlaylists = createAsyncThunk(
  'my-playlists/add',
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosAddToMyPlaylists(payload)
      if (data?.user) {
        dispatch(setUser(data.user))
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const addPlaylistToMyPlaylists = createAsyncThunk(
  'my-playlists/addPlaylist',
  async (payload, { rejectWithValue }) => {
    try {
      const data = await axiosAddPlaylistToMyPlaylists(payload)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getMyPlaylists = createAsyncThunk(
  'my-playlists/get',
  async (_, { rejectWithValue }) => {
    try {
      const data = await axiosGetMyPlaylists()
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getMyCurrentPlaylist = createAsyncThunk(
  'my-playlists/getCurrent',
  async (playlistId, { rejectWithValue }) => {
    try {
      const data = await axiosGetCurrentMyPlaylist(playlistId)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

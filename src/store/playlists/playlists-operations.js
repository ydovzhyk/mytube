import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosCreatePlaylist, axiosSearchPlaylists } from '@/lib/api/playlists'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const createPlaylist = createAsyncThunk(
  'playlists/create',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await axiosCreatePlaylist(formData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const searchPlaylists = createAsyncThunk(
  'playlists/search',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosSearchPlaylists(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

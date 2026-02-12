import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosCreatePlaylist } from '@/lib/api/playlists'

const toReject = (error, rejectWithValue) => {
  const { data, status } = error.response || {
    data: { message: error.message },
    status: 0,
  }
  return rejectWithValue({ data, status })
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

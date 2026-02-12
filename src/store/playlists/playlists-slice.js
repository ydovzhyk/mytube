import { createSlice } from '@reduxjs/toolkit'
import {
  createPlaylist,
} from './playlists-operations'

const initialState = {
  error: null,
  message: null,
  loading: false,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const playlists = createSlice({
  name: 'playlists',
  initialState,
  reducers: {
    clearPlaylistsError: (state) => {
      state.error = ''
    },
    clearPlayListsMessage: (state) => {
      state.message = ''
    },
    setPlaylistsError: (state, action) => {
      state.error = action.payload
    },
  },

  extraReducers: (builder) => {
    builder
      // * Create Playlist
      .addCase(createPlaylist.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(createPlaylist.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Playlist created')
      })
      .addCase(createPlaylist.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default playlists.reducer

export const { clearPlaylistsError, clearPlayListsMessage, setPlaylistsError } = playlists.actions
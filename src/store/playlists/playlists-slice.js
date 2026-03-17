import { createSlice } from '@reduxjs/toolkit'
import { createPlaylist, searchPlaylists } from './playlists-operations'

const initialState = {
  error: null,
  message: null,
  loading: false,

  search: {
    items: [],
    total: 0,
    page: 1,
    limit: 2,
    totalPages: 0,
    q: '',
  },
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
    clearSearchPlaylists: (state) => {
      state.search = initialState.search
    },
  },

  extraReducers: (builder) => {
    builder
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

      .addCase(searchPlaylists.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchPlaylists.fulfilled, (state, { payload }) => {
        state.loading = false
        state.search.items = Array.isArray(payload?.items) ? payload.items : []
        state.search.total = Number(payload?.total || 0)
        state.search.page = Number(payload?.page || 1)
        state.search.limit = Number(payload?.limit || 2)
        state.search.totalPages = Number(payload?.totalPages || 0)
        state.search.q = String(payload?.q || '')
      })
      .addCase(searchPlaylists.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default playlists.reducer

export const {
  clearPlaylistsError,
  clearPlaylistsMessage,
  setPlaylistsError,
  clearSearchPlaylists,
} = playlists.actions

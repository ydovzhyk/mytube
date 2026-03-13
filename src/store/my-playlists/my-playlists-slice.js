import { createSlice } from '@reduxjs/toolkit'
import {
  createMyPlaylist,
  addToMyPlaylists,
  addPlaylistToMyPlaylists,
  getMyPlaylists,
  getMyCurrentPlaylist,
} from './my-playlists-operations'

const initialState = {
  items: [],
  current: null,
  error: null,
  message: null,
  loading: false,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const normalizePlaylists = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.playlists)) return payload.playlists
  return []
}

const normalizeCurrentPlaylist = (payload) => {
  return payload?.item || payload?.playlist || payload || null
}

const upsertPlaylist = (items, nextItem) => {
  if (!nextItem?._id) return items
  const idx = items.findIndex((item) => String(item?._id) === String(nextItem._id))
  if (idx === -1) return [nextItem, ...items]

  const copy = [...items]
  copy[idx] = { ...copy[idx], ...nextItem }
  return copy
}

const myPlaylists = createSlice({
  name: 'myPlaylists',
  initialState,
  reducers: {
    clearMyPlaylistsError: (state) => {
      state.error = null
    },
    clearMyPlaylistsMessage: (state) => {
      state.message = null
    },
    setMyPlaylistsError: (state, action) => {
      state.error = action.payload
    },
    clearCurrentMyPlaylist: (state) => {
      state.current = null
    },
  },

  extraReducers: (builder) => {
    builder
      // * Create My Playlist
      .addCase(createMyPlaylist.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(createMyPlaylist.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Playlist created')

        const created = normalizeCurrentPlaylist(payload)
        if (created) {
          state.current = created
          state.items = upsertPlaylist(state.items, created)
        }
      })
      .addCase(createMyPlaylist.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Add Video To My Playlist
      .addCase(addToMyPlaylists.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(addToMyPlaylists.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Video added to playlist')

        const updated = normalizeCurrentPlaylist(payload)
        if (updated) {
          state.current = updated
          state.items = upsertPlaylist(state.items, updated)
        }
      })
      .addCase(addToMyPlaylists.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Add Existing Playlist To My Playlists
      .addCase(addPlaylistToMyPlaylists.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(addPlaylistToMyPlaylists.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Playlist added to my playlists')

        const created = normalizeCurrentPlaylist(payload)
        if (created) {
          state.current = created
          state.items = upsertPlaylist(state.items, created)
        }
      })
      .addCase(addPlaylistToMyPlaylists.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get My Playlists
      .addCase(getMyPlaylists.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMyPlaylists.fulfilled, (state, { payload }) => {
        state.loading = false
        state.items = normalizePlaylists(payload)
      })
      .addCase(getMyPlaylists.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get Current My Playlist
      .addCase(getMyCurrentPlaylist.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMyCurrentPlaylist.fulfilled, (state, { payload }) => {
        state.loading = false
        state.current = normalizeCurrentPlaylist(payload)

        if (state.current) {
          state.items = upsertPlaylist(state.items, state.current)
        }
      })
      .addCase(getMyCurrentPlaylist.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default myPlaylists.reducer

export const {
  clearMyPlaylistsError,
  clearMyPlaylistsMessage,
  setMyPlaylistsError,
  clearCurrentMyPlaylist,
} = myPlaylists.actions

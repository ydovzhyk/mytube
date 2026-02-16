import { createSlice } from '@reduxjs/toolkit'
import {
  uploadVideo,
  getVideos,
  getMyChannelVideos,
  getSubscriptionVideos,
  getVideosPicker,
  getWatchVideo,
  getSimilarVideos,
  deleteVideo,
} from './videos-operations'

const initialState = {
  error: null,
  message: null,
  loading: false,
  uploadLoading: false,
  uploadProgress: 0,
  showPlaylist: true,

  videos: [],
  subscriptionVideos: [],

  channelVideos: {
    items: [],
    page: 1,
    limit: 20,
    hasMore: true,
    contextKey: null,
  },

  picker: {
    channelId: null,
    items: [],
  },

  watch: {
    currentVideo: null,
    playlist: null,
    listId: null,

    similar: {
      items: [],
      hasMore: false,
      nextCursor: null,
      filter: 'all',
    },
  },
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

function uniqById(arr) {
  const map = new Map()
  for (const it of arr) {
    const id = it?._id || it?.id
    if (!id) continue
    if (!map.has(id)) map.set(id, it)
  }
  return Array.from(map.values())
}

const videos = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideosError: (state) => {
      state.error = ''
    },
    clearVideosMessage: (state) => {
      state.message = ''
    },
    setVideosError: (state, action) => {
      state.error = action.payload
    },
    setUploadProgress: (state, action) => {
      state.uploadProgress = action.payload
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0
    },
    resetChannelVideos: (state, action) => {
      const contextKey = action.payload || null
      state.channelVideos.items = []
      state.channelVideos.page = 1
      state.channelVideos.limit = 20
      state.channelVideos.hasMore = true
      state.channelVideos.contextKey = contextKey
    },
    resetVideosPicker: (state) => {
      state.picker.channelId = null
      state.picker.items = []
    },
    resetWatch: (state) => {
      state.watch.currentVideo = null
      state.watch.playlist = null
      state.watch.listId = null

      state.watch.similar.items = []
      state.watch.similar.hasMore = false
      state.watch.similar.nextCursor = null
    },
    setWatchCurrentVideo: (state, action) => {
      state.watch.currentVideo = action.payload || null
    },
    setWatchSimilarFilter: (state, action) => {
      state.watch.similar.filter = action.payload || 'all'
      state.watch.similar.items = []
      state.watch.similar.hasMore = false
      state.watch.similar.nextCursor = null
    },
    resetWatchSimilar: (state) => {
      state.watch.similar.items = []
      state.watch.similar.hasMore = false
      state.watch.similar.nextCursor = null
    },
    setShowPlaylist: (state, action) => {
      state.showPlaylist = Boolean(action.payload)
    },
  },

  extraReducers: (builder) => {
    builder
      // * Upload Video
      .addCase(uploadVideo.pending, (state) => {
        state.uploadLoading = true
        state.error = null
        state.message = null
        state.uploadProgress = 0
      })
      .addCase(uploadVideo.fulfilled, (state, { payload }) => {
        state.uploadLoading = false
        state.message = okMsg(payload, 'Video uploaded')
        state.uploadProgress = 100
      })
      .addCase(uploadVideo.rejected, (state, { payload }) => {
        state.uploadLoading = false
        state.error = errMsg(payload)
        state.uploadProgress = 0
      })

      // * Get Videos
      .addCase(getVideos.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(getVideos.fulfilled, (state, { payload }) => {
        state.loading = false
        state.videos = payload?.items ?? []
      })
      .addCase(getVideos.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get My Channel Videos
      .addCase(getMyChannelVideos.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(getMyChannelVideos.fulfilled, (state, { payload }) => {
        state.loading = false
        const mode = payload?.__mode || 'replace'
        const items = payload?.items || payload?.myChannelVideos || []

        if (mode === 'append') {
          state.channelVideos.items = uniqById([...state.channelVideos.items, ...items])
        } else {
          state.channelVideos.items = Array.isArray(items) ? items : []
        }

        const page = Number(payload?.page || 1)
        const limit = Number(payload?.limit || state.channelVideos.limit || 20)
        const total = Number(payload?.total || 0)

        state.channelVideos.page = page
        state.channelVideos.limit = limit

        if (typeof payload?.hasMore === 'boolean') {
          state.channelVideos.hasMore = payload.hasMore
        } else if (total) {
          state.channelVideos.hasMore = page * limit < total
        } else {
          state.channelVideos.hasMore = Array.isArray(items) && items.length === limit
        }
      })
      .addCase(getMyChannelVideos.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get Videos Picker (all channel videos for playlist form)
      .addCase(getVideosPicker.pending, (state, { meta }) => {
        state.loading = true
        state.error = null
        state.message = null
        const chId = meta?.arg?.channelId || null
        state.picker.channelId = chId
      })
      .addCase(getVideosPicker.fulfilled, (state, { payload }) => {
        state.loading = false
        const items = payload?.items || []
        state.picker.items = Array.isArray(items) ? items : []
      })
      .addCase(getVideosPicker.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get Subscription Videos
      .addCase(getSubscriptionVideos.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(getSubscriptionVideos.fulfilled, (state, { payload }) => {
        state.loading = false
        state.subscriptionVideos = payload?.subscriptionVideos ?? null
      })
      .addCase(getSubscriptionVideos.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get Watch Video (current video + playlist)
      .addCase(getWatchVideo.pending, (state, { meta }) => {
        state.loading = true
        state.error = null
        // збережемо контекст listId (щоб UI знав)
        state.watch.listId = meta?.arg?.list || null
      })
      .addCase(getWatchVideo.fulfilled, (state, { payload }) => {
        state.loading = false
        state.watch.currentVideo = payload?.currentVideo || null
        state.watch.playlist = payload?.playlist || null
        state.watch.similar.items = Array.isArray(payload?.similarVideos)
          ? payload.similarVideos
          : []
        state.watch.similar.hasMore = Boolean(payload?.similar?.hasMore)
        state.watch.similar.nextCursor = payload?.similar?.nextCursor || null
      })
      .addCase(getWatchVideo.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Get Similar Videos (load more)
      .addCase(getSimilarVideos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getSimilarVideos.fulfilled, (state, { payload }) => {
        state.loading = false
        const items = Array.isArray(payload?.items) ? payload.items : []
        state.watch.similar.items = uniqById([...state.watch.similar.items, ...items])
        state.watch.similar.hasMore = Boolean(payload?.hasMore)
        state.watch.similar.nextCursor = payload?.nextCursor || null
      })
      .addCase(getSimilarVideos.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // * Delete Video
      .addCase(deleteVideo.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteVideo.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Video deleted')
      })
      .addCase(deleteVideo.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default videos.reducer

export const {
  clearVideosError,
  clearVideosMessage,
  setVideosError,
  setUploadProgress,
  resetUploadProgress,
  resetChannelVideos,
  resetVideosPicker,
  resetWatch,
  setWatchSimilarFilter,
  resetWatchSimilar,
  setShowPlaylist,
  setWatchCurrentVideo,
} = videos.actions
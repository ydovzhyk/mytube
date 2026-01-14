import { createSlice } from '@reduxjs/toolkit'
import { uploadVideo, getVideos, getMyChannelVideos, getSubscriptionVideos,deleteVideo } from './videos-operations'

const initialState = {
  error: null,
  message: null,

  loading: false,
  uploadLoading: false,
  uploadProgress: 0,

  videos: [],
  myChannelVideos: [],
  subscriptionVideos: [],
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const videos = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    clearVideosError: (store) => {
      store.error = ''
    },
    clearVideosMessage: (store) => {
      store.message = ''
    },
    setVideosError: (store, action) => {
      store.error = action.payload
    },
    setUploadProgress: (store, action) => {
      store.uploadProgress = action.payload
    },
    resetUploadProgress: (store) => {
      store.uploadProgress = 0
    },
  },

  extraReducers: (builder) => {
    builder
      // * Upload Video
      .addCase(uploadVideo.pending, (store) => {
        store.uploadLoading = true
        store.error = null
        store.message = null
        store.uploadProgress = 0
      })
      .addCase(uploadVideo.fulfilled, (store, { payload }) => {
        store.uploadLoading = false
        store.message = okMsg(payload, 'Video uploaded')
        store.uploadProgress = 100

        if (payload?.myChannelVideos) store.myChannelVideos = payload.myChannelVideos
      })
      .addCase(uploadVideo.rejected, (store, { payload }) => {
        store.uploadLoading = false
        store.error = errMsg(payload)
        store.uploadProgress = 0
      })

      // * Get Videos
      .addCase(getVideos.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(getVideos.fulfilled, (store, { payload }) => {
        store.loading = false
        store.videos = payload?.videos ?? null
      })
      .addCase(getVideos.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Get My Channel Videos
      .addCase(getMyChannelVideos.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(getMyChannelVideos.fulfilled, (store, { payload }) => {
        store.loading = false
        store.myChannelVideos = payload?.myChannelVideos ?? null
      })
      .addCase(getMyChannelVideos.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Get Subscription Videos
      .addCase(getSubscriptionVideos.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(getSubscriptionVideos.fulfilled, (store, { payload }) => {
        store.loading = false
        store.subscriptionVideos = payload?.subscriptionVideos ?? null
      })
      .addCase(getSubscriptionVideos.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Delete Video
      .addCase(deleteVideo.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(deleteVideo.fulfilled, (store, { payload }) => {
        store.loading = false
        store.message = okMsg(payload, 'Video deleted')
        store.myChannelVideos = payload?.myChannelVideos ?? store.myChannelVideos
      })
      .addCase(deleteVideo.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })
  },
})

export default videos.reducer

export const { clearVideosError, clearVideosMessage, setVideosError, setUploadProgress, resetUploadProgress } = videos.actions
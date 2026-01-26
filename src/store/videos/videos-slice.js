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

        if (payload?.myChannelVideos) state.myChannelVideos = payload.myChannelVideos
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
        state.myChannelVideos = payload?.myChannelVideos ?? null
      })
      .addCase(getMyChannelVideos.rejected, (state, { payload }) => {
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

      // * Delete Video
      .addCase(deleteVideo.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteVideo.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Video deleted')
        state.myChannelVideos = payload?.myChannelVideos ?? state.myChannelVideos
      })
      .addCase(deleteVideo.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default videos.reducer

export const { clearVideosError, clearVideosMessage, setVideosError, setUploadProgress, resetUploadProgress } = videos.actions
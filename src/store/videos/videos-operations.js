import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosUploadVideo,
  axiosDeleteVideo,
  axiosGetMyChannelVideos,
  axiosGetSubscriptionVideos,
  axiosGetVideos,
  axiosGetVideosPicker,
  axiosVideoView,
  axiosGetWatchVideo,
  axiosGetSimilarVideos,
} from '@/lib/api/videos'
import { axiosCreatePlaylist } from '@/lib/api/playlists'
import { setUploadProgress } from './videos-slice'

const toReject = (error, rejectWithValue) => {
  const { data, status } = error.response || {
    data: { message: error.message },
    status: 0,
  }
  return rejectWithValue({ data, status })
}

export const uploadVideo = createAsyncThunk(
  'videos/upload-video',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosUploadVideo(formData, {
        onUploadProgress: (e) => {
          if (!e.total) return
          const percent = Math.round((e.loaded * 100) / e.total)
          dispatch(setUploadProgress(percent))
        },
      })
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getVideos = createAsyncThunk(
  'videos/get-videos',
  async (params, { rejectWithValue }) => {
    try {
      // params може бути undefined, або { page, limit, q, ... } — як у твоєму API
      const data = await axiosGetVideos(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getMyChannelVideos = createAsyncThunk(
  'videos/get-my-channel-videos',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetMyChannelVideos(params)
      return { ...data, __mode: params?.mode || 'replace' }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getVideosPicker = createAsyncThunk(
  'videos/get-videos-picker',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetVideosPicker(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const videoView = createAsyncThunk(
  'videos/view-count',
  async (videoId, { rejectWithValue }) => {
    try {
      await axiosVideoView(videoId)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getWatchVideo = createAsyncThunk(
  'videos/get-watch-video',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetWatchVideo(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getSimilarVideos = createAsyncThunk(
  'videos/get-similar-videos',
  async (params, { rejectWithValue }) => {
    try {
      // params: { id, cursor }
      const data = await axiosGetSimilarVideos(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const createPlaylist = createAsyncThunk(
  'videos/create-playlist',
  async (formData, { rejectWithValue }) => {
    try {
      const data = await axiosCreatePlaylist(formData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getSubscriptionVideos = createAsyncThunk(
  'videos/get-subscription-videos',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetSubscriptionVideos(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const deleteVideo = createAsyncThunk(
  'videos/delete-video',
  async (params, { rejectWithValue }) => {
    try {
      // params: { videoId } або { id } — як у твоєму API
      const data = await axiosDeleteVideo(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

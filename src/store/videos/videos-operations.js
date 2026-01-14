import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosUploadVideo,
  axiosDeleteVideo,
  axiosGetMyChannelVideos,
  axiosGetSubscriptionVideos,
  axiosGetVideos,
} from '@/lib/api/videos'
import { setUploadProgress } from './videos-slice'

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
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
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
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

export const getMyChannelVideos = createAsyncThunk(
  'videos/get-my-channel-videos',
  async (params, { rejectWithValue }) => {
    try {
      // params наприклад: { channelId } або { sid } — залежно від сервера
      const data = await axiosGetMyChannelVideos(params)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

export const getSubscriptionVideos = createAsyncThunk(
  'videos/get-subscription-videos',
  async (params, { rejectWithValue }) => {
    try {
      const data = await axiosGetSubscriptionVideos(params)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
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
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

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
  axiosReactVideo,
} from '@/lib/api/videos'
import { axiosCreatePlaylist } from '@/lib/api/playlists'
import { setUploadProgress } from './videos-slice'
import { setPlaybackSnapshot } from '@/store/player/player-slice'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
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
  async (params, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosGetWatchVideo(params)

      dispatch(
        setPlaybackSnapshot({
          currentVideo: data?.currentVideo || null,
          playlist: data?.playlist || null,
          similarItems: Array.isArray(data?.similarVideos) ? data.similarVideos : [],
          listId: params?.list || null,
        })
      )
      
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

export const reactVideo = createAsyncThunk(
  'videos/react-video',
  async (params, { rejectWithValue, getState }) => {
    try {
      const state = getState()

      const id = String(params?.id || '').trim()
      if (!id) throw new Error('Video id is required')

      const loggedIn = Boolean(state.auth?.isLogin)
      const visitorId = String(state.visitor?.id || params?.visitorId || '').trim()

      const payload = loggedIn
        ? { ...params, id, visitorId: undefined }
        : { ...params, id, visitorId }

      if (!loggedIn && !payload.visitorId) {
        throw new Error('visitorId is required for guests')
      }

      const data = await axiosReactVideo(payload)
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
      const data = await axiosDeleteVideo(params)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

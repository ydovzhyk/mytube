import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateChannel,
  axiosGetMyChannels,
  axiosGetPublicChannelByHandle,
  axiosGetChannelById,
  axiosUpdateChannel,
  axiosDeleteChannel,
  axiosSubscribeChannel,
} from '@/lib/api/channel'
import { getCurrentUser } from '../auth/auth-operations'

const toReject = (error, rejectWithValue) => {
  const { data, status } = error.response || {
    data: { message: error.message },
    status: 0,
  }
  return rejectWithValue({ data, status })
}

export const fetchMyChannels = createAsyncThunk(
  'channels/fetch-my',
  async (_, { rejectWithValue }) => {
    try {
      const data = await axiosGetMyChannels()
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const createChannel = createAsyncThunk(
  'channels/create',
  async (formData, {dispatch, rejectWithValue }) => {
    try {
      const data = await axiosCreateChannel(formData)
      if (data) {
        dispatch(fetchMyChannels())
        dispatch(getCurrentUser())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getPublicChannelByHandle = createAsyncThunk(
  'channels/get-by-handle',
  async (handle, { rejectWithValue }) => {
    try {
      return await axiosGetPublicChannelByHandle(handle)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getChannelById = createAsyncThunk(
  'channels/get-by-id',
  async (id, { rejectWithValue }) => {
    try {
      return await axiosGetChannelById(id)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const updateChannel = createAsyncThunk(
  'channels/update',
  async ({ id, formData }, {dispatch, rejectWithValue }) => {
    try {
      const data = await axiosUpdateChannel({ id, formData })
      if (data) {
        dispatch(fetchMyChannels())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const subscribeChannel = createAsyncThunk(
  'channels/subscribe',
  async (channelId, { rejectWithValue }) => {
    try {
      return await axiosSubscribeChannel(channelId)
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const deleteChannel = createAsyncThunk(
  'channels/delete',
  async (id, {dispatch, rejectWithValue }) => {
    try {
      const data = await axiosDeleteChannel(id)
      if (data) {
        dispatch(fetchMyChannels())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

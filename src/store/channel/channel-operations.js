import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateChannel,
  axiosGetMyChannels,
  axiosGetChannelByHandle,
  axiosGetChannelById,
  axiosUpdateChannel,
  axiosDeleteChannel,
} from '@/lib/api/channel'

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
      const data = await axiosGetMyChannels() // { channels }
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
      const data = await axiosCreateChannel(formData) // { channel }
      if (data) {
        dispatch(fetchMyChannels())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getChannelByHandle = createAsyncThunk(
  'channels/get-by-handle',
  async (handle, { rejectWithValue }) => {
    try {
      return await axiosGetChannelByHandle(handle) // { channel }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getChannelById = createAsyncThunk(
  'channels/get-by-id',
  async (id, { rejectWithValue }) => {
    try {
      return await axiosGetChannelById(id) // { channel }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const updateChannel = createAsyncThunk(
  'channels/update',
  async ({ id, formData }, {dispatch, rejectWithValue }) => {
    try {
      const data = await axiosUpdateChannel({ id, formData }) // { channel }
      if (data) {
        dispatch(fetchMyChannels())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const deleteChannel = createAsyncThunk(
  'channels/delete',
  async (id, {dispatch, rejectWithValue }) => {
    try {
      const data = await axiosDeleteChannel(id) // { message }
      if (data) {
        dispatch(fetchMyChannels())
      }
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

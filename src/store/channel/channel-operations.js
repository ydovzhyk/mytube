import {
  axiosCreateChannel,
  axiosDeleteChannel,
  axiosEditChannel,
  axiosGetChannel,
} from '../../lib/api/channel'
import { createAsyncThunk } from '@reduxjs/toolkit'

export const createChannel = createAsyncThunk(
  'channel/create-channel',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosCreateChannel(userData)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

export const getChannel = createAsyncThunk(
  'channel/get-channel',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosGetChannel(userData)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

export const editChannel = createAsyncThunk(
  'channel/edit-channel',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosEditChannel(userData)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

export const deleteChannel = createAsyncThunk(
  'channel/delete-channel',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosDeleteChannel(userData)
      return data
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
)

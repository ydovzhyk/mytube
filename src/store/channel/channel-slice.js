import { createSlice } from '@reduxjs/toolkit'
import {
  fetchMyChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getPublicChannelByHandle,
  getChannelById,
} from './channel-operations'

const initialState = {
  channels: [],
  channelByHandle: null,
  channelById: null,
  loading: false,
  error: null,
  message: null,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong'

const okMsg = (payload, fallback) => payload?.message || fallback

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {
    clearChannelsError(state) {
      state.error = null
    },
    clearChannelsMessage(state) {
      state.message = null
    },
    clearChannelByHandle(state) {
      state.channelByHandle = null
    },
  },
  extraReducers: (builder) => {
    builder
      // * Create channel
      .addCase(createChannel.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(createChannel.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Channel created')
      })
      .addCase(createChannel.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      // * Get My channels
      .addCase(fetchMyChannels.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(fetchMyChannels.fulfilled, (state, { payload }) => {
        state.loading = false
        state.channels = payload?.channels || []
      })
      .addCase(fetchMyChannels.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      // * Update channel
      .addCase(updateChannel.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(updateChannel.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Channel updated')
      })
      .addCase(updateChannel.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      // * Delete channel
      .addCase(deleteChannel.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteChannel.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Channel deleted')
      })
      .addCase(deleteChannel.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      // * Get channel by handle
      .addCase(getPublicChannelByHandle.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(getPublicChannelByHandle.fulfilled, (state, { payload }) => {
        state.loading = false
        state.channelByHandle = payload?.channel || null
      })
      .addCase(getPublicChannelByHandle.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
      // * Get channel by id
      .addCase(getChannelById.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(getChannelById.fulfilled, (state, { payload }) => {
        state.loading = false
        state.channelById = payload?.channel || null
      })
      .addCase(getChannelById.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })
  },
})

export default channelsSlice.reducer
export const { clearChannelsError, clearChannelsMessage, clearChannelByHandle } = channelsSlice.actions
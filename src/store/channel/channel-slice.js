import { createSlice } from '@reduxjs/toolkit'
import { createChannel, deleteChannel, editChannel, getChannel } from './channel-operations'

const initialState = {
  error: null,
  message: null,
  loading: false,
  channelData: null,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const channel = createSlice({
  name: 'channel',
  initialState,
  reducers: {
    clearChannelError: (store) => {
      store.error = ''
    },
    clearChannelMessage: (store) => {
      store.message = ''
    },
    setChannelError: (store, action) => {
      store.error = action.payload
    },
  },

  extraReducers: (builder) => {
    builder
      // * Create channel
      .addCase(createChannel.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(createChannel.fulfilled, (store, { payload }) => {
        store.loading = false
        store.message = okMsg(payload, 'Channel created')
        store.channelData = payload?.channelData ?? store.channelData
      })
      .addCase(createChannel.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Get Channel
      .addCase(getChannel.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(getChannel.fulfilled, (store, { payload }) => {
        store.loading = false
        store.channelData = payload?.channelData ?? null
      })
      .addCase(getChannel.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Edit Channel
      .addCase(editChannel.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(editChannel.fulfilled, (store, { payload }) => {
        store.loading = false
        store.message = okMsg(payload, 'Channel updated')
        store.channelData = payload?.channelData ?? store.channelData
      })
      .addCase(editChannel.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })

      // * Delete Channel
      .addCase(deleteChannel.pending, (store) => {
        store.loading = true
        store.error = null
        store.message = null
      })
      .addCase(deleteChannel.fulfilled, (store, { payload }) => {
        store.loading = false
        store.message = okMsg(payload, 'Channel deleted')
        store.channelData = null
      })
      .addCase(deleteChannel.rejected, (store, { payload }) => {
        store.loading = false
        store.error = errMsg(payload)
      })
  },
})

export default channel.reducer

export const { clearChannelError, clearChannelMessage, setChannelError } = channel.actions

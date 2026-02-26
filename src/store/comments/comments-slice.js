import { createSlice } from '@reduxjs/toolkit'
import {
  createComment,
  getCommentsByVideoId,
  editComment,
  deleteComment,
} from './comments-operations'

const initialState = {
  error: null,
  message: null,
  commentsByVideoId: {}, // { [videoId]: Comment[] }
  activeVideoId: null,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong'
const okMsg = (payload, fallback) => payload?.message || fallback

function toId(v) {
  const s = String(v || '').trim()
  return s ? s : ''
}

function upsertById(list, doc) {
  const id = toId(doc?._id)
  if (!id) return list

  const idx = list.findIndex((x) => toId(x?._id) === id)
  if (idx === -1) return [doc, ...list]
  const next = [...list]
  next[idx] = { ...next[idx], ...doc }
  return next
}

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearCommentsError(state) {
      state.error = null
    },
    clearCommentsMessage(state) {
      state.message = null
    },

    resetCommentsForVideo(state, { payload }) {
      const videoId = toId(payload)
      if (!videoId) return
      delete state.commentsByVideoId[videoId]
      if (state.activeVideoId === videoId) state.activeVideoId = null
    },
    clearComments(state) {
      state.commentsByVideoId = {}
      state.activeVideoId = null
      state.error = null
      state.message = null
    },
  },

  extraReducers: (builder) => {
    builder
      // * GET COMMENTS BY VIDEO
      .addCase(getCommentsByVideoId.pending, (state, { meta }) => {
        state.error = null
        state.message = null
        const videoId = toId(meta?.arg)
        state.activeVideoId = videoId || null
      })
      .addCase(getCommentsByVideoId.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId) || toId(state.activeVideoId)
        const comments = Array.isArray(payload?.comments) ? payload.comments : []

        if (!videoId) return
        state.commentsByVideoId[videoId] = comments
      })
      .addCase(getCommentsByVideoId.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      // * CREATE COMMENT
      .addCase(createComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(createComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const comment = payload?.comment

        state.message = okMsg(payload, 'Comment created')

        if (!videoId || !comment) return
        const prev = Array.isArray(state.commentsByVideoId[videoId])
          ? state.commentsByVideoId[videoId]
          : []
        state.commentsByVideoId[videoId] = [comment, ...prev]
      })
      .addCase(createComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      // * EDIT COMMENT
      .addCase(editComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(editComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const comment = payload?.comment

        state.message = okMsg(payload, 'Comment edited')

        if (!videoId || !comment) return
        const prev = Array.isArray(state.commentsByVideoId[videoId])
          ? state.commentsByVideoId[videoId]
          : []
        state.commentsByVideoId[videoId] = upsertById(prev, comment)
      })
      .addCase(editComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      // * DELETE COMMENT (soft in UI)
      .addCase(deleteComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(deleteComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const id = toId(payload?.id)

        state.message = okMsg(payload, 'Comment deleted')

        if (!videoId || !id) return
        const prev = Array.isArray(state.commentsByVideoId[videoId])
          ? state.commentsByVideoId[videoId]
          : []
        state.commentsByVideoId[videoId] = prev.map((c) => {
          if (toId(c?._id) !== id) return c
          return {
            ...c,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
            text: c?.text || c?.content || '',
          }
        })
      })
      .addCase(deleteComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
  },
})

export default commentsSlice.reducer
export const { clearCommentsError, clearCommentsMessage, resetCommentsForVideo, clearComments } =
  commentsSlice.actions

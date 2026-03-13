import { createSlice } from '@reduxjs/toolkit'
import {
  createComment,
  getCommentsByVideoId,
  editComment,
  deleteComment,
  reactComment,
} from './comments-operations'

const initialState = {
  error: null,
  message: null,
  // videoId -> { items: [], cursor: '', hasMore: true, loading: false }
  byVideoId: {},
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong'
const okMsg = (payload, fallback) => payload?.message || fallback

function toId(v) {
  const s = String(v || '').trim()
  return s ? s : ''
}

function ensureBucket(state, videoId) {
  const id = toId(videoId)
  if (!id) return null
  if (!state.byVideoId[id]) {
    state.byVideoId[id] = { items: [], cursor: '', hasMore: true, loading: false }
  }
  return state.byVideoId[id]
}

function dedupMerge(prev = [], next = []) {
  const map = new Map()
  for (const c of prev) {
    const id = toId(c?._id)
    if (id) map.set(id, c)
  }
  for (const c of next) {
    const id = toId(c?._id)
    if (!id) continue
    const old = map.get(id)
    map.set(id, old ? { ...old, ...c } : c)
  }
  return Array.from(map.values())
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
      delete state.byVideoId[videoId]
    },
    clearComments(state) {
      state.byVideoId = {}
      state.error = null
      state.message = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(getCommentsByVideoId.pending, (state, { meta }) => {
        state.error = null
        state.message = null
        const videoId = toId(meta?.arg?.videoId)
        const bucket = ensureBucket(state, videoId)
        if (bucket) bucket.loading = true
      })
      .addCase(getCommentsByVideoId.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const bucket = ensureBucket(state, videoId)
        if (!bucket) return

        const items = Array.isArray(payload?.items) ? payload.items : []
        const reset = Boolean(payload?.reset)

        bucket.items = reset ? items : dedupMerge(bucket.items, items)
        bucket.cursor = String(payload?.nextCursor || '')
        bucket.hasMore = Boolean(payload?.hasMore)
        bucket.loading = false
      })
      .addCase(getCommentsByVideoId.rejected, (state, { payload, meta }) => {
        state.error = errMsg(payload)
        const videoId = toId(meta?.arg?.videoId)
        const bucket = ensureBucket(state, videoId)
        if (bucket) {
          bucket.loading = false
        }
      })
      .addCase(createComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(createComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const comment = payload?.comment
        state.message = okMsg(payload, 'Comment created')
        const bucket = ensureBucket(state, videoId)
        if (!bucket || !comment) return

        bucket.items = upsertById(bucket.items, comment)
      })
      .addCase(createComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      .addCase(editComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(editComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const comment = payload?.comment
        state.message = okMsg(payload, 'Comment edited')
        const bucket = ensureBucket(state, videoId)
        if (!bucket || !comment) return

        bucket.items = upsertById(bucket.items, comment)
      })
      .addCase(editComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      .addCase(deleteComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(deleteComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const id = toId(payload?.id)

        state.message = okMsg(payload, 'Comment deleted')

        const bucket = ensureBucket(state, videoId)
        if (!bucket || !id) return

        bucket.items = bucket.items.map((c) => {
          if (toId(c?._id) !== id) return c
          return {
            ...c,
            isDeleted: true,
            deletedAt: new Date().toISOString(),
          }
        })
      })
      .addCase(deleteComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      .addCase(reactComment.pending, (state) => {
        state.error = null
        state.message = null
      })
      .addCase(reactComment.fulfilled, (state, { payload }) => {
        const videoId = toId(payload?.videoId)
        const commentId = toId(payload?.commentId)

        const bucket = ensureBucket(state, videoId)
        if (!bucket || !commentId) return

        bucket.items = bucket.items.map((c) => {
          if (toId(c?._id) !== commentId) return c
          return {
            ...c,
            likesCount: Number(payload?.likesCount ?? c?.likesCount ?? 0),
            dislikesCount: Number(payload?.dislikesCount ?? c?.dislikesCount ?? 0),
          }
        })
      })
      .addCase(reactComment.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
  },
})

export default commentsSlice.reducer
export const { clearCommentsError, clearCommentsMessage, resetCommentsForVideo, clearComments } =
  commentsSlice.actions

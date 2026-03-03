import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateComment,
  axiosGetCommentsByVideoId,
  axiosEditComment,
  axiosDeleteComment,
  axiosReactComment,
} from '@/lib/api/comments'
import { setCommentReactions } from '../auth/auth-slice'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

/**
 * GET COMMENTS
 * payload -> { videoId, items, nextCursor, hasMore, reset }
 */
export const getCommentsByVideoId = createAsyncThunk(
  'comments/getByVideoId',
  async (
    { videoId, cursor = '', limit = 10, includeReplies = 1, repliesLimit = 50, reset = false } = {},
    { rejectWithValue }
  ) => {
    try {
      const data = await axiosGetCommentsByVideoId({
        videoId,
        cursor,
        limit,
        includeReplies,
        repliesLimit,
      })
      return {
        videoId,
        items: Array.isArray(data?.items) ? data.items : [],
        nextCursor: data?.nextCursor || '',
        hasMore: Boolean(data?.hasMore),
        reset: Boolean(reset),
      }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

/**
 * CREATE COMMENT
 * returns { videoId, comment }
 */
export const createComment = createAsyncThunk(
  'comments/create',
  async ({ videoId, content, replyTo = null, pin = false } = {}, { rejectWithValue }) => {
    try {
      const data = await axiosCreateComment({ videoId, content, replyTo, pin })
      return { videoId, comment: data?.comment }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

/**
 * EDIT COMMENT
 * returns { videoId, comment }
 */
export const editComment = createAsyncThunk(
  'comments/edit',
  async ({ id, content, pin, videoId } = {}, { rejectWithValue }) => {
    try {
      const data = await axiosEditComment({ id, content, pin })
      return { videoId, comment: data?.comment }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

/**
 * DELETE COMMENT
 * returns { videoId, id }
 */
export const deleteComment = createAsyncThunk(
  'comments/delete',
  async ({ id, videoId } = {}, { rejectWithValue }) => {
    try {
      await axiosDeleteComment(id)
      return { videoId, id }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

/**
 * REACT COMMENT
 * returns { videoId, commentId, likesCount, dislikesCount }
 */
export const reactComment = createAsyncThunk(
  'comments/react',
  async ({ id, value, videoId } = {}, { rejectWithValue, dispatch }) => {
    try {
      const data = await axiosReactComment({ id, value })
      console.log('reactComment data', data)

      dispatch(setCommentReactions(data?.commentReactions || []))

      return {
        videoId,
        commentId: data?.commentId || id,
        likesCount: data?.likesCount ?? 0,
        dislikesCount: data?.dislikesCount ?? 0,
      }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

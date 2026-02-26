import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  axiosCreateComment,
  axiosGetCommentsByVideoId,
  axiosEditComment,
  axiosDeleteComment,
} from '@/lib/api/comments'

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const createComment = createAsyncThunk(
  'comments/create',
  async ({ videoId, content }, { rejectWithValue }) => {
    try {
      const data = await axiosCreateComment({ videoId, content })
      return { videoId, comment: data.comment }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const getCommentsByVideoId = createAsyncThunk(
  'comments/getByVideoId',
  async (videoId, { rejectWithValue }) => {
    try {
      const data = await axiosGetCommentsByVideoId(videoId)
      return { videoId, comments: data.comments }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const editComment = createAsyncThunk(
  'comments/edit',
  async ({ id, content, videoId }, { rejectWithValue }) => {
    try {
      const data = await axiosEditComment({ id, content })
      return { videoId, comment: data.comment }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const deleteComment = createAsyncThunk(
  'comments/delete',
  async ({ id, videoId }, { rejectWithValue }) => {
    try {
      await axiosDeleteComment(id)
      return { videoId, id }
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

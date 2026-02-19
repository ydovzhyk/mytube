import { createAsyncThunk } from '@reduxjs/toolkit'
import { axiosUpdateVisitor, axiosGetVisitor } from '../../lib/api/visitor'

const VISITOR_KEY = 'mytube:visitorId'

const toReject = (error, rejectWithValue) => {
  const { data, status } = error.response || {
    data: { message: error.message },
    status: 0,
  }
  return rejectWithValue({ data, status })
}

export const initVisitor = createAsyncThunk(
  'visitor/init',
  async (_, { rejectWithValue }) => {
    try {
      const existingId = typeof window !== 'undefined' ? localStorage.getItem(VISITOR_KEY) : null

      const data = await axiosGetVisitor({ visitorId: existingId })

      const visitorId = String(data?.visitorId || '').trim()
      if (visitorId && typeof window !== 'undefined') {
        localStorage.setItem(VISITOR_KEY, visitorId)
      }

      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  },
  {
    condition: (_, { getState }) => {
      const st = getState()
      const id = st?.visitor?.id
      return !id
    },
  }
)

export const updateVisitor = createAsyncThunk(
  'visitor/update',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosUpdateVisitor(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

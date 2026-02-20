import { createSlice } from '@reduxjs/toolkit'
import { initVisitor, updateVisitor } from './visitor-operations'
import { reactVideo } from '@/store/videos/videos-operations'

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const VISITOR_KEY = 'mytube:visitorId'

const initialState = {
  id: null,
  error: null,
  visitor: {},
}

const visitorSlice = createSlice({
  name: 'visitor',
  initialState,
  reducers: {
    clearVisitorId(state) {
      state.id = null
      state.visitor = {}
      try {
        if (typeof window !== 'undefined') localStorage.removeItem(VISITOR_KEY)
      } catch {}
    },
    clearVisitorError(state) {
      state.error = null
    },
    resetVisitor(state) {
      state.id = null
      state.visitor = {}
    }
  },
  extraReducers: (builder) => {
    builder
      // INIT
      .addCase(initVisitor.pending, (state) => {
        state.error = null
      })
      .addCase(initVisitor.fulfilled, (state, { payload }) => {
        const vid = String(payload?.visitorId || '').trim()
        if (vid) state.id = vid
        state.visitor = payload || state.visitor
      })
      .addCase(initVisitor.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })

      // UPDATE
      .addCase(updateVisitor.pending, (state) => {
        state.error = null
      })
      .addCase(updateVisitor.fulfilled, (state, { payload }) => {
        const vid = String(payload?.visitorId || '').trim()
        if (vid) state.id = vid
        state.visitor = payload || state.visitor
      })
      .addCase(updateVisitor.rejected, (state, { payload }) => {
        state.error = errMsg(payload)
      })
      // REACT VIDEO -> update visitor doc (when guest)
      .addCase(reactVideo.fulfilled, (state, { payload }) => {
        if (payload?.actorType !== 'visitor') return
        const v = payload?.visitor
        if (!v) return

        const vid = String(v?.visitorId || '').trim()
        if (vid) state.id = vid

        state.visitor = v || state.visitor
      })
  },
})

export const { clearVisitorId, clearVisitorError, resetVisitor } = visitorSlice.actions
export default visitorSlice.reducer

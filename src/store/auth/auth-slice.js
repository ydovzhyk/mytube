import { createSlice } from '@reduxjs/toolkit'
import { registration, login, logout, getCurrentUser, updateUser, deleteUser } from './auth-operations'

const initialState = {
  user: {},
  sid: null,
  accessToken: null,
  isLogin: null,
  loading: false,
  isRefreshing: false,
  error: null,
  message: null,
}

const errMsg = (payload) =>
  payload?.data?.message || payload?.message || 'Oops, something went wrong, try again'

const okMsg = (payload, fallback) => payload?.message || fallback

const applyAuthPayload = (state, payload) => {
  state.loading = false
  state.isLogin = true
  state.error = null

  state.user = payload?.user ?? { ...(payload || {}) }

  if (payload?.sid !== undefined) state.sid = payload.sid
  if (payload?.accessToken !== undefined) state.accessToken = payload.accessToken
}

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearUser: () => ({ ...initialState }),
    clearAuthError: (state) => {
      state.error = null
    },
    clearAuthMessage: (state) => {
      state.message = null
    },
    setRefreshUserData: (state, action) => {
      state.sid = action.payload.sid ?? state.sid
      state.accessToken = action.payload.accessToken ?? state.accessToken
    },
  },

  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registration.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(registration.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
        // state.message = okMsg(payload, 'Registration successful')
      })
      .addCase(registration.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
        // state.message = okMsg(payload, 'Login successful')
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // LOGOUT
      .addCase(logout.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.isLogin = false
        // state.message = 'Logged out'
      })
      .addCase(logout.rejected, (state, { payload }) => {
        state.loading = false
        state.isLogin = false
        state.error = payload ? errMsg(payload) : null
        state.message = 'Logged out'
      })

      // GET CURRENT USER
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true
        state.isRefreshing = true
        state.error = null
        state.message = null
      })
      .addCase(getCurrentUser.fulfilled, (state, { payload }) => {
        applyAuthPayload(state, payload)
        state.isRefreshing = false
      })
      .addCase(getCurrentUser.rejected, (state, { payload }) => {
        state.loading = false
        state.isRefreshing = false
        state.error = errMsg(payload)
      })

      // UPDATE USER
      .addCase(updateUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(updateUser.fulfilled, (state, { payload }) => {
        state.loading = false
        state.message = okMsg(payload, 'Profile updated')
      })
      .addCase(updateUser.rejected, (state, { payload }) => {
        state.loading = false
        state.error = errMsg(payload)
      })

      // DELETE USER
      .addCase(deleteUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(deleteUser.fulfilled, (state) => {
        state.loading = false
        state.isLogin = false
        state.message = 'Your account has been deleted.'
      })
      .addCase(deleteUser.rejected, (state, { payload }) => {
        state.loading = false
        state.isLogin = false
        state.error = payload ? errMsg(payload) : null
      })
  },
})

export default auth.reducer

export const { clearUser, clearAuthError, clearAuthMessage, setRefreshUserData } = auth.actions

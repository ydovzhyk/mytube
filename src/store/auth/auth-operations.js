import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  axiosRegister,
  axiosLogin,
  axiosLogout,
  axiosGetCurrentUser,
  axiosEditUser,
  axiosUpdateUser,
  axiosDeleteUser,
} from '../../lib/api/auth';
import { clearUser } from './auth-slice';
import { resetVisitor } from '../visitor/visitor-slice';
import { initVisitor } from '../visitor/visitor-operations';

const toReject = (error, rejectWithValue) => {
  const status = error?.response?.status || 0
  const data = error?.response?.data || { message: error?.message || 'Request failed' }
  return rejectWithValue({ status, data })
}

export const login = createAsyncThunk(
  'auth/login',
  async (body, { dispatch, rejectWithValue }) => {
  try {
    const data = await axiosLogin(body)
    dispatch(resetVisitor())
    return data
  } catch (e) {
    return toReject(e, rejectWithValue)
  }
})

export const registration = createAsyncThunk(
  'auth/register',
  async (body, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosRegister(body)
      dispatch(resetVisitor())
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async (_, { dispatch }) => {
  try {
    await axiosLogout()
  } catch (e) {
    // no-op
  } finally {
    dispatch(clearUser())
    dispatch(resetVisitor())
    dispatch(initVisitor())
  }
  return { ok: true }
})

export const getCurrentUser = createAsyncThunk(
  'auth/current',
  async (_, { rejectWithValue }) => {
    try {
      return await axiosGetCurrentUser()
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
)

export const editUser = createAsyncThunk(
  'auth/edit',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosEditUser(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/update',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosUpdateUser(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

export const deleteUser = createAsyncThunk('auth/delete', async (userId, { dispatch }) => {
  try {
    await axiosDeleteUser(userId)
  } catch (e) {
    // no-op
  } finally {
    dispatch(clearUser())
  }
  return { ok: true }
})

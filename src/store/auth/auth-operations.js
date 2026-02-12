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

const toReject = (error, rejectWithValue) => {
  const { data, status } = error.response || {
    data: { message: error.message },
    status: 0,
  }
  return rejectWithValue({ data, status })
}

export const registration = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosRegister(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const data = await axiosLogin(userData)
      return data
    } catch (e) {
      return toReject(e, rejectWithValue)
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await axiosLogout();
    } catch (e) {
      // no-op
    } finally {
      dispatch(clearUser());
    }
    return { ok: true };
  }
);

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

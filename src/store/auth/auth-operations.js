import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  axiosRegister,
  axiosLogin,
  axiosLogout,
  axiosGetCurrentUser,
  axiosUpdateUser,
  axiosDeleteUser,
} from '../../lib/api/auth';
import { clearUser } from './auth-slice';

export const registration = createAsyncThunk(
  'auth/register',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosRegister(userData);
      const { accessToken, sid } = data;
      const authData = { accessToken, sid };
      localStorage.setItem('mytube.authData', JSON.stringify(authData));
      return data;
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosLogin(userData);
      const { accessToken, sid } = data;
      const authData = { accessToken, sid };
      localStorage.setItem('mytube.authData', JSON.stringify(authData));
      return data;
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    try {
      await axiosLogout();
    } catch (e) {
    } finally {
      localStorage.removeItem('mytube.authData');
      dispatch(clearUser());
    }
    return { ok: true };
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/current',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const authDataJSON = localStorage.getItem('mytube.authData');
      if (!authDataJSON) {
        return rejectWithValue({
          data: { message: 'Not authenticated' },
          status: 401,
        });
      }
      let authData;
      try {
        authData = JSON.parse(authDataJSON);
      } catch {
        return rejectWithValue({
          data: { message: 'Broken auth data' },
          status: 400,
        });
      }

      if (!authData.sid) {
        return rejectWithValue({
          data: { message: 'Session id not found' },
          status: 400,
        });
      }

      const data = await axiosGetCurrentUser({ sid: authData.sid });

      try {
        const nextAuthData = {
          accessToken: data.accessToken,
          sid: data.sid,
        };
        localStorage.setItem(
          'mytube.authData',
          JSON.stringify(nextAuthData)
        );
      } catch {}

      return data;
    } catch (error) {
      const { data, status } = error.response || {};
      if (status === 401 || status === 403) {
        return rejectWithValue({ data, status });
      }
      return rejectWithValue({ data, status });
    }
  }
);

export const updateUser = createAsyncThunk(
  'auth/edit',
  async (userData, { dispatch, rejectWithValue }) => {
    try {
      const data = await axiosUpdateUser(userData);
      dispatch(getCurrentUser());
      return data;
    } catch (error) {
      const { data, status } = error.response || { data: { message: error.message }, status: 0 }
      return rejectWithValue({ data, status })
    }
  }
);

export const deleteUser = createAsyncThunk('auth/delete', async (userId, { dispatch }) => {
  try {
    await axiosDeleteUser(userId)
  } catch (e) {
    // no-op
  } finally {
    localStorage.removeItem('mytube.authData')
    localStorage.removeItem('mytube.settings')
    dispatch(clearUser())
  }
  return { ok: true }
})

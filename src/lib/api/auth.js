import axios from 'axios';
import { clearUser } from '@/store/auth/auth-slice';

const API_URL = 'http://localhost:4000';
// const API_URL = process.env.NEXT_PUBLIC_API_URL
export const instance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

export function setupInterceptors(store) {
  instance.interceptors.response.use(
    (r) => r,
    async (error) => {
      const originalRequest = error?.config
      const response = error?.response
      if (!response || !originalRequest) return Promise.reject(error)

      const status = response.status
      const url = originalRequest.url || ''
      const code = response.data?.code

      const isRefreshReq = url.includes('/auth/refresh')
      const isCurrentReq = url.includes('/auth/current')

      // 1) Якщо refresh впав — чистимо стейт
      if (isRefreshReq) {
        store.dispatch(clearUser())
        return Promise.reject(error)
      }

      // 2) Спецкейс: /auth/current каже "потрібно refresh"
      if (isCurrentReq && status === 401 && code === 'ACCESS_NEED_REFRESH') {
        if (originalRequest._retry) return Promise.reject(error)
        originalRequest._retry = true

        try {
          await instance.post('/auth/refresh')  // refreshToken cookie
          return instance(originalRequest)      // повтор current (вже з новим access cookie)
        } catch (e2) {
          store.dispatch(clearUser())
          return Promise.reject(e2)
        }
      }

      // 3) Для інших auth-роутів НЕ робимо авто-refresh
      const isAuthRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/logout') ||
        url.includes('/auth/current') ||
        url.includes('/auth/refresh')

      if (isAuthRoute) {
        return Promise.reject(error)
      }

      // 4) Для інших API: універсальний 401->refresh->retry
      if (status === 401) {
        if (originalRequest._retry) {
          store.dispatch(clearUser())
          return Promise.reject(error)
        }
        originalRequest._retry = true

        try {
          await instance.post('/auth/refresh')
          return instance(originalRequest)
        } catch (e2) {
          store.dispatch(clearUser())
          return Promise.reject(e2)
        }
      }

      if (status === 403) {
        store.dispatch(clearUser())
      }

      return Promise.reject(error)
    }
  )
}

export const axiosRegister = async userData => {
  const { data } = await instance.post('/auth/register', userData);
  return data;
};

export const axiosLogin = async userData => {
  const { data } = await instance.post('/auth/login', userData);
  return data;
};

export const axiosLogout = async () => {
  const { data } = await instance.post('/auth/logout');
  return data;
};

export const axiosGetCurrentUser = async () => {
  const { data } = await instance.get('/auth/current');
  return data;
};

export const axiosUpdateUser = async userData => {
  const { data } = await instance.post('/auth/edit', userData);
  return data;
};

export const axiosDeleteUser = async id => {
  const { data } = await instance.delete(`/auth/delete/${id}`);
  return { ok: true, status: data.status };
};

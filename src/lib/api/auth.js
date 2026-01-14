import axios from 'axios';
import { getAuthDataFromStorage } from '@/utils/auth-data';
import { setRefreshUserData, clearUser } from '@/store/auth/auth-slice';

const API_URL = 'http://localhost:4000';
// const API_URL = process.env.NEXT_PUBLIC_API_URL
export const instance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true, // 👈 обов'язково для HttpOnly cookies
});

function clearAuthData(store) {
  try {
    localStorage.removeItem('mytube.authData');
  } catch {}
  store.dispatch(clearUser());
}

function isHardLogoutMessage(msg = '') {
  const m = String(msg || '').toLowerCase();
  return (
    m.includes('please login again') ||
    m.includes('invalid session') ||
    m.includes('session timed out') ||
    m.includes('refresh end') ||
    m.includes('invalid user')
  );
}

export function setupInterceptors(store) {
  // === Request ===
  instance.interceptors.request.use(config => {
    const authData = getAuthDataFromStorage(store);
    const u = config.url || '';
    const isRefresh = u.endsWith('/auth/refresh') || u === 'auth/refresh';
    const isCurrent = u.endsWith('/auth/current') || u === 'auth/current';

    if (authData?.accessToken && !isRefresh && !isCurrent) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${authData.accessToken}`,
      };
    }

    return config;
  });

  // === Response ===
  instance.interceptors.response.use(
    r => r,
    async error => {
      const originalRequest = error?.config;
      const { response } = error || {};
      if (!response || !originalRequest) return Promise.reject(error);

      const status = response.status;
      const data = response.data || {};
      const message = data.message || '';
      const code = data.code || '';
      const url = originalRequest.url || '';
      const isRefreshReq =
        url.endsWith('/auth/refresh') || url.includes('/auth/refresh');

      // Якщо саме refresh впав — жорсткий логаут
      if (isRefreshReq) {
        clearAuthData(store);
        return Promise.reject(error);
      }

      const hardLogoutByCode =
        (status === 401 &&
          (code === 'REFRESH_EXPIRED' || code === 'REFRESH_INVALID')) ||
        (status === 404 &&
          (code === 'USER_NOT_FOUND' || code === 'SESSION_NOT_FOUND'));

      if (
        hardLogoutByCode ||
        (status === 401 && isHardLogoutMessage(message))
      ) {
        clearAuthData(store);
        return Promise.reject(error);
      }

      // Кейс: access токен протух → пробуємо 1 раз зробити /auth/refresh
      if (status === 401 && message === 'Unauthorized') {
        if (originalRequest._retry) {
          clearAuthData(store);
          return Promise.reject(error);
        }
        originalRequest._retry = true;

        try {
          const authData = getAuthDataFromStorage(store);
          // refresh тепер тільки в cookie, тому достатньо sid
          if (!authData?.sid) {
            clearAuthData(store);
            return Promise.reject(error);
          }

          const refreshResp = await instance.post('/auth/refresh', {
            sid: authData.sid,
          });
          const respData = refreshResp.data || {};

          const newData = {
            accessToken: respData.newAccessToken,
            sid: respData.sid,
          };

          store.dispatch(setRefreshUserData(newData));
          try {
            localStorage.setItem('mytube.authData', JSON.stringify(newData));
          } catch {}

          originalRequest.headers = {
            ...(originalRequest.headers || {}),
            Authorization: `Bearer ${newData.accessToken}`,
          };

          // Якщо падав /auth/current — повторюємо запит з оновленим sid
          if (originalRequest.url === '/auth/current') {
            originalRequest.data = {
              sid: newData.sid,
            };
          }

          return instance(originalRequest);
        } catch (refreshErr) {
          clearAuthData(store);
          return Promise.reject(refreshErr);
        }
      }

      // 403 для refresh-логіки: NO_TOKEN та інші — теж логаут
      if (status === 403) {
        clearAuthData(store);
      }

      return Promise.reject(error);
    }
  );
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

export const axiosGetCurrentUser = async userData => {
  const { data } = await instance.post('/auth/current', userData);
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

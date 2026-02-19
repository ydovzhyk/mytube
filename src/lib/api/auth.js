import axios from 'axios'
import { clearUser } from '@/store/auth/auth-slice'

const API_URL = 'http://localhost:4000'
// const API_URL = process.env.NEXT_PUBLIC_API_URL

export const instance = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
})

// =====================
// DEBUG HELPERS
// =====================

// Увімкни/вимкни дебаг
const AXIOS_DEBUG = false

// Короткий uid, щоб зручно трекати один і той самий запит через error->refresh->retry
function makeReqId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// Безпечно дістаємо content-type
function getContentType(headers = {}) {
  return headers['Content-Type'] || headers['content-type'] || ''
}

// Визначаємо чи це FormData (важливо: retry upload може ламатися через body)
function isFormData(data) {
  return typeof FormData !== 'undefined' && data instanceof FormData
}

// Дістаємо ключі FormData (файли не логимо повністю — лише метадані)
function dumpFormData(fd) {
  const out = []
  try {
    for (const [k, v] of fd.entries()) {
      if (typeof File !== 'undefined' && v instanceof File) {
        out.push([k, `File(name=${v.name}, size=${v.size}, type=${v.type})`])
      } else {
        // щоб не засмічувати лог, обрізаємо довгі строки
        const s = String(v)
        out.push([k, s.length > 200 ? `${s.slice(0, 200)}…` : s])
      }
    }
  } catch {
    out.push(['<formdata>', '<cannot iterate>'])
  }
  return out
}

// Дамп одного запиту (originalRequest / config)
function dumpReq(label, req, extra = {}) {
  if (!AXIOS_DEBUG) return
  if (!req) return console.log(`[AXIOS][${label}] <no request>`)

  const headers = req.headers || {}
  const ct = getContentType(headers)
  const fd = isFormData(req.data)

  console.log(`\n[AXIOS][${label}]`, {
    id: req.__reqId,
    method: req.method,
    url: req.baseURL ? `${req.baseURL}${req.url}` : req.url,
    _retry: req._retry,
    status: req.__status,
    contentType: ct || '(none)',
    hasData: req.data !== undefined,
    dataType: fd ? 'FormData' : typeof req.data,
    // Для FormData показуємо ключі (важливо для діагностики retry)
    formDataEntries: fd ? dumpFormData(req.data) : null,
    ...extra,
  })
}

// =====================
// INTERCEPTORS
// =====================

export function setupInterceptors(store) {
  // Дозволяє побачити: чи реально відправився retry після refresh.
  instance.interceptors.request.use((config) => {
    if (!config.__reqId) config.__reqId = makeReqId()
    dumpReq('REQUEST_OUT', config)
    return config
  })

  instance.interceptors.response.use(
    (r) => r,
    async (error) => {
      const originalRequest = error?.config
      const response = error?.response

      // Якщо axios не дав response/config — це мережа/блок/відміна
      if (!originalRequest) return Promise.reject(error)

      // Проставимо id, щоб трекати в логах
      if (!originalRequest.__reqId) originalRequest.__reqId = makeReqId()

      // Збережемо status для зручності в dump
      if (response) originalRequest.__status = response.status

      // Лог входу помилки (бачимо body, headers, чи FormData і т.д.)
      dumpReq('ERROR_IN', originalRequest, {
        respStatus: response?.status,
        respCode: response?.data?.code,
        respMessage: response?.data?.message,
      })

      // Якщо немає response — це не 401/403, а щось типу CORS/Network Error
      if (!response) return Promise.reject(error)

      const status = response.status
      const url = originalRequest.url || ''
      const code = response.data?.code

      const isRefreshReq = url.includes('/auth/refresh')
      const isCurrentReq = url.includes('/auth/current')

      // 1) Якщо refresh впав — чистимо стейт
      // (тут важливо зрозуміти, що це "кінцева" точка)
      if (isRefreshReq) {
        if (AXIOS_DEBUG) console.log('[AXIOS] refresh request FAILED -> clearUser()')
        store.dispatch(clearUser())
        return Promise.reject(error)
      }

      // 2) Спецкейс: /auth/current каже "потрібно refresh"
      if (isCurrentReq && status === 401 && code === 'ACCESS_NEED_REFRESH') {
        if (originalRequest._retry) {
          if (AXIOS_DEBUG) console.log('[AXIOS] /auth/current already retried once -> stop')
          return Promise.reject(error)
        }
        originalRequest._retry = true

        try {
          if (AXIOS_DEBUG) console.log('[AXIOS] /auth/current needs refresh -> calling /auth/refresh')
          await instance.post('/auth/refresh') // refreshToken cookie
          if (AXIOS_DEBUG) console.log('[AXIOS] refresh OK -> retrying /auth/current')
          dumpReq('RETRY_OUT_CURRENT', originalRequest)
          return instance(originalRequest) // повтор current
        } catch (e2) {
          if (AXIOS_DEBUG) console.log('[AXIOS] refresh failed during /auth/current flow -> clearUser()')
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
        if (AXIOS_DEBUG) console.log('[AXIOS] auth route error -> do not auto-refresh', { url, status, code })
        return Promise.reject(error)
      }

      // 4) Для інших API: універсальний 401->refresh->retry
      if (status === 401) {
        if (AXIOS_DEBUG) console.log('[AXIOS] 401 for non-auth API -> try refresh+retry', { url })

        if (originalRequest._retry) {
          if (AXIOS_DEBUG) console.log('[AXIOS] already retried once -> clearUser()')
          store.dispatch(clearUser())
          return Promise.reject(error)
        }
        originalRequest._retry = true

        try {
          if (AXIOS_DEBUG) console.log('[AXIOS] calling /auth/refresh...')
          await instance.post('/auth/refresh')

          // ВАЖЛИВО:
          // Якщо originalRequest.data === FormData, інколи retry може не відправитись як очікується.
          // Логи нижче покажуть: чи є data, чи це FormData, і чи REQUEST_OUT зʼявляється вдруге.
          if (AXIOS_DEBUG) console.log('[AXIOS] refresh OK -> retrying original request', { url })
          dumpReq('RETRY_OUT', originalRequest)

          return instance(originalRequest)
        } catch (e2) {
          if (AXIOS_DEBUG) console.log('[AXIOS] refresh failed in 401 flow -> clearUser()')
          store.dispatch(clearUser())
          return Promise.reject(e2)
        }
      }

      if (status === 403) {
        return Promise.reject(error)
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

export const axiosEditUser = async userData => {
  const { data } = await instance.post('/auth/edit', userData);
  return data;
};

export const axiosUpdateUser = async (userData) => {
  const { data } = await instance.post('/auth/update', userData)
  return data
}

export const axiosDeleteUser = async id => {
  const { data } = await instance.delete(`/auth/delete/${id}`);
  return { ok: true, status: data.status };
};

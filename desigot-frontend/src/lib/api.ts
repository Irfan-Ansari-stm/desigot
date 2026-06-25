import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// ── Token storage (memory + cookie fallback) ──────────────────────────────────
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null) => { _accessToken = token; };
export const getAccessToken = () => _accessToken;

// ── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken) config.headers.Authorization = `Bearer ${_accessToken}`;
  return config;
});

// ── Response interceptor — auto-refresh on 401 ────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${BASE}/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        setAccessToken(null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── Typed API helpers ──────────────────────────────────────────────────────────
export const apiGet    = <T>(url: string, params?: object) => api.get<{ success: boolean; data: T; pagination?: unknown }>(url, { params }).then((r) =>
  r.data.pagination ? ({ data: r.data.data, pagination: r.data.pagination } as T) : r.data.data
);
export const apiPost   = <T>(url: string, body?: unknown)  => api.post<{ success: boolean; data: T }>(url, body).then((r) => r.data.data);
export const apiPatch  = <T>(url: string, body?: unknown)  => api.patch<{ success: boolean; data: T }>(url, body).then((r) => r.data.data);
export const apiPut    = <T>(url: string, body?: unknown)  => api.put<{ success: boolean; data: T }>(url, body).then((r) => r.data.data);
export const apiDelete = <T>(url: string)                  => api.delete<{ success: boolean; data: T }>(url).then((r) => r.data.data);

export const apiUpload = <T>(url: string, formData: FormData) =>
  api.post<{ success: boolean; data: T }>(url, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data.data);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "An error occurred";
  }
  return "An unexpected error occurred";
};

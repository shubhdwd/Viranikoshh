import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// When sending FormData (file uploads), the instance-level Content-Type
// "application/json" must be removed so the browser can set the correct
// "multipart/form-data; boundary=..." header. Without this, multer
// receives a JSON Content-Type and ignores the multipart body entirely,
// causing a 400 "No file uploaded" on every upload attempt.
apiClient.interceptors.request.use((config) => {
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url: string = error.config?.url ?? '';
      const isSessionEndpoint = url.includes('/auth/me') || url.includes('/auth/login');

      if (isSessionEndpoint) {
        sessionStorage.setItem('viranikosh.signedOut', '1');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const LIVE_BACKEND = true;

export class ApiError extends Error {
  constructor(message: string, readonly retryable = true) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function request<T = any>(
  config: AxiosRequestConfig,
  fallback?: () => T,
  latencyMs = 340)
: Promise<T> {
  if (LIVE_BACKEND) {
    const response = await apiClient.request<{ success: boolean; data: T; message?: string }>(config);
    return response.data.data;
  }
  if (fallback) {
    await new Promise((resolve) => setTimeout(resolve, latencyMs));
    return fallback();
  }
  throw new Error('API call failed and no fallback was provided');
}

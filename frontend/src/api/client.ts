import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env['VITE_API_URL'] || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://viranikosh-2.onrender.com');

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.setItem('viranikosh.signedOut', '1');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
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

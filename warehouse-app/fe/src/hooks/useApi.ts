import { useMemo } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

export function useApi() {
  const { accessToken, refreshToken, setAccessToken, clearAuth } = useAuthStore();

  return useMemo(() => {
    const api = axios.create({
      baseURL: BASE,
      headers: { 'Content-Type': 'application/json' },
    });

    // Gắn access token vào mỗi request
    api.interceptors.request.use(config => {
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    });

    // Auto refresh khi nhận 401
    api.interceptors.response.use(
      res => res,
      async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry && refreshToken) {
          original._retry = true;
          try {
            const res = await axios.post(`${BASE}/auth/refresh`, { refreshToken });
            const newToken = res.data.accessToken;
            setAccessToken(newToken);
            original.headers.Authorization = `Bearer ${newToken}`;
            return api(original);
          } catch {
            clearAuth();
            window.location.href = '/login';
          }
        }
        return Promise.reject(err);
      }
    );

    return api;
  }, [accessToken, refreshToken]);
}
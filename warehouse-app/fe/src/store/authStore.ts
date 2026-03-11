import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  fullName: string;
  role: 'Admin' | 'Staff';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user:         JSON.parse(localStorage.getItem('user') ?? 'null'),
  accessToken:  localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),

  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('user',         JSON.stringify(user));
    localStorage.setItem('accessToken',  accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, refreshToken });
  },

  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token });
  },
}));
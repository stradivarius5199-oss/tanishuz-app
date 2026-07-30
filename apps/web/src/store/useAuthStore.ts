import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  profile?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (token: string, refreshToken: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // изначально true, пока проверяем куки на старте
  
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  
  login: (token, refreshToken, user) => {
    Cookies.set('accessToken', token, { expires: 1/96 }); // 15 минут
    Cookies.set('refreshToken', refreshToken, { expires: 30 }); // 30 дней
    set({ user, isAuthenticated: true, isLoading: false });
  },
  
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null, isAuthenticated: false, isLoading: false });
  }
}));

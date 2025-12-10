import { create } from 'zustand';

import { storage } from './storage';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: storage.isAuthenticated(),
  token: storage.getToken(),

  login: (token: string) => {
    storage.setToken(token);
    set({ isAuthenticated: true, token });
  },

  logout: () => {
    storage.removeToken();
    set({ isAuthenticated: false, token: null });
  },
}));

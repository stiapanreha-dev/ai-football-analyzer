import { create } from 'zustand';

import { storage } from './storage';

export type AdminRole = 'admin' | 'user';

export interface AdminInfo {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  admin: AdminInfo | null;
  login: (token: string) => void;
  logout: () => void;
  setAdmin: (admin: AdminInfo | null) => void;
  isAdmin: () => boolean;
}

export const useAuth = create<AuthState>((set) => ({
  isAuthenticated: storage.isAuthenticated(),
  token: storage.getToken(),
  admin: storage.getAdmin(),

  login: (token: string) => {
    storage.setToken(token);
    set({ isAuthenticated: true, token });
  },

  logout: () => {
    storage.removeToken();
    storage.removeAdmin();
    set({ isAuthenticated: false, token: null, admin: null });
  },

  setAdmin: (admin: AdminInfo | null) => {
    if (admin) {
      storage.setAdmin(admin);
    } else {
      storage.removeAdmin();
    }
    set({ admin });
  },

  isAdmin: () => {
    const admin = storage.getAdmin();
    return admin?.role === 'admin';
  },
}));

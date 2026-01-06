import type { AdminInfo } from './useAuth';

const TOKEN_KEY = 'token';
const ADMIN_KEY = 'admin';

export const storage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getAdmin(): AdminInfo | null {
    const data = localStorage.getItem(ADMIN_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data) as AdminInfo;
    } catch {
      return null;
    }
  },

  setAdmin(admin: AdminInfo): void {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
  },

  removeAdmin(): void {
    localStorage.removeItem(ADMIN_KEY);
  },
};

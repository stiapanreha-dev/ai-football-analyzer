import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/shared/lib/useAuth';

import {
  login as loginApi,
  loginTelegram as loginTelegramApi,
  logout as logoutApi,
  getMe,
} from './api';
import type { TelegramAuthData } from './api';

export function useLoginTelegram() {
  const navigate = useNavigate();
  const authLogin = useAuth((state) => state.login);
  const setAdmin = useAuth((state) => state.setAdmin);

  return useMutation({
    mutationFn: (data: TelegramAuthData) => loginTelegramApi(data),
    onSuccess: (data) => {
      authLogin(data.token);
      setAdmin(data.admin);
      navigate('/');
    },
  });
}

export function useLogin() {
  const navigate = useNavigate();
  const authLogin = useAuth((state) => state.login);

  return useMutation({
    mutationFn: (password: string) => loginApi(password),
    onSuccess: (data) => {
      authLogin(data.token);
      navigate('/');
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const authLogout = useAuth((state) => state.logout);

  return useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      authLogout();
      navigate('/login');
    },
    onError: () => {
      authLogout();
      navigate('/login');
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const setAdmin = useAuth((state) => state.setAdmin);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const data = await getMe();
      if (data.admin) {
        setAdmin(data.admin);
      }
      return data;
    },
    enabled: isAuthenticated,
  });
}

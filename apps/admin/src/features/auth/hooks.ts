import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/shared/lib/useAuth';

import { login as loginApi, logout as logoutApi, getMe } from './api';

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
      // Даже при ошибке разлогиниваем локально
      authLogout();
      navigate('/login');
    },
  });
}

export function useCurrentUser() {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}

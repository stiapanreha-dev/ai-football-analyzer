import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/shared/lib/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface AdminOnlyRouteProps {
  children: React.ReactNode;
}

export function AdminOnlyRoute({ children }: AdminOnlyRouteProps) {
  const isAuthenticated = useAuth((state) => state.isAuthenticated);
  const isAdmin = useAuth((state) => state.isAdmin);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import type { Role } from '@/types';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const user = useAuthStore((s) => s.user);
  const token = localStorage.getItem('accessToken');

  // Token is the source of truth for whether the user should reach the protected area.
  // `user` may be null during first render/rehydration.
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If roles are provided but we don't yet have `user`, allow rendering and let the
  // app fetch/rehydrate user data (or keep existing UI logic).
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';

interface AdminRouteProps {
  children: ReactElement;
}

const getRoleFromToken = (token: string | null): string | null => {
  if (!token) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(normalized));
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
};

export const AdminRoute = ({ children }: AdminRouteProps) => {
  const location = useLocation();
  const { token, user } = useAppSelector((state) => state.auth);
  const tokenRole = getRoleFromToken(token);

  if (!token) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin' && tokenRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
};

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import { getStoredToken } from '../store/authSlice';

export function AuthGuard() {
  const token = useAppSelector((s) => s.auth.token);
  const location = useLocation();
  const hasToken = Boolean(token ?? getStoredToken());

  if (!hasToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

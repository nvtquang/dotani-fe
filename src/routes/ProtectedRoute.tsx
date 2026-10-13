import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../stores/AuthContext';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <span className="size-8 animate-spin rounded-full border-4 border-brand-600 border-r-transparent" aria-hidden="true" />
        <span className="sr-only">Đang tải</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

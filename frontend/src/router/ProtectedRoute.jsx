import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, getDashboardPath } from '../contexts/AuthContext';
import { AppLoader } from '../components/ui';

/* Determine the default landing path for a user */
function defaultPath(user) {
  const role = user.activeRole || user.role || 'creator';
  return getDashboardPath(role);
}

export function ProtectedRoute({ children, roles }) {
  const { user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) return <AppLoader />;
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />;

  /* SuperAdmin bypasses all role checks */
  if (user.role === 'superadmin' || user.roles?.includes('superadmin')) return <>{children}</>;

  /* If specific roles required, check at least one matches */
  if (roles && roles.length > 0 && !roles.some(r => hasRole(r))) {
    return <Navigate to={defaultPath(user)} replace />;
  }

  return <>{children}</>;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (user)    return <Navigate to={defaultPath(user)} replace />;
  return <>{children}</>;
}

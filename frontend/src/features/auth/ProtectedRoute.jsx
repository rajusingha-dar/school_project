import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homePathFor } from './roles';
import { useAuth } from './useAuth';

/**
 * Route guard. Anonymous visitors go to /login; signed-in users with the wrong role
 * are sent to their own home.
 *
 * @param {{roles?: string[]}} props roles allowed on this route (any signed-in user if omitted)
 */
export function ProtectedRoute({ roles }) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <div className="page-loading">Loading…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}

/** Wraps public-only pages (login/register): signed-in users are sent to their home. */
export function PublicOnlyRoute() {
  const { user, status } = useAuth();
  if (status === 'loading') return <div className="page-loading">Loading…</div>;
  if (user) return <Navigate to={homePathFor(user.role)} replace />;
  return <Outlet />;
}

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { FullPageSpinner } from './Spinner.jsx';
import { homeFor } from '../utils/roles.js';

// <ProtectedRoute roles={['teacher']} />  -> layout route (renders nested routes)
// <ProtectedRoute roles={['teacher']}><Page /></ProtectedRoute> -> wraps one element
// Without roles: any logged-in user.
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  // Not logged in -> login, and come back here afterwards
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // Logged in but wrong role -> send them to their own area
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return children ?? <Outlet />;
}

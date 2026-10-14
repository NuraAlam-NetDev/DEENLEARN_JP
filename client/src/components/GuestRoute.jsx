import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { FullPageSpinner } from './Spinner.jsx';
import { homeFor } from '../utils/roles.js';

// For /login and /register: logged-in users are bounced to where they were going
// (or to their dashboard). This also handles the redirect right after a successful login.
export default function GuestRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (user) {
    const from = location.state?.from?.pathname;
    return <Navigate to={from || homeFor(user.role)} replace />;
  }
  return <Outlet />;
}

import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '../auth/AuthContext';

// Guard for pages that require login.
export default function ProtectedRoute({ children }) {
  const { token, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <p>Checking login session...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}


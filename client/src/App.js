import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';

// App routes are wrapped by auth provider so every page can access auth state.
function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={(
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        )}
      />
      <Route path="/" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Top-level app shell for frontend step 1 (auth foundation).
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-root">
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

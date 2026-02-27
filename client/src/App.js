import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import './App.css';
import { AuthProvider, useAuth } from './auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import CollectionCentersPage from './pages/CollectionCentersPage';
import DashboardPage from './pages/DashboardPage';
import FarmersPage from './pages/FarmersPage';
import FeedstockTypesPage from './pages/FeedstockTypesPage';
import LoginPage from './pages/LoginPage';
import VehiclesPage from './pages/VehiclesPage';

// App routes are wrapped by auth provider so every page can access auth state.
function AppRoutes() {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={(
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        )}
      >
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="feedstock-types" element={<FeedstockTypesPage />} />
        <Route path="farmers" element={<FarmersPage />} />
        <Route path="collection-centers" element={<CollectionCentersPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route index element={<Navigate to="/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
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

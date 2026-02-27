import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL } from '../config/api';
import { authStorage } from './storage';

const AuthContext = createContext(null);

// Shared auth provider for login, logout, and session bootstrap.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(authStorage.getToken());
  const [user, setUser] = useState(authStorage.getUser());
  const [isAuthLoading, setIsAuthLoading] = useState(Boolean(authStorage.getToken()));

  // On app load, validate saved token by calling /me.
  useEffect(() => {
    const existingToken = authStorage.getToken();
    if (!existingToken) {
      setIsAuthLoading(false);
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${existingToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const me = await response.json();
        const mergedUser = {
          ...(authStorage.getUser() || {}),
          ...me,
        };
        setUser(mergedUser);
        authStorage.setUser(mergedUser);
      } catch (error) {
        authStorage.clear();
        setToken('');
        setUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    };

    verify();
  }, []);

  // Login calls backend and stores token + user profile in local storage.
  const login = async ({ email, password }) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.message || 'Login failed');
    }

    authStorage.setToken(payload.token);
    authStorage.setUser(payload.user);
    setToken(payload.token);
    setUser(payload.user);
    return payload.user;
  };

  // Logout clears local session state and local storage.
  const logout = () => {
    authStorage.clear();
    setToken('');
    setUser(null);
  };

  // Helper for future API calls where tenant and auth headers are needed.
  const getAuthorizedHeaders = () => {
    const latestToken = authStorage.getToken();
    const latestUser = authStorage.getUser();
    return {
      Authorization: `Bearer ${latestToken}`,
      'x-tenant-id': latestUser?.tenantId || '',
    };
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthLoading,
      login,
      logout,
      getAuthorizedHeaders,
    }),
    [token, user, isAuthLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}


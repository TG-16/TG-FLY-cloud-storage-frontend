import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      setUser(data.user);
    } catch {
      api.clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if we got a token from Google OAuth callback
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      api.setToken(token);
      window.history.replaceState({}, '', window.location.pathname);
    }
    fetchUser();
  }, [fetchUser]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setUser(data.user);
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await api.signup(name, email, password);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ft_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ft_token');
    if (token) {
      API.get('/auth/me')
        .then(res => setUser(res.data.user))
        .catch(() => { localStorage.removeItem('ft_token'); localStorage.removeItem('ft_user'); setUser(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user } = res.data;
    localStorage.setItem('ft_token', token);
    localStorage.setItem('ft_user', JSON.stringify(user));
    setUser(user);
    return res.data;
  }, []);

  const register = useCallback(async (data) => {
    const res = await API.post('/auth/register', data);
    const { token, user } = res.data;
    localStorage.setItem('ft_token', token);
    localStorage.setItem('ft_user', JSON.stringify(user));
    setUser(user);
    return res.data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ft_token');
    localStorage.removeItem('ft_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('ft_user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

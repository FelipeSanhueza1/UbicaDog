import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, recaptchaToken?: string) => Promise<void>;
  employeeLogin: (email: string, password: string) => Promise<void>;
  googleLogin: (email: string, name?: string, avatarUrl?: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string, recaptchaToken?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('ubicadog_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await api.get('/auth/me');
      setUser(res.data.user);
    } catch (err) {
      localStorage.removeItem('ubicadog_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string, recaptchaToken?: string) => {
    const res = await api.post('/auth/login', { email, password, recaptchaToken });
    localStorage.setItem('ubicadog_token', res.data.token);
    setUser(res.data.user);
  };

  const employeeLogin = async (email: string, password: string) => {
    const res = await api.post('/auth/employee-login', { email, password });
    localStorage.setItem('ubicadog_token', res.data.token);
    setUser(res.data.user);
  };

  const googleLogin = async (email: string, name?: string, avatarUrl?: string) => {
    const res = await api.post('/auth/google', { email, name, avatarUrl });
    localStorage.setItem('ubicadog_token', res.data.token);
    setUser(res.data.user);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string,
    recaptchaToken?: string
  ) => {
    const res = await api.post('/auth/register', { name, email, password, phone, recaptchaToken });
    localStorage.setItem('ubicadog_token', res.data.token);
    setUser(res.data.user);
  };

  const logout = () => {
    localStorage.removeItem('ubicadog_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        employeeLogin,
        googleLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

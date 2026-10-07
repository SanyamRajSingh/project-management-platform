import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { storage } from '../services/storage';
import { authApi, setSessionExpiredListener } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionExpiredMessage: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearSessionExpiredMessage: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  sessionExpiredMessage: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearSessionExpiredMessage: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<string | null>(null);

  useEffect(() => {
    // Register global session expiration listener
    setSessionExpiredListener(() => {
      setUser(null);
      setSessionExpiredMessage('Your session has expired. Please log in again.');
    });

    const checkAuth = async () => {
      try {
        const token = await storage.getAccessToken();
        if (token) {
          const res = await authApi.getMe();
          setUser(res.user);
          await storage.setUser(res.user);
        }
      } catch {
        await storage.clearAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setSessionExpiredMessage(null);
    const data = await authApi.login({ email, password });
    await storage.setAccessToken(data.accessToken);
    if (data.refreshToken) {
      await storage.setRefreshToken(data.refreshToken);
    }
    await storage.setUser(data.user);
    setUser(data.user);
  };

  const register = async (fullName: string, email: string, password: string) => {
    setSessionExpiredMessage(null);
    const data = await authApi.register({ fullName, email, password });
    if (data.accessToken) {
      await storage.setAccessToken(data.accessToken);
      if (data.refreshToken) {
        await storage.setRefreshToken(data.refreshToken);
      }
      await storage.setUser(data.user);
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      await storage.clearAuth();
      setUser(null);
    }
  };

  const clearSessionExpiredMessage = () => {
    setSessionExpiredMessage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        sessionExpiredMessage,
        login,
        register,
        logout,
        clearSessionExpiredMessage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

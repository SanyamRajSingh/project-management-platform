import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { storage } from './storage';
import {
  DashboardStats,
  Project,
  Task,
  User,
} from '../types';

// Android Emulator default loopback is 10.0.2.2; iOS / Web is localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_HOST;

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let sessionExpiredCallback: (() => void) | null = null;

export function setSessionExpiredListener(callback: () => void) {
  sessionExpiredCallback = callback;
}

// Attach access token
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Automatic refresh interceptor on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((promise) => {
    if (token) promise.resolve(token);
    else promise.reject(error);
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = await storage.getRefreshToken();
    if (!refreshToken) {
      await storage.clearAuth();
      if (sessionExpiredCallback) sessionExpiredCallback();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshResponse = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } =
        refreshResponse.data.data || refreshResponse.data;

      await storage.setAccessToken(accessToken);
      if (newRefreshToken) {
        await storage.setRefreshToken(newRefreshToken);
      }

      processQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await storage.clearAuth();
      if (sessionExpiredCallback) sessionExpiredCallback();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  },
);

// Endpoints
export const authApi = {
  async register(data: { fullName: string; email: string; password: string }) {
    const res = await api.post('/auth/register', data);
    return res.data?.data || res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post('/auth/login', data);
    return res.data?.data || res.data;
  },

  async logout() {
    const refreshToken = await storage.getRefreshToken();
    try {
      await api.post('/auth/logout', { refreshToken: refreshToken || undefined });
    } catch {
      // Ignore network errors on logout
    }
    await storage.clearAuth();
  },

  async getMe(): Promise<{ user: User }> {
    const res = await api.get('/auth/me');
    return res.data?.data || res.data;
  },
};

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/dashboard');
    return res.data?.data || res.data;
  },
};

export const projectsApi = {
  async list(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<Project[]> {
    const res = await api.get('/projects', { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : payload?.data || [];
  },

  async getById(id: string): Promise<Project> {
    const res = await api.get(`/projects/${id}`);
    return res.data?.data || res.data;
  },

  async create(data: {
    name: string;
    description?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Project> {
    const res = await api.post('/projects', data);
    return res.data?.data || res.data;
  },

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<Project> {
    const res = await api.put(`/projects/${id}`, data);
    return res.data?.data || res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`);
  },
};

export const tasksApi = {
  async list(params?: {
    projectId?: string;
    search?: string;
    status?: string;
    priority?: string;
  }): Promise<Task[]> {
    let url = '/tasks';
    if (params?.projectId) {
      url = `/projects/${params.projectId}/tasks`;
    }
    const res = await api.get(url, { params });
    const payload = res.data?.data || res.data;
    return Array.isArray(payload) ? payload : payload?.data || [];
  },

  async getById(id: string): Promise<Task> {
    const res = await api.get(`/tasks/${id}`);
    return res.data?.data || res.data;
  },

  async create(data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
  }): Promise<Task> {
    const res = await api.post('/tasks', data);
    return res.data?.data || res.data;
  },

  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      dueDate?: string;
    },
  ): Promise<Task> {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data?.data || res.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};

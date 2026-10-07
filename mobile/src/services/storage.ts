import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const ACCESS_TOKEN_KEY = 'flowtide_access_token';
const REFRESH_TOKEN_KEY = 'flowtide_refresh_token';
const USER_KEY = 'flowtide_user';

export const storage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  },

  async getUser(): Promise<User | null> {
    try {
      const raw = await SecureStore.getItemAsync(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async setUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  },

  async clearAuth(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch {
      // Continue safely
    }
  },
};

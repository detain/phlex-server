// src/stores/useAuthStore.ts
import { create } from 'zustand';
import { authManager, User, Server } from '../api/AuthManager';

interface AuthState {
  user: User | null;
  server: Server | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (serverUrl: string, username: string, password: string) => Promise<void>;
  loginWithToken: (serverUrl: string, token: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
  setServer: (server: Server) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  server: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (serverUrl: string, username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authManager.login(serverUrl, username, password);

      set({
        user: response.user,
        server: response.server,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  loginWithToken: async (serverUrl: string, token: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authManager.loginWithToken(serverUrl, token);

      set({
        user: response.user,
        server: response.server,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authManager.logout();
      set({
        user: null,
        server: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Clear state even on error
      set({
        user: null,
        server: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authManager.isAuthenticated();
      if (isAuth) {
        const user = await authManager.getCurrentUser();
        const server = await authManager.getCurrentServer();
        set({
          user,
          server,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  setServer: (server) => set({ server }),
}));

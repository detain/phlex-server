// src/api/AuthManager.ts
import apiClient from './client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
  server: Server;
}

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

export interface Server {
  id: string;
  name: string;
  url: string;
  version: string;
}

class AuthManager {
  // Server discovery using broadcast
  async discoverServers(): Promise<Server[]> {
    // Use UDP broadcast on local network
    // Implementation via native module for UDP socket
    // For now, return empty array - would need native module
    return [];
  }

  // Login with username/password
  async login(serverUrl: string, username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${serverUrl}/auth/login`, {
      username,
      password,
    });

    await this.saveCredentials(response);
    return response;
  }

  // Login with device name (for auto-login)
  async loginWithDevice(serverUrl: string, deviceName: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${serverUrl}/auth/device`, {
      device_name: deviceName,
    });

    await this.saveCredentials(response);
    return response;
  }

  // Manual token authentication
  async loginWithToken(serverUrl: string, token: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(`${serverUrl}/auth/token`, {
      token,
    });

    await this.saveCredentials(response);
    return response;
  }

  private async saveCredentials(data: LoginResponse): Promise<void> {
    await AsyncStorage.setItem('access_token', data.access_token);
    await AsyncStorage.setItem('refresh_token', data.refresh_token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('server', JSON.stringify(data.server));
  }

  // Logout
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      await AsyncStorage.multiRemove([
        'access_token',
        'refresh_token',
        'user',
        'server',
      ]);
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('access_token');
    return !!token;
  }

  // Get current user
  async getCurrentUser(): Promise<User | null> {
    const userData = await AsyncStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  // Get current server
  async getCurrentServer(): Promise<Server | null> {
    const serverData = await AsyncStorage.getItem('server');
    return serverData ? JSON.parse(serverData) : null;
  }
}

export const authManager = new AuthManager();
export default authManager;

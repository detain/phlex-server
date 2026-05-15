// src/services/SecureStorage.ts
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVICE_NAME = 'com.phlex.mobile';
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class SecureStorage {
  // Store tokens securely
  async storeTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      // Store refresh token in Keychain (more secure)
      await Keychain.setGenericPassword(
        ACCESS_TOKEN_KEY,
        refreshToken,
        { service: `${SERVICE_NAME}.refresh` }
      );

      // Store access token in AsyncStorage (for quick access)
      // In production, consider storing access token in Keychain too
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw error;
    }
  }

  // Retrieve access token
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  // Retrieve refresh token
  async getRefreshToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}.refresh`,
      });
      return credentials ? credentials.password : null;
    } catch {
      return null;
    }
  }

  // Clear all tokens
  async clearTokens(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: `${SERVICE_NAME}.refresh` });
      await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  // Biometric authentication
  async enableBiometric(): Promise<boolean> {
    try {
      const result = await Keychain.setGenericPassword(
        'biometric_enabled',
        'true',
        {
          service: `${SERVICE_NAME}.biometric`,
          accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        }
      );
      return !!result;
    } catch {
      return false;
    }
  }

  async isBiometricEnabled(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}.biometric`,
      });
      return !!credentials;
    } catch {
      return false;
    }
  }

  async authenticateWithBiometric(): Promise<boolean> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: `${SERVICE_NAME}.refresh`,
        authenticationPrompt: {
          title: 'Authenticate to access Phlex',
          subtitle: 'Use biometric authentication',
          cancel: 'Cancel',
        },
      });
      return !!credentials;
    } catch {
      return false;
    }
  }
}

export const secureStorage = new SecureStorage();
export default secureStorage;

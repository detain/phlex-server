// src/stores/useSettingsStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Playback settings
  defaultQuality: string;
  autoplay: boolean;
  autoPlayNextEpisode: boolean;
  defaultSubtitleLanguage: string;
  defaultAudioLanguage: string;

  // Download settings
  downloadQuality: string;
  downloadOverWifiOnly: boolean;
  maxConcurrentDownloads: number;
  downloadPath: string;

  // App settings
  theme: 'dark' | 'light' | 'system';
  showAdultContent: boolean;
  enableNotifications: boolean;
  enableBiometricAuth: boolean;

  // Server settings
  serverUrl: string;
  serverName: string;

  // Actions
  setDefaultQuality: (quality: string) => void;
  setAutoplay: (autoplay: boolean) => void;
  setAutoPlayNextEpisode: (autoplay: boolean) => void;
  setDefaultSubtitleLanguage: (language: string) => void;
  setDefaultAudioLanguage: (language: string) => void;
  setDownloadQuality: (quality: string) => void;
  setDownloadOverWifiOnly: (wifiOnly: boolean) => void;
  setMaxConcurrentDownloads: (max: number) => void;
  setDownloadPath: (path: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  setShowAdultContent: (show: boolean) => void;
  setEnableNotifications: (enable: boolean) => void;
  setEnableBiometricAuth: (enable: boolean) => void;
  setServerUrl: (url: string) => void;
  setServerName: (name: string) => void;
  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetSettings: () => void;
}

const SETTINGS_KEY = 'phlex_settings';

const defaultSettings = {
  defaultQuality: 'auto',
  autoplay: true,
  autoPlayNextEpisode: true,
  defaultSubtitleLanguage: 'en',
  defaultAudioLanguage: 'en',
  downloadQuality: 'high',
  downloadOverWifiOnly: true,
  maxConcurrentDownloads: 2,
  downloadPath: '',
  theme: 'dark' as const,
  showAdultContent: false,
  enableNotifications: true,
  enableBiometricAuth: false,
  serverUrl: '',
  serverName: '',
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,

  setDefaultQuality: (quality) => {
    set({ defaultQuality: quality });
    get().saveSettings();
  },
  setAutoplay: (autoplay) => {
    set({ autoplay });
    get().saveSettings();
  },
  setAutoPlayNextEpisode: (autoplay) => {
    set({ autoPlayNextEpisode: autoplay });
    get().saveSettings();
  },
  setDefaultSubtitleLanguage: (language) => {
    set({ defaultSubtitleLanguage: language });
    get().saveSettings();
  },
  setDefaultAudioLanguage: (language) => {
    set({ defaultAudioLanguage: language });
    get().saveSettings();
  },
  setDownloadQuality: (quality) => {
    set({ downloadQuality: quality });
    get().saveSettings();
  },
  setDownloadOverWifiOnly: (wifiOnly) => {
    set({ downloadOverWifiOnly: wifiOnly });
    get().saveSettings();
  },
  setMaxConcurrentDownloads: (max) => {
    set({ maxConcurrentDownloads: max });
    get().saveSettings();
  },
  setDownloadPath: (path) => {
    set({ downloadPath: path });
    get().saveSettings();
  },
  setTheme: (theme) => {
    set({ theme });
    get().saveSettings();
  },
  setShowAdultContent: (show) => {
    set({ showAdultContent: show });
    get().saveSettings();
  },
  setEnableNotifications: (enable) => {
    set({ enableNotifications: enable });
    get().saveSettings();
  },
  setEnableBiometricAuth: (enable) => {
    set({ enableBiometricAuth: enable });
    get().saveSettings();
  },
  setServerUrl: (url) => {
    set({ serverUrl: url });
    get().saveSettings();
  },
  setServerName: (name) => {
    set({ serverName: name });
    get().saveSettings();
  },

  loadSettings: async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        set({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  },

  saveSettings: async () => {
    try {
      const state = get();
      const settings = {
        defaultQuality: state.defaultQuality,
        autoplay: state.autoplay,
        autoPlayNextEpisode: state.autoPlayNextEpisode,
        defaultSubtitleLanguage: state.defaultSubtitleLanguage,
        defaultAudioLanguage: state.defaultAudioLanguage,
        downloadQuality: state.downloadQuality,
        downloadOverWifiOnly: state.downloadOverWifiOnly,
        maxConcurrentDownloads: state.maxConcurrentDownloads,
        downloadPath: state.downloadPath,
        theme: state.theme,
        showAdultContent: state.showAdultContent,
        enableNotifications: state.enableNotifications,
        enableBiometricAuth: state.enableBiometricAuth,
        serverUrl: state.serverUrl,
        serverName: state.serverName,
      };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  },

  resetSettings: () => {
    set(defaultSettings);
    AsyncStorage.removeItem(SETTINGS_KEY);
  },
}));

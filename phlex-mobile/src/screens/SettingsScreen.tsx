// src/screens/SettingsScreen.tsx
import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeContainer } from '../components/layout';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';

const SettingsScreen: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const server = useAuthStore((state) => state.server);
  const logout = useAuthStore((state) => state.logout);

  const {
    autoplay,
    setAutoplay,
    autoPlayNextEpisode,
    setAutoPlayNextEpisode,
    downloadOverWifiOnly,
    setDownloadOverWifiOnly,
    enableNotifications,
    setEnableNotifications,
    enableBiometricAuth,
    setEnableBiometricAuth,
    theme,
    setTheme,
  } = useSettingsStore();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const renderSettingRow = (
    label: string,
    value: React.ReactNode,
    onPress?: () => void
  ) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text style={styles.settingLabel}>{label}</Text>
      {value}
    </TouchableOpacity>
  );

  return (
    <SafeContainer>
      <ScrollView style={styles.scrollView}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.accountInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.display_name?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.displayName}>{user?.display_name || 'User'}</Text>
                <Text style={styles.username}>@{user?.username || 'unknown'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Playback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Playback</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Autoplay',
              <Switch
                value={autoplay}
                onValueChange={setAutoplay}
                trackColor={{ false: '#3d3d3d', true: '#0066cc' }}
              />
            )}
            {renderSettingRow(
              'Auto-play next episode',
              <Switch
                value={autoPlayNextEpisode}
                onValueChange={setAutoPlayNextEpisode}
                trackColor={{ false: '#3d3d3d', true: '#0066cc' }}
              />
            )}
          </View>
        </View>

        {/* Download Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Downloads</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Download over Wi-Fi only',
              <Switch
                value={downloadOverWifiOnly}
                onValueChange={setDownloadOverWifiOnly}
                trackColor={{ false: '#3d3d3d', true: '#0066cc' }}
              />
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.card}>
            {renderSettingRow(
              'Push notifications',
              <Switch
                value={enableNotifications}
                onValueChange={setEnableNotifications}
                trackColor={{ false: '#3d3d3d', true: '#0066cc' }}
              />
            )}
            {renderSettingRow(
              'Biometric authentication',
              <Switch
                value={enableBiometricAuth}
                onValueChange={setEnableBiometricAuth}
                trackColor={{ false: '#3d3d3d', true: '#0066cc' }}
              />
            )}
          </View>
        </View>

        {/* Server Section */}
        {server && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Server</Text>
            <View style={styles.card}>
              <View style={styles.serverInfo}>
                <Text style={styles.serverName}>{server.name}</Text>
                <Text style={styles.serverUrl}>{server.url}</Text>
                <Text style={styles.serverVersion}>Version {server.version}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>Phlex Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2d44',
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
  accountDetails: {
    flex: 1,
  },
  displayName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  username: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  serverInfo: {
    padding: 16,
  },
  serverName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  serverUrl: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  serverVersion: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  appName: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  appVersion: {
    color: '#444',
    fontSize: 12,
    marginTop: 4,
  },
});

export default SettingsScreen;

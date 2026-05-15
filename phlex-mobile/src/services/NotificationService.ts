// src/services/NotificationService.ts
import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';

class NotificationService {
  constructor() {
    this.configure();
  }

  private configure() {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('Push Notification Token:', token);
        // Send token to server
        this.registerTokenWithServer(token.token);
      }.bind(this),

      onNotification: function (notification) {
        console.log('Notification Received:', notification);

        // Handle notification based on type
        const { type, data } = notification.data;

        switch (type) {
          case 'library_update':
            this.handleLibraryUpdate(data);
            break;
          case 'new_content':
            this.handleNewContent(data);
            break;
          case 'sync_complete':
            this.handleSyncComplete(data);
            break;
          default:
            console.log('Unknown notification type:', type);
        }
      }.bind(this),

      onAction: function (notification) {
        console.log('Notification Action:', notification.action);
        // Handle notification action
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'phlex-general',
          channelName: 'General',
          channelDescription: 'General notifications',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (created) => console.log(`Channel created: ${created}`)
      );

      PushNotification.createChannel(
        {
          channelId: 'phlex-playback',
          channelName: 'Playback',
          channelDescription: 'Media playback notifications',
          importance: Importance.LOW,
          playSound: false,
          vibrate: false,
        },
        (created) => console.log(`Playback channel created: ${created}`)
      );
    }
  }

  private async registerTokenWithServer(token: string): Promise<void> {
    try {
      await apiClient.post('/users/push-token', { token });
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    return new Promise((resolve) => {
      PushNotification.requestPermissions().then((permissions) => {
        resolve(permissions.alert);
      });
    });
  }

  // Local notification
  showLocalNotification(notification: {
    title: string;
    message: string;
    type?: string;
    data?: any;
  }) {
    PushNotification.localNotification({
      title: notification.title,
      message: notification.message,
      userInfo: {
        type: notification.type,
        ...notification.data,
      },
      channelId: 'phlex-general',
      importance: 'high',
      priority: 'high',
    });
  }

  // Playback notification (Android)
  showPlaybackNotification(title: string, isPlaying: boolean) {
    PushNotification.localNotification({
      title: title,
      message: isPlaying ? 'Now Playing' : 'Paused',
      channelId: 'phlex-playback',
      importance: 'low',
      priority: 'low',
      ongoing: true,
      autoCancel: false,
      playSound: false,
      vibrate: false,
    });
  }

  // Cancel playback notification
  cancelPlaybackNotification() {
    PushNotification.cancelLocalNotification('phlex-playback');
  }

  // Handle library update notification
  private handleLibraryUpdate(data: any): void {
    // Navigate to library or refresh content
    console.log('Library updated:', data);
  }

  // Handle new content notification
  private handleNewContent(data: any): void {
    // Navigate to new content
    console.log('New content available:', data);
  }

  // Handle sync complete notification
  private handleSyncComplete(data: any): void {
    console.log('Sync complete:', data);
  }

  // Badges
  setBadgeCount(count: number) {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  // Cancel all notifications
  cancelAll() {
    PushNotification.cancelAllLocalNotifications();
  }
}

export const notificationService = new NotificationService();
export default notificationService;

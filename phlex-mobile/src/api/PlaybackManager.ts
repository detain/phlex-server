// src/api/PlaybackManager.ts
import apiClient from './client';
import {
  StreamInfo,
  DeviceProfile,
  PlaybackInfo,
  PlaybackProgress,
  PlaybackSession,
} from '../types/playback';

class PlaybackManager {
  // Get playback info for item
  async getPlaybackInfo(
    itemId: string,
    deviceProfile: DeviceProfile
  ): Promise<PlaybackInfo> {
    return apiClient.post<PlaybackInfo>(`/media/${itemId}/playback`, {
      device_profile: deviceProfile,
    });
  }

  // Get stream URL
  async getStreamUrl(
    itemId: string,
    options: {
      media_source_id?: string;
      stream_id?: string;
      quality?: string;
      subtitle_method?: 'embed' | 'burn' | 'hls';
      audio_method?: 'embed' | 'transcode';
    } = {}
  ): Promise<StreamInfo> {
    return apiClient.post<StreamInfo>(`/media/${itemId}/stream`, options);
  }

  // Report playback progress
  async reportProgress(
    sessionId: string,
    progress: PlaybackProgress
  ): Promise<void> {
    await apiClient.post(`/sessions/${sessionId}/progress`, progress);
  }

  // Report playback stopped
  async reportStopped(sessionId: string): Promise<void> {
    await apiClient.post(`/sessions/${sessionId}/stopped`);
  }

  // Report playback started
  async reportStarted(sessionId: string, itemId: string): Promise<void> {
    await apiClient.post(`/sessions/${sessionId}/started`, { item_id: itemId });
  }

  // Mark as watched
  async markAsWatched(itemId: string): Promise<void> {
    await apiClient.post(`/media/${itemId}/watched`);
  }

  // Mark as unwatched
  async markAsUnwatched(itemId: string): Promise<void> {
    await apiClient.post(`/media/${itemId}/unwatched`);
  }

  // Get playback session
  async getSession(sessionId: string): Promise<PlaybackSession> {
    return apiClient.get<PlaybackSession>(`/sessions/${sessionId}`);
  }
}

export const playbackManager = new PlaybackManager();
export default playbackManager;

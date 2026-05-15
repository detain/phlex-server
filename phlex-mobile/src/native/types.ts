// src/native/types.ts
import { NativeModule } from 'react-native';

export interface PlaybackEvent {
  event: 'ready' | 'play' | 'pause' | 'ended' | 'buffering';
  currentTime?: number;
  duration?: number;
}

export interface DownloadEvent {
  taskId: string;
  status: 'progress' | 'completed' | 'failed' | 'paused';
  progress?: number;
  downloadedBytes?: number;
  totalBytes?: number;
  error?: string;
}

export interface PhlexPlayerInterface extends NativeModule {
  play(): void;
  pause(): void;
  seekTo(position: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  getCurrentPosition(callback: (position: number) => void): void;
  getDuration(callback: (duration: number) => void): void;
}

export interface PhlexDownloaderInterface extends NativeModule {
  startDownload(taskId: string, url: string, localPath: string): void;
  pauseDownload(taskId: string): void;
  resumeDownload(taskId: string): void;
  cancelDownload(taskId: string): void;
  getDownloadProgress(taskId: string, callback: (progress: number) => void): void;
}

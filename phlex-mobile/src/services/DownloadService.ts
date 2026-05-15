// src/services/DownloadService.ts
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MediaItem } from '../types/media';
import { playbackManager } from '../api/PlaybackManager';

interface DownloadTask {
  id: string;
  itemId: string;
  item: MediaItem;
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  localPath: string;
  createdAt: number;
  completedAt?: number;
}

const DOWNLOADS_KEY = 'phlex_downloads';

class DownloadService {
  private downloads: Map<string, DownloadTask> = new Map();
  private listeners: Set<(task: DownloadTask) => void> = new Set();

  constructor() {
    this.loadDownloads();
  }

  // Load downloads from storage
  private async loadDownloads(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(DOWNLOADS_KEY);
      if (data) {
        const parsed = JSON.parse(data) as DownloadTask[];
        parsed.forEach((task) => {
          this.downloads.set(task.id, task);
        });
      }
    } catch (error) {
      console.error('Failed to load downloads:', error);
    }
  }

  // Save downloads to storage
  private async saveDownloads(): Promise<void> {
    try {
      const data = Array.from(this.downloads.values());
      await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save downloads:', error);
    }
  }

  // Subscribe to download updates
  subscribe(callback: (task: DownloadTask) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify listeners
  private notifyListeners(task: DownloadTask): void {
    this.listeners.forEach((listener) => listener(task));
  }

  // Start download
  async startDownload(item: MediaItem): Promise<string> {
    const taskId = `download_${item.id}_${Date.now()}`;

    // Get stream info for download
    const streamInfo = await playbackManager.getStreamUrl(item.id, {
      quality: 'original',
    });

    const task: DownloadTask = {
      id: taskId,
      itemId: item.id,
      item,
      status: 'pending',
      progress: 0,
      downloadedBytes: 0,
      totalBytes: streamInfo.size || 0,
      localPath: this.getLocalPath(item),
      createdAt: Date.now(),
    };

    this.downloads.set(taskId, task);
    await this.saveDownloads();
    this.notifyListeners(task);

    // Start native download
    const PhlexDownloader = NativeModules.PhlexDownloader;
    if (PhlexDownloader) {
      PhlexDownloader.startDownload(taskId, streamInfo.url, task.localPath);
    } else {
      // Simulate download for development
      task.status = 'downloading';
      this.simulateDownload(taskId);
    }

    return taskId;
  }

  // Simulate download for development
  private simulateDownload(taskId: string): void {
    const interval = setInterval(() => {
      const task = this.downloads.get(taskId);
      if (!task || task.status !== 'downloading') {
        clearInterval(interval);
        return;
      }

      task.progress = Math.min(1, task.progress + 0.1);
      task.downloadedBytes = Math.floor(task.totalBytes * task.progress);

      if (task.progress >= 1) {
        task.status = 'completed';
        task.completedAt = Date.now();
        clearInterval(interval);
      }

      this.downloads.set(taskId, task);
      this.saveDownloads();
      this.notifyListeners(task);
    }, 500);
  }

  // Pause download
  async pauseDownload(taskId: string): Promise<void> {
    const task = this.downloads.get(taskId);
    if (task && task.status === 'downloading') {
      const PhlexDownloader = NativeModules.PhlexDownloader;
      if (PhlexDownloader) {
        PhlexDownloader.pauseDownload(taskId);
      }
      task.status = 'paused';
      this.downloads.set(taskId, task);
      await this.saveDownloads();
      this.notifyListeners(task);
    }
  }

  // Resume download
  async resumeDownload(taskId: string): Promise<void> {
    const task = this.downloads.get(taskId);
    if (task && task.status === 'paused') {
      const PhlexDownloader = NativeModules.PhlexDownloader;
      if (PhlexDownloader) {
        PhlexDownloader.resumeDownload(taskId);
      }
      task.status = 'downloading';
      this.downloads.set(taskId, task);
      await this.saveDownloads();
      this.notifyListeners(task);
      this.simulateDownload(taskId);
    }
  }

  // Cancel download
  async cancelDownload(taskId: string): Promise<void> {
    const task = this.downloads.get(taskId);
    if (task) {
      const PhlexDownloader = NativeModules.PhlexDownloader;
      if (PhlexDownloader) {
        PhlexDownloader.cancelDownload(taskId);
      }
      this.downloads.delete(taskId);
      await this.saveDownloads();
    }
  }

  // Get download progress
  getProgress(taskId: string): number {
    const task = this.downloads.get(taskId);
    if (!task || task.totalBytes === 0) return 0;
    return task.downloadedBytes / task.totalBytes;
  }

  // Get local file path for item
  private getLocalPath(item: MediaItem): string {
    const filename = `${item.id}_${item.name.replace(/[^a-z0-9]/gi, '_')}.mp4`;
    if (Platform.OS === 'ios') {
      return `${NativeModules.PhlexDownloader?.documentsPath || ''}/${filename}`;
    }
    return `/storage/emulated/0/Download/Phlex/${filename}`;
  }

  // Get all downloads
  getAllDownloads(): DownloadTask[] {
    return Array.from(this.downloads.values());
  }

  // Get completed downloads
  getCompletedDownloads(): DownloadTask[] {
    return Array.from(this.downloads.values()).filter(
      (task) => task.status === 'completed'
    );
  }

  // Get download by item ID
  getDownloadForItem(itemId: string): DownloadTask | undefined {
    return Array.from(this.downloads.values()).find(
      (task) => task.itemId === itemId && task.status === 'completed'
    );
  }

  // Handle download progress from native module
  handleProgress(taskId: string, downloadedBytes: number, totalBytes: number): void {
    const task = this.downloads.get(taskId);
    if (task) {
      task.downloadedBytes = downloadedBytes;
      task.totalBytes = totalBytes;
      task.progress = totalBytes > 0 ? downloadedBytes / totalBytes : 0;
      task.status = 'downloading';
      this.downloads.set(taskId, task);
      this.notifyListeners(task);
    }
  }

  // Handle download completion
  handleComplete(taskId: string): void {
    const task = this.downloads.get(taskId);
    if (task) {
      task.status = 'completed';
      task.progress = 1;
      task.completedAt = Date.now();
      this.downloads.set(taskId, task);
      this.saveDownloads();
      this.notifyListeners(task);
    }
  }

  // Handle download error
  handleError(taskId: string, error: string): void {
    const task = this.downloads.get(taskId);
    if (task) {
      task.status = 'failed';
      this.downloads.set(taskId, task);
      this.saveDownloads();
      this.notifyListeners(task);
    }
  }
}

export const downloadService = new DownloadService();
export default downloadService;

// src/api/LibraryManager.ts
import apiClient from './client';
import { MediaItem, Movie, Series, Season, Episode, Library } from '../types/media';

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface MediaMetadata {
  poster_url: string;
  backdrop_url: string;
  banner_url?: string;
  logo_url?: string;
  genres: string[];
  tags: string[];
  rating?: number;
  critic_rating?: number;
  year?: number;
  runtime_ticks: number;
  community_rating?: number;
}

class LibraryManager {
  // Get all libraries
  async getLibraries(): Promise<Library[]> {
    return apiClient.get<Library[]>('/libraries');
  }

  // Get library items
  async getLibraryItems(
    libraryId: string,
    options: {
      type?: 'movie' | 'series' | 'all';
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaginatedResponse<MediaItem>> {
    return apiClient.get<PaginatedResponse<MediaItem>>(
      `/libraries/${libraryId}/items`,
      options
    );
  }

  // Get recently added
  async getRecentlyAdded(limit: number = 20): Promise<MediaItem[]> {
    return apiClient.get<MediaItem[]>('/libraries/recently-added', { limit });
  }

  // Get continue watching
  async getContinueWatching(userId: string): Promise<MediaItem[]> {
    return apiClient.get<MediaItem[]>(`/users/${userId}/continue-watching`);
  }

  // Get media item details
  async getMediaItem(itemId: string): Promise<MediaItem> {
    return apiClient.get<MediaItem>(`/media/${itemId}`);
  }

  // Get series seasons
  async getSeasons(seriesId: string): Promise<Season[]> {
    return apiClient.get<Season[]>(`/series/${seriesId}/seasons`);
  }

  // Get season episodes
  async getEpisodes(seasonId: string): Promise<Episode[]> {
    return apiClient.get<Episode[]>(`/seasons/${seasonId}/episodes`);
  }

  // Search media
  async search(query: string, type?: 'movie' | 'series' | 'all'): Promise<MediaItem[]> {
    return apiClient.get<MediaItem[]>('/search', { query, type });
  }

  // Get metadata (posters, backdrop, etc.)
  async getMetadata(itemId: string): Promise<MediaMetadata> {
    return apiClient.get<MediaMetadata>(`/media/${itemId}/metadata`);
  }
}

export const libraryManager = new LibraryManager();
export default libraryManager;

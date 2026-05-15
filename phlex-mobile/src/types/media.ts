// src/types/media.ts
export interface MediaItem {
  id: string;
  name: string;
  type: 'movie' | 'series' | 'music' | 'photo';
  overview?: string;
  poster_url?: string;
  backdrop_url?: string;
  year?: number;
  official_rating?: string;
  run_time_ticks?: number;
  genres?: string[];
  user_data?: UserData;
}

export interface UserData {
  playback_position_ticks?: number;
  resume_position_ticks?: number;
  is_watched?: boolean;
  rating?: number;
  favorite?: boolean;
}

export interface Series extends MediaItem {
  type: 'series';
  series_name?: string;
}

export interface Season {
  id: string;
  series_id: string;
  name: string;
  overview?: string;
  poster_url?: string;
  season_number: number;
  episode_count: number;
}

export interface Episode {
  id: string;
  season_id: string;
  series_id: string;
  name: string;
  overview?: string;
  poster_url?: string;
  episode_number: number;
  season_number: number;
  run_time_ticks?: number;
  user_data?: UserData;
}

export interface Movie extends MediaItem {
  type: 'movie';
}

export interface Library {
  id: string;
  name: string;
  type: 'movie' | 'series' | 'music' | 'photo';
  display_order: number;
  artwork: {
    poster: string;
    backdrop: string;
  };
}

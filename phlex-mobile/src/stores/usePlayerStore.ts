// src/stores/usePlayerStore.ts
import { create } from 'zustand';
import { MediaItem } from '../types/media';
import { StreamInfo, SubtitleTrack, AudioTrack, PlaybackSession } from '../types/playback';

interface PlayerState {
  // Current playback
  currentItem: MediaItem | null;
  currentSession: PlaybackSession | null;
  streamInfo: StreamInfo | null;

  // Playback state
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;

  // Tracks
  subtitleTracks: SubtitleTrack[];
  currentSubtitleTrackId: string | null;
  audioTracks: AudioTrack[];
  currentAudioTrackId: string | null;

  // Quality
  currentQuality: string;

  // Error
  error: string | null;

  // Actions
  setCurrentItem: (item: MediaItem | null) => void;
  setStreamInfo: (info: StreamInfo | null) => void;
  setSession: (session: PlaybackSession | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (isMuted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setSubtitleTracks: (tracks: SubtitleTrack[]) => void;
  setCurrentSubtitleTrackId: (trackId: string | null) => void;
  setAudioTracks: (tracks: AudioTrack[]) => void;
  setCurrentAudioTrackId: (trackId: string | null) => void;
  setCurrentQuality: (quality: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentItem: null,
  currentSession: null,
  streamInfo: null,
  isPlaying: false,
  isBuffering: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  subtitleTracks: [],
  currentSubtitleTrackId: null,
  audioTracks: [],
  currentAudioTrackId: null,
  currentQuality: 'auto',
  error: null,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setCurrentItem: (item) => set({ currentItem: item }),
  setStreamInfo: (info) => set({ streamInfo: info }),
  setSession: (session) => set({ currentSession: session }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),
  setCurrentSubtitleTrackId: (trackId) => set({ currentSubtitleTrackId: trackId }),
  setAudioTracks: (tracks) => set({ audioTracks: tracks }),
  setCurrentAudioTrackId: (trackId) => set({ currentAudioTrackId: trackId }),
  setCurrentQuality: (quality) => set({ currentQuality: quality }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));

// src/stores/useLibraryStore.ts
import { create } from 'zustand';
import { MediaItem, Library } from '../types/media';

interface LibraryState {
  // Libraries
  libraries: Library[];
  libraryItems: Record<string, MediaItem[]>;

  // Home content
  recentlyAdded: MediaItem[];
  continueWatching: MediaItem[];

  // Search
  searchResults: MediaItem[];
  searchQuery: string;
  isSearching: boolean;

  // Loading states
  isLoadingLibraries: boolean;
  isLoadingItems: boolean;
  isLoadingHome: boolean;

  // Error
  error: string | null;

  // Actions
  setLibraries: (libraries: Library[]) => void;
  setLibraryItems: (libraryId: string, items: MediaItem[]) => void;
  setRecentlyAdded: (items: MediaItem[]) => void;
  setContinueWatching: (items: MediaItem[]) => void;
  setSearchResults: (results: MediaItem[]) => void;
  setSearchQuery: (query: string) => void;
  setIsSearching: (isSearching: boolean) => void;
  setLoadingLibraries: (loading: boolean) => void;
  setLoadingItems: (loading: boolean) => void;
  setLoadingHome: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearSearch: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  libraries: [],
  libraryItems: {},
  recentlyAdded: [],
  continueWatching: [],
  searchResults: [],
  searchQuery: '',
  isSearching: false,
  isLoadingLibraries: false,
  isLoadingItems: false,
  isLoadingHome: false,
  error: null,

  setLibraries: (libraries) => set({ libraries }),
  setLibraryItems: (libraryId, items) =>
    set((state) => ({
      libraryItems: { ...state.libraryItems, [libraryId]: items },
    })),
  setRecentlyAdded: (items) => set({ recentlyAdded: items }),
  setContinueWatching: (items) => set({ continueWatching: items }),
  setSearchResults: (results) => set({ searchResults: results }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setLoadingLibraries: (loading) => set({ isLoadingLibraries: loading }),
  setLoadingItems: (loading) => set({ isLoadingItems: loading }),
  setLoadingHome: (loading) => set({ isLoadingHome: loading }),
  setError: (error) => set({ error }),
  clearSearch: () => set({ searchResults: [], searchQuery: '' }),
}));

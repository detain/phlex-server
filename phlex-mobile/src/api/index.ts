// src/api/index.ts
export { default as apiClient } from './client';
export { default as authManager, type LoginResponse, type User, type Server } from './AuthManager';
export { default as libraryManager, type PaginatedResponse, type MediaMetadata } from './LibraryManager';
export { default as playbackManager } from './PlaybackManager';

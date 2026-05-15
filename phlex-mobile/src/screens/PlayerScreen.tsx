// src/screens/PlayerScreen.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { playbackManager } from '../api/PlaybackManager';
import { usePlayerStore } from '../stores/usePlayerStore';
import { StreamInfo, DeviceProfile, SubtitleTrack, AudioTrack } from '../types/playback';
import { PlayerControls } from '../components/player/PlayerControls';
import { SeekBar } from '../components/player/SeekBar';
import { ErrorView } from '../components/ui/ErrorView';
import { Platform } from 'react-native';

type PlayerRouteParams = {
  Player: {
    itemId: string;
    startPosition?: number;
  };
};

const PlayerScreen: React.FC = () => {
  const route = useRoute<RouteProp<PlayerRouteParams, 'Player'>>();
  const navigation = useNavigation();
  const { itemId, startPosition = 0 } = route.params;

  // Player state
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(startPosition);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  // Store actions
  const setPlayerStreamInfo = usePlayerStore((state) => state.setStreamInfo);
  const setSubtitleTracks = usePlayerStore((state) => state.setSubtitleTracks);
  const setAudioTracks = usePlayerStore((state) => state.setAudioTracks);
  const setCurrentSubtitleTrackId = usePlayerStore((state) => state.setCurrentSubtitleTrackId);
  const setCurrentAudioTrackId = usePlayerStore((state) => state.setCurrentAudioTrackId);
  const playerSetCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const playerSetDuration = usePlayerStore((state) => state.setDuration);
  const playerSetIsPlaying = usePlayerStore((state) => state.setIsPlaying);

  useEffect(() => {
    loadPlaybackInfo();
  }, [itemId]);

  useEffect(() => {
    if (showControls && isPlaying) {
      hideControlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 3000);
    }
    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [showControls, isPlaying]);

  const loadPlaybackInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const deviceProfile = getDeviceProfile();
      const info = await playbackManager.getPlaybackInfo(itemId, deviceProfile);

      setStreamInfo(info.stream_info);
      setSubtitleTracks(info.subtitle_tracks);
      setAudioTracks(info.audio_tracks);
      setDuration(info.stream_info.duration_seconds);

      setPlayerStreamInfo(info.stream_info);
      playerSetDuration(info.stream_info.duration_seconds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceProfile = (): DeviceProfile => {
    return {
      name: Platform.OS === 'ios' ? 'iPhone' : 'Android',
      platform: Platform.OS,
      version: Platform.Version.toString(),
      capabilities: {
        video_codecs: ['h264', 'h265', 'vp9'],
        audio_codecs: ['aac', 'ac3', 'eac3', 'flac', 'mp3'],
        max_resolution: 2160,
        max_bitrate: 50000000,
        supports_4k: true,
        supports_hdr: true,
        supports_dolby_vision: true,
        supports_dolby_atmos: true,
        supports_dts: true,
      },
    };
  };

  const showControlsTemporarily = () => {
    setShowControls(true);
    controlsOpacity.setValue(1);
  };

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      showControlsTemporarily();
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    playerSetIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
    playerSetIsPlaying(false);
  };

  const handleSeek = (position: number) => {
    setCurrentTime(position);
    playerSetCurrentTime(position);
    // Would call native player seek here
  };

  const handleSeekBackward = () => {
    const newPosition = Math.max(0, currentTime - 15);
    handleSeek(newPosition);
  };

  const handleSeekForward = () => {
    const newPosition = Math.min(duration, currentTime + 15);
    handleSeek(newPosition);
  };

  const handleProgress = (progress: { currentTime: number; duration: number }) => {
    setCurrentTime(progress.currentTime);
    setDuration(progress.duration);
    playerSetCurrentTime(progress.currentTime);
    playerSetDuration(progress.duration);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <ErrorView message={error} onRetry={loadPlaybackInfo} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Video Player Area */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={styles.playerWrapper}
      >
        <View style={styles.playerPlaceholder}>
          <Text style={styles.playerPlaceholderText}>
            Video Player{'\n'}(Native module required)
          </Text>
          <Text style={styles.streamUrlText}>
            {streamInfo?.url || 'No stream URL'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Overlay Controls */}
      {showControls && (
        <Animated.View style={[styles.controlsOverlay, { opacity: controlsOpacity }]}>
          <PlayerControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeekBackward={handleSeekBackward}
            onSeekForward={handleSeekForward}
            onClose={() => navigation.goBack()}
          />

          <View style={styles.bottomControls}>
            <SeekBar
              currentTime={currentTime}
              duration={duration}
              onSeek={handleSeek}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  playerWrapper: {
    flex: 1,
  },
  playerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  playerPlaceholderText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  streamUrlText: {
    color: '#444',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
});

export default PlayerScreen;

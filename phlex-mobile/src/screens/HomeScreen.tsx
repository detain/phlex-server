// src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { libraryManager } from '../api/LibraryManager';
import { MediaItem } from '../types/media';
import { useAuthStore } from '../stores/useAuthStore';
import { SafeContainer } from '../components/layout';
import { MediaList } from '../components/media/MediaList';
import { ContinueWatching } from '../components/media/ContinueWatching';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorView } from '../components/ui/ErrorView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const POSTER_WIDTH = (SCREEN_WIDTH - 60) / 3;
const POSTER_HEIGHT = POSTER_WIDTH * 1.5;

type HomeNavigationProp = NativeStackNavigationProp<any>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const user = useAuthStore((state) => state.user);

  const [recentlyAdded, setRecentlyAdded] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [libraries, setLibraries] = useState<any[]>([]);
  const [libraryItems, setLibraryItems] = useState<Record<string, MediaItem[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setError(null);
      const [recent, continueList, libs] = await Promise.all([
        libraryManager.getRecentlyAdded(20).catch(() => []),
        user ? libraryManager.getContinueWatching(user.id).catch(() => []) : Promise.resolve([]),
        libraryManager.getLibraries().catch(() => []),
      ]);

      setRecentlyAdded(recent);
      setContinueWatching(continueList);
      setLibraries(libs);

      // Load items for each library (first page)
      const itemsPromises = libs.slice(0, 3).map(async (lib) => {
        try {
          const items = await libraryManager.getLibraryItems(lib.id, { limit: 10 });
          return { [lib.id]: items.items };
        } catch {
          return { [lib.id]: [] };
        }
      });

      const itemsResults = await Promise.all(itemsPromises);
      const itemsMap = itemsResults.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setLibraryItems(itemsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load home data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHomeData();
    setIsRefreshing(false);
  };

  const handleMediaPress = (item: MediaItem) => {
    navigation.navigate('MediaDetail', { itemId: item.id });
  };

  const handlePlayPress = (item: MediaItem) => {
    navigation.navigate('Player', { itemId: item.id });
  };

  const handleContinueWatchingPress = (item: MediaItem) => {
    navigation.navigate('Player', {
      itemId: item.id,
      startPosition: item.user_data?.resume_position_ticks
        ? item.user_data.resume_position_ticks / 10000000
        : 0,
    });
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return <ErrorView message={error} onRetry={loadHomeData} />;
  }

  return (
    <SafeContainer>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.display_name || 'User'}</Text>
          <Text style={styles.subtitle}>What would you like to watch?</Text>
        </View>
        <TouchableOpacity
          style={styles.profilesButton}
          onPress={() => navigation.navigate('Profiles')}
        >
          <Text style={styles.profilesButtonText}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <ContinueWatching
            items={continueWatching}
            onItemPress={handleContinueWatchingPress}
            onItemPlay={handlePlayPress}
          />
        )}

        {/* Recently Added */}
        {recentlyAdded.length > 0 && (
          <MediaList
            title="Recently Added"
            items={recentlyAdded}
            onItemPress={handleMediaPress}
            cardWidth={POSTER_WIDTH}
            cardHeight={POSTER_HEIGHT}
          />
        )}

        {/* Library Rows */}
        {libraries.slice(0, 3).map((library) => (
          <MediaList
            key={library.id}
            title={library.name}
            items={libraryItems[library.id] || []}
            onItemPress={handleMediaPress}
            cardWidth={POSTER_WIDTH}
            cardHeight={POSTER_HEIGHT}
          />
        ))}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  profilesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilesButtonText: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  bottomPadding: {
    height: 100,
  },
});

export default HomeScreen;

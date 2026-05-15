// src/screens/MediaDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Image,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import { libraryManager } from '../api/LibraryManager';
import { MediaItem, Season, Episode } from '../types/media';
import { SafeContainer } from '../components/layout';
import { PosterCard } from '../components/media/PosterCard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorView } from '../components/ui/ErrorView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DetailRouteParams = {
  MediaDetail: { itemId: string };
};

type DetailNavigationProp = NativeStackNavigationProp<any>;

const MediaDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<DetailRouteParams, 'MediaDetail'>>();
  const navigation = useNavigation<DetailNavigationProp>();
  const { itemId } = route.params;

  const [item, setItem] = useState<MediaItem | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMediaDetails();
  }, [itemId]);

  useEffect(() => {
    if (selectedSeason) {
      loadEpisodes(selectedSeason.id);
    }
  }, [selectedSeason]);

  const loadMediaDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const mediaItem = await libraryManager.getMediaItem(itemId);
      setItem(mediaItem);

      if (mediaItem.type === 'series') {
        try {
          const seasonList = await libraryManager.getSeasons(itemId);
          setSeasons(seasonList);
          if (seasonList.length > 0) {
            setSelectedSeason(seasonList[0]);
          }
        } catch {
          // Seasons not available
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load media details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadEpisodes = async (seasonId: string) => {
    try {
      const episodeList = await libraryManager.getEpisodes(seasonId);
      setEpisodes(episodeList);
    } catch {
      setEpisodes([]);
    }
  };

  const handlePlay = () => {
    navigation.navigate('Player', { itemId, startPosition: 0 });
  };

  const handleResume = () => {
    const resumePosition = item?.user_data?.resume_position_ticks
      ? item.user_data.resume_position_ticks / 10000000
      : 0;
    navigation.navigate('Player', { itemId, startPosition: resumePosition });
  };

  const handleEpisodePress = (episode: Episode) => {
    navigation.navigate('Player', {
      itemId: episode.id,
      startPosition: episode.user_data?.resume_position_ticks
        ? episode.user_data.resume_position_ticks / 10000000
        : 0,
    });
  };

  const formatRuntime = (ticks: number): string => {
    const minutes = Math.floor(ticks / 600000000);
    return `${minutes} min`;
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error || !item) {
    return <ErrorView message={error || 'Media not found'} onRetry={loadMediaDetails} />;
  }

  const isSeries = item.type === 'series';
  const hasResumePosition = item.user_data?.resume_position_ticks > 0;
  const userRating = item.user_data?.rating;
  const backdropUri = item.backdrop_url || item.poster_url || 'https://via.placeholder.com/640x360';

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} bounces={false}>
        {/* Backdrop with Gradient */}
        <View style={styles.backdropContainer}>
          <Image
            source={{ uri: backdropUri }}
            style={styles.backdrop}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', '#0f0f1a']}
            style={styles.backdropGradient}
          />
        </View>

        {/* Poster and Info */}
        <View style={styles.infoContainer}>
          <PosterCard
            item={item}
            width={SCREEN_WIDTH * 0.35}
            height={SCREEN_WIDTH * 0.35 * 1.5}
            onPress={() => {}}
          />

          <View style={styles.infoContent}>
            <Text style={styles.title}>{item.name}</Text>

            <View style={styles.metaRow}>
              {item.year && <Text style={styles.year}>{item.year}</Text>}
              {item.official_rating && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.rating}>{item.official_rating}</Text>
                </>
              )}
              {item.run_time_ticks && (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.runtime}>{formatRuntime(item.run_time_ticks)}</Text>
                </>
              )}
            </View>

            {userRating && (
              <View style={styles.userRating}>
                <Text style={styles.userRatingText}>★ {userRating}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.playButton, styles.playButtonPrimary]}
              onPress={hasResumePosition ? handleResume : handlePlay}
            >
              <Text style={styles.playButtonIcon}>▶</Text>
              <Text style={styles.playButtonText}>
                {hasResumePosition ? 'Resume' : 'Play'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview */}
        {item.overview && (
          <View style={styles.section}>
            <Text style={styles.overview}>{item.overview}</Text>
          </View>
        )}

        {/* Genres */}
        {item.genres && item.genres.length > 0 && (
          <View style={styles.genres}>
            {item.genres.map((genre) => (
              <View key={genre} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Series Sections */}
        {isSeries && seasons.length > 0 && (
          <>
            <View style={styles.seasonSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {seasons.map((season) => (
                  <TouchableOpacity
                    key={season.id}
                    style={[
                      styles.seasonTab,
                      selectedSeason?.id === season.id && styles.seasonTabActive,
                    ]}
                    onPress={() => setSelectedSeason(season)}
                  >
                    <Text
                      style={[
                        styles.seasonTabText,
                        selectedSeason?.id === season.id && styles.seasonTabTextActive,
                      ]}
                    >
                      {season.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.episodesList}>
              {episodes.map((episode) => (
                <TouchableOpacity
                  key={episode.id}
                  style={styles.episodeCard}
                  onPress={() => handleEpisodePress(episode)}
                >
                  <View style={styles.episodeNumber}>
                    <Text style={styles.episodeNumberText}>{episode.episode_number}</Text>
                  </View>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeName} numberOfLines={1}>
                      {episode.name}
                    </Text>
                    {episode.run_time_ticks && (
                      <Text style={styles.episodeRuntime}>
                        {formatRuntime(episode.run_time_ticks)}
                      </Text>
                    )}
                    {episode.overview && (
                      <Text style={styles.episodeOverview} numberOfLines={2}>
                        {episode.overview}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollView: {
    flex: 1,
  },
  backdropContainer: {
    height: 300,
    position: 'relative',
  },
  backdrop: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  backdropGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -100,
    position: 'relative',
    zIndex: 1,
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  year: {
    color: '#aaa',
    fontSize: 14,
  },
  dot: {
    color: '#aaa',
    marginHorizontal: 6,
  },
  rating: {
    color: '#aaa',
    fontSize: 14,
  },
  runtime: {
    color: '#aaa',
    fontSize: 14,
  },
  userRating: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 15,
  },
  userRatingText: {
    color: '#ffc107',
    fontSize: 14,
    fontWeight: '600',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#2d2d44',
  },
  playButtonPrimary: {
    backgroundColor: '#0066cc',
  },
  playButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  overview: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 22,
  },
  genres: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginTop: 15,
    gap: 8,
  },
  genreTag: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  genreText: {
    color: '#aaa',
    fontSize: 12,
  },
  seasonSelector: {
    marginTop: 30,
    paddingLeft: 20,
  },
  seasonTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: '#2d2d44',
  },
  seasonTabActive: {
    backgroundColor: '#0066cc',
  },
  seasonTabText: {
    color: '#888',
    fontSize: 14,
  },
  seasonTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  episodesList: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  episodeCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  episodeNumber: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  episodeRuntime: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  episodeOverview: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 18,
  },
  bottomPadding: {
    height: 100,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
  },
});

export default MediaDetailScreen;

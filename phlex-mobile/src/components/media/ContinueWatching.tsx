// src/components/media/ContinueWatching.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MediaItem } from '../../types/media';

interface ContinueWatchingProps {
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  onItemPlay: (item: MediaItem) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = CARD_WIDTH * 0.56;

export const ContinueWatching: React.FC<ContinueWatchingProps> = ({
  items,
  onItemPress,
  onItemPlay,
}) => {
  const renderItem = ({ item }: { item: MediaItem }) => {
    const backdropUri = item.backdrop_url || item.poster_url || 'https://via.placeholder.com/640x360';
    const progress = item.user_data?.resume_position_ticks
      ? (item.user_data.resume_position_ticks / (item.run_time_ticks || 1)) * 100
      : 0;

    return (
      <TouchableOpacity
        style={[styles.card, { width: CARD_WIDTH }]}
        onPress={() => onItemPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: backdropUri }}
          style={[styles.backdrop, { width: CARD_WIDTH, height: CARD_HEIGHT }]}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.infoContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.progressText}>
              {Math.round(progress)}% watched
            </Text>
          </View>
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => onItemPlay(item)}
          >
            <Text style={styles.playButtonText}>▶</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Continue Watching</Text>
      </View>
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  listContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  card: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2d2d44',
  },
  backdrop: {
    borderRadius: 8,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  progressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
  },
});

export default ContinueWatching;

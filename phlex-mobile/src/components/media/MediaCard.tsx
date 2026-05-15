// src/components/media/MediaCard.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { MediaItem } from '../../types/media';

interface MediaCardProps {
  item: MediaItem;
  onPress: () => void;
  cardWidth?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MediaCard: React.FC<MediaCardProps> = ({
  item,
  onPress,
  cardWidth = (SCREEN_WIDTH - 48) / 2,
}) => {
  const cardHeight = cardWidth * 0.7;
  const posterUri = item.backdrop_url || item.poster_url || 'https://via.placeholder.com/400x225';

  return (
    <TouchableOpacity
      style={[styles.container, { width: cardWidth, height: cardHeight + 50 }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: posterUri }}
        style={[styles.backdrop, { width: cardWidth, height: cardHeight }]}
        resizeMode="cover"
      />
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
        {item.year && <Text style={styles.meta}>{item.year}</Text>}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
    marginBottom: 12,
  },
  backdrop: {
    borderRadius: 8,
    backgroundColor: '#2d2d44',
  },
  infoContainer: {
    marginTop: 8,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  meta: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
});

export default MediaCard;

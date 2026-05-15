// src/components/media/PosterCard.tsx
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

interface PosterCardProps {
  item: MediaItem;
  width: number;
  height: number;
  onPress: () => void;
  showTitle?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PosterCard: React.FC<PosterCardProps> = ({
  item,
  width,
  height,
  onPress,
  showTitle = true,
}) => {
  const posterUri = item.poster_url || 'https://via.placeholder.com/300x450';

  return (
    <TouchableOpacity
      style={[styles.container, { width, height: showTitle ? height + 30 : height }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: posterUri }}
        style={[styles.poster, { width, height }]}
        resizeMode="cover"
      />
      {showTitle && (
        <Text style={styles.title} numberOfLines={2}>
          {item.name}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  poster: {
    borderRadius: 8,
    backgroundColor: '#2d2d44',
  },
  title: {
    color: '#fff',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
});

export default PosterCard;

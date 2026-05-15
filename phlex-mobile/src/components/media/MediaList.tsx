// src/components/media/MediaList.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { MediaItem } from '../../types/media';
import PosterCard from './PosterCard';

interface MediaListProps {
  title: string;
  items: MediaItem[];
  onItemPress: (item: MediaItem) => void;
  cardWidth?: number;
  cardHeight?: number;
  showViewAll?: boolean;
  onViewAllPress?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const MediaList: React.FC<MediaListProps> = ({
  title,
  items,
  onItemPress,
  cardWidth = (SCREEN_WIDTH - 60) / 3,
  cardHeight = cardWidth * 1.5,
  showViewAll = false,
  onViewAllPress,
}) => {
  const renderItem = ({ item }: { item: MediaItem }) => (
    <PosterCard
      item={item}
      width={cardWidth}
      height={cardHeight}
      onPress={() => onItemPress(item)}
      showTitle={true}
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {showViewAll && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        )}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  viewAllText: {
    color: '#0066cc',
    fontSize: 14,
  },
  listContent: {
    paddingLeft: 20,
    paddingRight: 8,
  },
});

export default MediaList;

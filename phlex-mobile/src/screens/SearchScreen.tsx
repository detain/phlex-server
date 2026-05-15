// src/screens/SearchScreen.tsx
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { libraryManager } from '../api/LibraryManager';
import { MediaItem } from '../types/media';
import { SafeContainer } from '../components/layout';
import { SearchBar } from '../components/ui/SearchBar';
import { MediaCard } from '../components/media/MediaCard';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

type SearchNavigationProp = NativeStackNavigationProp<any>;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchNavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      setHasSearched(true);
      const searchResults = await libraryManager.search(searchQuery);
      setResults(searchResults);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleChangeText = (text: string) => {
    setSearchQuery(text);
    // Debounce search could be added here
  };

  const handleClear = () => {
    setSearchQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const handleMediaPress = (item: MediaItem) => {
    navigation.navigate('MediaDetail', { itemId: item.id });
  };

  const renderItem = ({ item }: { item: MediaItem }) => (
    <MediaCard item={item} onPress={() => handleMediaPress(item)} />
  );

  return (
    <SafeContainer>
      <SearchBar
        value={searchQuery}
        onChangeText={handleChangeText}
        placeholder="Search movies, shows..."
        onSubmit={handleSearch}
        onClear={handleClear}
      />

      {isSearching ? (
        <LoadingSpinner />
      ) : hasSearched && results.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Results"
          message={`No results found for "${searchQuery}"`}
        />
      ) : hasSearched ? (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Search for movies, TV shows, and more
          </Text>
        </View>
      )}
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default SearchScreen;

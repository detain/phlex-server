// src/screens/DownloadsScreen.tsx
import React from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeContainer } from '../components/layout';
import { EmptyState } from '../components/ui/EmptyState';

interface DownloadItem {
  id: string;
  name: string;
  progress: number;
  status: 'downloading' | 'paused' | 'completed' | 'failed';
  size?: string;
}

const MOCK_DOWNLOADS: DownloadItem[] = [];

const DownloadsScreen: React.FC = () => {
  const [downloads, setDownloads] = React.useState<DownloadItem[]>(MOCK_DOWNLOADS);

  const handleCancelDownload = (item: DownloadItem) => {
    Alert.alert(
      'Cancel Download',
      `Are you sure you want to cancel downloading "${item.name}"?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            setDownloads((prev) => prev.filter((d) => d.id !== item.id));
          },
        },
      ]
    );
  };

  const renderDownloadItem = ({ item }: { item: DownloadItem }) => (
    <View style={styles.downloadItem}>
      <View style={styles.downloadInfo}>
        <Text style={styles.downloadName} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.statusRow}>
          {item.status === 'downloading' && (
            <>
              <Text style={styles.progressText}>{Math.round(item.progress * 100)}%</Text>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${item.progress * 100}%` }]}
                />
              </View>
            </>
          )}
          {item.status === 'paused' && (
            <Text style={styles.statusText}>Paused</Text>
          )}
          {item.status === 'completed' && (
            <Text style={styles.completedText}>Completed</Text>
          )}
          {item.status === 'failed' && (
            <Text style={styles.failedText}>Failed</Text>
          )}
        </View>
      </View>
      {item.status !== 'completed' && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => handleCancelDownload(item)}
        >
          <Text style={styles.cancelButtonText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeContainer>
      {downloads.length === 0 ? (
        <EmptyState
          icon="⬇️"
          title="No Downloads"
          message="Download movies and shows to watch offline"
        />
      ) : (
        <FlatList
          data={downloads}
          renderItem={renderDownloadItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    padding: 20,
  },
  downloadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  downloadInfo: {
    flex: 1,
  },
  downloadName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#3d3d3d',
    borderRadius: 2,
    marginLeft: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0066cc',
    borderRadius: 2,
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    minWidth: 40,
  },
  statusText: {
    color: '#ffc107',
    fontSize: 12,
  },
  completedText: {
    color: '#28a745',
    fontSize: 12,
  },
  failedText: {
    color: '#dc3545',
    fontSize: 12,
  },
  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2d2d44',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  cancelButtonText: {
    color: '#888',
    fontSize: 14,
  },
});

export default DownloadsScreen;

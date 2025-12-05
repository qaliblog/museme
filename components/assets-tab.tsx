import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import { assetsApi, uploadApi } from '../services/api';
import { formatFileSize } from '../lib/utils';

interface Asset {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export function AssetsTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await assetsApi.getAll();
      setAssets(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.audio,
          DocumentPicker.types.zip,
          'application/zip',
        ],
        allowMultiSelection: true,
      });

      setUploading(true);
      for (const file of result) {
        try {
          if (file.uri) {
            await uploadApi.upload(file.uri, file.name || 'unknown');
            Alert.alert('Success', `${file.name} uploaded successfully`);
          }
        } catch (error: any) {
          Alert.alert('Upload Failed', error.message);
        }
      }
      setUploading(false);
      fetchAssets();
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled
      } else {
        Alert.alert('Error', 'Failed to pick document');
      }
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Upload Music Packs</Text>
        <Text style={styles.cardDescription}>
          Upload ZIP archives or individual audio files
        </Text>
        <TouchableOpacity
          style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]}
          onPress={pickDocument}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.uploadButtonText}>Select Files</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.uploadHint}>
          Supports: WAV, MP3, AIFF, FLAC, OGG, M4A, AAC, ZIP
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Uploaded Assets</Text>
        <Text style={styles.cardDescription}>
          {assets.length} file{assets.length !== 1 ? 's' : ''} uploaded
        </Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : assets.length === 0 ? (
          <Text style={styles.emptyText}>No assets uploaded yet</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Filename</Text>
              <Text style={styles.tableHeaderText}>Type</Text>
              <Text style={styles.tableHeaderText}>Size</Text>
              <Text style={styles.tableHeaderText}>Category</Text>
            </View>
            {assets.map((asset) => (
              <View key={asset.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.filenameCell]}>
                  {asset.filename}
                </Text>
                <Text style={styles.tableCell}>
                  {asset.file_type.toUpperCase()}
                </Text>
                <Text style={styles.tableCell}>
                  {formatFileSize(asset.file_size)}
                </Text>
                <Text style={styles.tableCell}>
                  {asset.category || '—'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  uploadHint: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#8E8E93',
    padding: 32,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tableHeaderText: {
    flex: 1,
    fontWeight: '600',
    fontSize: 12,
    color: '#8E8E93',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  filenameCell: {
    fontWeight: '500',
  },
});

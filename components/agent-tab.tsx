import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { assetsApi, analyzeApi } from '../services/api';

interface Asset {
  id: string;
  filename: string;
  file_type: string;
  description?: string;
  category?: string;
  tags?: string[];
  analyzed: boolean;
}

export function AgentTab() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await assetsApi.getAll();
      setAssets(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const analyzeAll = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeApi.analyzeAll();
      Alert.alert(
        'Analysis Complete',
        `Analyzed ${result.count} file(s)`
      );
      fetchAssets();
    } catch (error: any) {
      Alert.alert('Analysis Failed', error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const unanalyzedCount = assets.filter((a) => !a.analyzed).length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>File Descriptor Agent</Text>
            <Text style={styles.cardDescription}>
              AI-powered analysis of your uploaded sounds
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.button,
              (analyzing || unanalyzedCount === 0) && styles.buttonDisabled,
            ]}
            onPress={analyzeAll}
            disabled={analyzing || unanalyzedCount === 0}
          >
            {analyzing ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>
                Analyze All ({unanalyzedCount} unanalyzed)
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Analysis Results</Text>
        <Text style={styles.cardDescription}>
          {assets.length} file{assets.length !== 1 ? 's' : ''} in library
        </Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : assets.length === 0 ? (
          <Text style={styles.emptyText}>
            No assets to analyze. Upload files in the Assets tab first.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>
                Filename
              </Text>
              <Text style={[styles.tableHeaderText, { flex: 3 }]}>
                Description
              </Text>
              <Text style={styles.tableHeaderText}>Category</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
            </View>
            {assets.map((asset) => (
              <View key={asset.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {asset.filename}
                </Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>
                  {asset.description || (
                    <Text style={styles.mutedText}>Not analyzed</Text>
                  )}
                </Text>
                <View style={styles.tableCell}>
                  {asset.category ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{asset.category}</Text>
                    </View>
                  ) : (
                    <Text style={styles.mutedText}>—</Text>
                  )}
                </View>
                <View style={styles.tableCell}>
                  <View
                    style={[
                      styles.badge,
                      asset.analyzed ? styles.badgeActive : styles.badgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        asset.analyzed && styles.badgeTextActive,
                      ]}
                    >
                      {asset.analyzed ? 'Analyzed' : 'Pending'}
                    </Text>
                  </View>
                </View>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 12,
    color: '#000000',
    justifyContent: 'center',
  },
  mutedText: {
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeActive: {
    backgroundColor: '#007AFF',
  },
  badgePending: {
    backgroundColor: '#F2F2F7',
  },
  badgeText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '500',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
});

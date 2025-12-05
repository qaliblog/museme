import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { keysApi } from '../services/api';

interface ApiKey {
  id: string;
  key_value: string;
  is_active: boolean;
  last_used_at?: string;
  usage_count: number;
  error_count: number;
}

export function SettingsTab() {
  const [newKey, setNewKey] = useState('');
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const data = await keysApi.getAll();
      setKeys(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch keys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const addKey = async () => {
    if (!newKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      await keysApi.add(newKey);
      Alert.alert('Success', 'API key has been added successfully');
      setNewKey('');
      fetchKeys();
    } catch (error: any) {
      Alert.alert('Failed to add key', error.message);
    }
  };

  const deleteKey = async (id: string) => {
    Alert.alert(
      'Delete Key',
      'Are you sure you want to delete this API key?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await keysApi.delete(id);
              Alert.alert('Success', 'API key has been removed');
              fetchKeys();
            } catch (error: any) {
              Alert.alert('Failed to delete key', error.message);
            }
          },
        },
      ]
    );
  };

  const toggleKey = async (id: string, currentStatus: boolean) => {
    try {
      await keysApi.update(id, !currentStatus);
      fetchKeys();
    } catch (error: any) {
      Alert.alert('Failed to update key', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Gemini API Keys</Text>
        <Text style={styles.cardDescription}>
          Manage your Gemini API keys for unlimited usage with automatic cycling
        </Text>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter Gemini API key"
            value={newKey}
            onChangeText={setNewKey}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.addButton} onPress={addKey}>
            <Text style={styles.addButtonText}>Add Key</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Active API Keys</Text>
        <Text style={styles.cardDescription}>
          {keys.length} key{keys.length !== 1 ? 's' : ''} configured
        </Text>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : keys.length === 0 ? (
          <Text style={styles.emptyText}>
            No API keys configured. Add your first key above.
          </Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Key</Text>
              <Text style={styles.tableHeaderText}>Status</Text>
              <Text style={styles.tableHeaderText}>Usage</Text>
              <Text style={styles.tableHeaderText}>Errors</Text>
              <Text style={styles.tableHeaderText}>Actions</Text>
            </View>
            {keys.map((key) => (
              <View key={key.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>
                  {key.key_value.substring(0, 20)}...
                </Text>
                <TouchableOpacity
                  onPress={() => toggleKey(key.id, key.is_active)}
                >
                  <View
                    style={[
                      styles.badge,
                      key.is_active ? styles.badgeActive : styles.badgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        key.is_active && styles.badgeTextActive,
                      ]}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <Text style={styles.tableCell}>{key.usage_count}</Text>
                <Text style={styles.tableCell}>{key.error_count}</Text>
                <TouchableOpacity onPress={() => deleteKey(key.id)}>
                  <Text style={styles.deleteButton}>Delete</Text>
                </TouchableOpacity>
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
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  addButtonText: {
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
    alignItems: 'center',
  },
  tableCell: {
    flex: 1,
    fontSize: 12,
    color: '#000000',
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
  badgeInactive: {
    backgroundColor: '#E5E5EA',
  },
  badgeText: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '500',
  },
  badgeTextActive: {
    color: '#FFFFFF',
  },
  deleteButton: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { Ionicons } from '@expo/vector-icons';

export const OfflineBanner: React.FC = () => {
  const { isOnline, checkConnection } = useNetwork();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Ionicons name="cloud-offline-outline" size={18} color="#991B1B" style={styles.icon} />
      <Text style={styles.text}>You are offline. Showing cached content.</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => checkConnection()}>
        <Text style={styles.retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

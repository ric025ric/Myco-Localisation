import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MushroomSpot {
  id: string;
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64?: string;
  timestamp: string;
}

interface WebMapFallbackProps {
  spots: MushroomSpot[];
  onMarkerPress: (spot: MushroomSpot) => void;
}

export default function WebMapFallback({ spots, onMarkerPress }: WebMapFallbackProps) {
  return (
    <View style={styles.webMapFallback}>
      <Ionicons name="map" size={64} color="#4CAF50" />
      <Text style={styles.webMapText}>Map View</Text>
      <Text style={styles.webMapSubtext}>
        Interactive map is not available on web. Use the mobile app for full map functionality.
      </Text>
      <View style={styles.spotsListContainer}>
        <Text style={styles.spotsListTitle}>Mushroom Spots ({spots.length})</Text>
        {spots.map((spot) => (
          <TouchableOpacity
            key={spot.id}
            style={styles.spotItem}
            onPress={() => onMarkerPress(spot)}
          >
            <View style={styles.spotInfo}>
              <Text style={styles.spotType}>{spot.mushroom_type}</Text>
              <Text style={styles.spotDate}>
                {new Date(spot.timestamp).toLocaleDateString()}
              </Text>
              <Text style={styles.spotLocation}>
                {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  webMapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 20,
  },
  webMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  webMapSubtext: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  spotsListContainer: {
    width: '100%',
    maxWidth: 600,
  },
  spotsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  spotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  spotInfo: {
    flex: 1,
  },
  spotType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  spotDate: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 2,
  },
  spotLocation: {
    fontSize: 12,
    color: '#999',
  },
});
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface MushroomSpot {
  id: string;
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64?: string;
  timestamp: string;
}

export default function SpotsListScreen() {
  const [spots, setSpots] = useState<MushroomSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const spots = await response.json();
      setSpots(spots);
    } catch (error) {
      console.error('Error fetching spots:', error);
      Alert.alert('Error', 'Could not load mushroom spots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchSpots();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const deleteSpot = async (spotId: string) => {
    Alert.alert(
      'Delete Spot',
      'Are you sure you want to delete this mushroom spot?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots/${spotId}`,
                { method: 'DELETE' }
              );

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              // Remove from local state
              setSpots(spots.filter(spot => spot.id !== spotId));
              Alert.alert('Success', 'Mushroom spot deleted successfully.');
            } catch (error) {
              console.error('Error deleting spot:', error);
              Alert.alert('Error', 'Could not delete spot. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const renderSpotItem = ({ item }: { item: MushroomSpot }) => (
    <TouchableOpacity
      style={styles.spotCard}
      onPress={() => router.push(`/spot-details/${item.id}`)}
    >
      <View style={styles.spotHeader}>
        <View style={styles.spotInfo}>
          <Text style={styles.mushroomType}>{item.mushroom_type}</Text>
          <Text style={styles.timestamp}>{formatDate(item.timestamp)}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#666" />
            <Text style={styles.coordinates}>
              {formatCoordinates(item.latitude, item.longitude)}
            </Text>
          </View>
        </View>

        {item.photo_base64 && (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.photo_base64}` }}
            style={styles.thumbnail}
          />
        )}
      </View>

      {item.notes && (
        <Text style={styles.notes} numberOfLines={2}>
          {item.notes}
        </Text>
      )}

      <View style={styles.spotActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push(`/spot-details/${item.id}`)}
        >
          <Ionicons name="eye-outline" size={16} color="#4CAF50" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => deleteSpot(item.id)}
        >
          <Ionicons name="trash-outline" size={16} color="#f44336" />
          <Text style={[styles.actionText, { color: '#f44336' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="leaf-outline" size={64} color="#666" />
      <Text style={styles.emptyTitle}>No mushroom spots yet</Text>
      <Text style={styles.emptyText}>
        Start exploring and add your first mushroom find!
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/add-spot')}
      >
        <Ionicons name="add-circle" size={24} color="#fff" />
        <Text style={styles.emptyButtonText}>Add First Spot</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading your spots...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.title}>My Spots</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-spot')}
        >
          <Ionicons name="add" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.statText}>
            {spots.length} {spots.length === 1 ? 'spot' : 'spots'} found
          </Text>
        </View>
      </View>

      <FlashList
        data={spots}
        renderItem={renderSpotItem}
        estimatedItemSize={150}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={spots.length === 0 ? styles.emptyList : styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  addButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statText: {
    color: '#ccc',
    fontSize: 14,
  },
  list: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  emptyList: {
    flex: 1,
  },
  spotCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  spotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  spotInfo: {
    flex: 1,
  },
  mushroomType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  coordinates: {
    fontSize: 12,
    color: '#666',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginLeft: 12,
  },
  notes: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    lineHeight: 20,
  },
  spotActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
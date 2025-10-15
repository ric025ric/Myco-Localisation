import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface MushroomSpot {
  id: string;
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64?: string;
  timestamp: string;
  created_by: string;
}

export default function SpotDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [spot, setSpot] = useState<MushroomSpot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchSpot();
    }
  }, [id]);

  const fetchSpot = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          Alert.alert('Not Found', 'This mushroom spot could not be found.');
          router.back();
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const spotData = await response.json();
      setSpot(spotData);
    } catch (error) {
      console.error('Error fetching spot:', error);
      Alert.alert('Error', 'Could not load spot details. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const deleteSpot = async () => {
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
                `${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots/${id}`,
                { method: 'DELETE' }
              );

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              Alert.alert(
                'Deleted',
                'Mushroom spot deleted successfully.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Error deleting spot:', error);
              Alert.alert('Error', 'Could not delete spot. Please try again.');
            }
          },
        },
      ]
    );
  };

  const shareSpot = async () => {
    if (!spot) return;

    try {
      const message = `Found ${spot.mushroom_type} at coordinates ${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}`;
      const googleMapsUrl = `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`;
      
      await Share.share({
        message: `${message}\n\nView on map: ${googleMapsUrl}`,
        title: `Mushroom Find: ${spot.mushroom_type}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const openInMaps = () => {
    if (!spot) return;
    
    const googleMapsUrl = `https://maps.google.com/?q=${spot.latitude},${spot.longitude}`;
    
    Alert.alert(
      'Open in Maps',
      'This will open your default maps app to navigate to this location.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Maps', 
          onPress: () => {
            // For web, we'll just show the URL
            if (typeof window !== 'undefined') {
              window.open(googleMapsUrl, '_blank');
            }
          }
        },
      ]
    );
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading spot details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!spot) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#f44336" />
          <Text style={styles.errorText}>Spot not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {spot.mushroom_type}
        </Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={shareSpot}
        >
          <Ionicons name="share-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {spot.photo_base64 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: `data:image/jpeg;base64,${spot.photo_base64}` }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.detailsContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mushroom Type</Text>
            <Text style={styles.sectionContent}>{spot.mushroom_type}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Found On</Text>
            <Text style={styles.sectionContent}>{formatDate(spot.timestamp)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color="#4CAF50" />
              <Text style={styles.coordinates}>
                {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
              </Text>
            </View>
            <TouchableOpacity style={styles.mapsButton} onPress={openInMaps}>
              <Ionicons name="map-outline" size={16} color="#4CAF50" />
              <Text style={styles.mapsButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>

          {spot.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesContent}>{spot.notes}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Spot ID:</Text>
              <Text style={styles.metadataValue}>{spot.id}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Added by:</Text>
              <Text style={styles.metadataValue}>{spot.created_by}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionButton} onPress={shareSpot}>
          <Ionicons name="share-outline" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
          <Ionicons name="navigate-outline" size={20} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Navigate</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]} 
          onPress={deleteSpot}
        >
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 20,
    color: '#f44336',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  headerButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    backgroundColor: '#2a2a2a',
  },
  mainImage: {
    width: '100%',
    height: 300,
  },
  detailsContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  coordinates: {
    fontSize: 16,
    color: '#fff',
    fontFamily: 'monospace',
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  mapsButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
  },
  notesContent: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  metadataLabel: {
    fontSize: 14,
    color: '#666',
  },
  metadataValue: {
    fontSize: 14,
    color: '#ccc',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    borderColor: '#f44336',
  },
  deleteButtonText: {
    color: '#f44336',
  },
});
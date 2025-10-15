import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
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

function MapContent() {
  const { t } = useLanguage();
  const [spots, setSpots] = useState<MushroomSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await fetchSpots();
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(t('common.error'), t('error.loadMap'));
    } finally {
      setLoading(false);
    }
  };

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
      throw error;
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchSpots();
    } catch (error) {
      console.error('Error refreshing data:', error);
      Alert.alert(t('common.error'), t('error.loadMap'));
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('map.loadingMap')}</Text>
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
        <Text style={styles.title}>{t('map.title')}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={refreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={refreshing ? "#666" : "#4CAF50"} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.webFallback}>
        <Ionicons name="map-outline" size={64} color="#4CAF50" />
        <Text style={styles.webFallbackTitle}>Carte Interactive</Text>
        <Text style={styles.webFallbackText}>
          La carte interactive avec navigation GPS est disponible sur l'application mobile.
          
          En attendant, vous pouvez consulter la liste de vos spots ci-dessous:
        </Text>
        
        <View style={styles.spotsPreview}>
          {spots.slice(0, 3).map((spot) => (
            <TouchableOpacity
              key={spot.id}
              style={styles.spotPreviewCard}
              onPress={() => router.push(`/spot-details/${spot.id}`)}
            >
              <Text style={styles.spotType}>{spot.mushroom_type}</Text>
              <Text style={styles.spotCoords}>
                {spot.latitude.toFixed(4)}, {spot.longitude.toFixed(4)}
              </Text>
            </TouchableOpacity>
          ))}
          {spots.length > 3 && (
            <Text style={styles.moreSpots}>
              ... et {spots.length - 3} autres spots
            </Text>
          )}
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/spots-list')}
          >
            <Ionicons name="list" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Voir tous les spots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={() => router.push('/add-spot')}
          >
            <Ionicons name="add" size={24} color="#4CAF50" />
            <Text style={[styles.actionButtonText, styles.secondaryText]}>Ajouter un Spot</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function MapScreen() {
  return (
    <LanguageProvider>
      <MapContent />
    </LanguageProvider>
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
  refreshButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  webFallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  spotsPreview: {
    width: '100%',
    marginBottom: 32,
  },
  spotPreviewCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  spotType: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  spotCoords: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
  },
  moreSpots: {
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonGroup: {
    width: '100%',
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  secondaryAction: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryText: {
    color: '#4CAF50',
  },
});
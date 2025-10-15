import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

// Platform-specific imports
let Location: any = null;
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  Location = require('expo-location');
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get current location - platform specific
      if (Platform.OS === 'web') {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setCurrentLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                }
              });
            },
            (error) => {
              console.error('Error getting web location:', error);
            }
          );
        }
      } else if (Location) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          setCurrentLocation(location);
        }
      }

      // Fetch mushroom spots
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

  const onMarkerPress = (spot: MushroomSpot) => {
    Alert.alert(
      spot.mushroom_type,
      `${t('spotsList.found')}: ${new Date(spot.timestamp).toLocaleDateString()}\n${t('addSpot.notes')}: ${spot.notes || t('spotsList.noSpots')}`,
      [
        { text: t('spotsList.view'), onPress: () => router.push(`/spot-details/${spot.id}`) },
        { text: t('common.close'), style: 'cancel' },
      ]
    );
  };

  const centerOnCurrentLocation = () => {
    if (currentLocation && mapRef.current && Platform.OS !== 'web') {
      mapRef.current.animateToRegion({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const fitAllMarkers = () => {
    if (spots.length > 0 && mapRef.current && Platform.OS !== 'web') {
      const coordinates = spots.map(spot => ({
        latitude: spot.latitude,
        longitude: spot.longitude,
      }));
      
      if (currentLocation) {
        coordinates.push({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }

      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  };

  const getInitialRegion = () => {
    if (currentLocation) {
      return {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Default region
    return {
      latitude: 47.6062,
      longitude: -122.3321,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
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

  // Web fallback when maps are not available
  if (Platform.OS === 'web') {
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
          <Text style={styles.webFallbackTitle}>Carte non disponible sur web</Text>
          <Text style={styles.webFallbackText}>
            Utilisez l'application mobile pour voir la carte interactive
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-spot')}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Ajouter un Spot</Text>
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

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={getInitialRegion()}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={true}
          showsScale={true}
          onMapReady={fitAllMarkers}
        >
          {spots.map((spot) => (
            <Marker
              key={spot.id}
              coordinate={{
                latitude: spot.latitude,
                longitude: spot.longitude,
              }}
              title={spot.mushroom_type}
              description={`${t('spotsList.found')}: ${new Date(spot.timestamp).toLocaleDateString()}`}
              onPress={() => onMarkerPress(spot)}
            >
              <View style={styles.markerContainer}>
                <Ionicons name="location" size={30} color="#4CAF50" />
              </View>
            </Marker>
          ))}
        </MapView>

        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={centerOnCurrentLocation}
          >
            <Ionicons name="navigate" size={24} color="#4CAF50" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.controlButton}
            onPress={fitAllMarkers}
          >
            <Ionicons name="resize" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.statText}>{spots.length} {spots.length === 1 ? t('map.spot') : t('map.spotsCount')}</Text>
          </View>
          {currentLocation && (
            <View style={styles.stat}>
              <Ionicons name="navigate" size={20} color="#4CAF50" />
              <Text style={styles.statText}>{t('map.gpsActive')}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/add-spot')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
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
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 8,
  },
  controlButton: {
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: '#ccc',
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 25,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
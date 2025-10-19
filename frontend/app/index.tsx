import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  ImageBackground,
  Linking,
  Share,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import WelcomeModal from '../components/WelcomeModal';

// Platform-specific imports
let Location: any = null;
let Contacts: any = null;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
  Contacts = require('expo-contacts');
}

const CAR_LOCATION_STORAGE_KEY = 'myco_car_location';
const LAST_LOCATION_STORAGE_KEY = 'myco_last_location';
const USERNAME_STORAGE_KEY = 'myco_username';
const LOCATION_MAX_AGE = 5 * 60 * 1000; // 5 minutes

function HomeScreenContent() {
  const { t } = useLanguage();
  const [location, setLocation] = useState<any>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [carLocation, setCarLocation] = useState<any>(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    await loadCarLocation();
    await loadLastKnownLocation();
    await checkLocationPermission();
  };

  const loadLastKnownLocation = async () => {
    try {
      const savedLocation = await AsyncStorage.getItem(LAST_LOCATION_STORAGE_KEY);
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        const age = Date.now() - parsedLocation.timestamp;
        
        // Si la localisation a moins de 5 minutes, on l'utilise
        if (age < LOCATION_MAX_AGE) {
          setLocation(parsedLocation.location);
          return true;
        }
      }
    } catch (error) {
      console.error('Error loading last known location:', error);
    }
    return false;
  };

  const saveLocationToStorage = async (loc: any) => {
    try {
      const locationData = {
        location: loc,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(LAST_LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const loadCarLocation = async () => {
    try {
      const savedCarLocation = await AsyncStorage.getItem(CAR_LOCATION_STORAGE_KEY);
      if (savedCarLocation) {
        setCarLocation(JSON.parse(savedCarLocation));
      }
    } catch (error) {
      console.error('Error loading car location:', error);
    }
  };

  const checkLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, try to get location using browser geolocation
        if (navigator.geolocation) {
          setLocationPermission(true);
          getCurrentLocation();
        } else {
          setLocationPermission(false);
          setLoading(false);
        }
        return;
      }

      if (!Location) {
        // Skip location for mobile if not available - app will still work
        setLocationPermission(false);
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        // Don't show alert that blocks user - just continue without location
        console.log('Location permission denied');
        setLocationPermission(false);
        setLoading(false);
        return;
      }

      setLocationPermission(true);
      
      // Si on a déjà une localisation récente, pas besoin d'en demander une nouvelle
      const hasRecentLocation = await loadLastKnownLocation();
      if (hasRecentLocation) {
        setLoading(false);
        return;
      }
      
      getCurrentLocation();
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setLocationPermission(false);
      setLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Location timeout')), 10000);
      });

      if (Platform.OS === 'web') {
        // Use browser geolocation for web with timeout
        const locationPromise = new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: true,
            maximumAge: 60000,
          });
        });
        
        try {
          const position = await Promise.race([locationPromise, timeoutPromise]);
          const loc = {
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }
          };
          setLocation(loc);
          await saveLocationToStorage(loc);
        } catch (error) {
          console.error('Error getting web location:', error);
          // Continue without location
        }
        setLoading(false);
        return;
      }

      if (!Location) {
        setLoading(false);
        return;
      }

      try {
        const locationPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        
        const location = await Promise.race([locationPromise, timeoutPromise]);
        setLocation(location);
        await saveLocationToStorage(location);
      } catch (error) {
        console.error('Error getting current location:', error);
        // Continue without location - app will still work
      }
    } catch (error) {
      console.error('Error in getCurrentLocation:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToAddSpot = () => {
    if (!locationPermission) {
      Alert.alert(
        t('common.error'),
        t('error.locationRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    router.push('/add-spot');
  };

  const navigateToMap = () => {
    router.push('/map');
  };

  const navigateToSpotsList = () => {
    router.push('/spots-list');
  };

  const handleCarLocation = () => {
    if (!locationPermission || !location) {
      Alert.alert(
        t('common.error'),
        t('error.locationRequired'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    if (carLocation) {
      // Navigate to car
      navigateToCarLocation();
    } else {
      // Save current location as car location
      saveCarLocation();
    }
  };

  const saveCarLocation = async () => {
    if (!location) return;

    Alert.alert(
      t('car.save'),
      t('car.saveCurrentLocation'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('car.save'),
          onPress: async () => {
            try {
              const carLocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                timestamp: new Date().toISOString(),
              };
              
              await AsyncStorage.setItem(CAR_LOCATION_STORAGE_KEY, JSON.stringify(carLocationData));
              setCarLocation(carLocationData);
              
              Alert.alert(
                t('common.success'),
                t('car.saved'),
                [{ text: t('common.ok') }]
              );
            } catch (error) {
              console.error('Error saving car location:', error);
              Alert.alert(t('common.error'), 'Could not save car location.');
            }
          },
        },
      ]
    );
  };

  const navigateToCarLocation = () => {
    if (!carLocation) return;

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      carLocation.latitude,
      carLocation.longitude
    );

    Alert.alert(
      t('car.navigate'),
      `${t('car.distance')}: ${distance.toFixed(0)}m\n\nCoordinates: ${carLocation.latitude.toFixed(6)}, ${carLocation.longitude.toFixed(6)}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Ouvrir Maps',
          onPress: async () => {
            try {
              const url = `https://maps.google.com/?q=${carLocation.latitude},${carLocation.longitude}`;
              
              // Check if Linking can open the URL
              const supported = await Linking.canOpenURL(url);
              
              if (supported) {
                await Linking.openURL(url);
              } else {
                Alert.alert(t('common.error'), 'Impossible d\'ouvrir Maps sur cet appareil.');
              }
            } catch (error) {
              console.error('Error opening maps:', error);
              Alert.alert(t('common.error'), 'Erreur lors de l\'ouverture de Maps.');
            }
          },
        },
        {
          text: t('car.delete'),
          style: 'destructive',
          onPress: () => deleteCarLocation(),
        },
      ]
    );
  };

  const deleteCarLocation = () => {
    Alert.alert(
      t('car.delete'),
      t('car.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('car.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(CAR_LOCATION_STORAGE_KEY);
              setCarLocation(null);
              
              Alert.alert(
                t('common.success'),
                t('car.deleted'),
                [{ text: t('common.ok') }]
              );
            } catch (error) {
              console.error('Error deleting car location:', error);
              Alert.alert(t('common.error'), 'Impossible de supprimer la position.');
            }
          },
        },
      ]
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon1-lon2) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>{t('home.gettingLocation')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={{
          uri: 'https://images.pexels.com/photos/2637657/pexels-photo-2637657.jpeg'
        }}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#4CAF50" />
            </TouchableOpacity>
            
            <View style={styles.titleContainer}>
              <Ionicons name="leaf" size={40} color="#4CAF50" />
              <Text style={styles.title}>{t('app.title')}</Text>
              <Text style={styles.subtitle}>{t('app.subtitle')}</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>

      {location && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color="#4CAF50" />
          <Text style={styles.locationText}>
            Current: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
          </Text>
        </View>
      )}

      <View style={styles.actionsContainer}>
        {/* Première rangée */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.gridButton, carLocation ? styles.carNavigateButton : styles.carSaveButton]}
            onPress={handleCarLocation}
          >
            <Ionicons 
              name={carLocation ? "car-sport" : "car-sport-outline"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.gridButtonText}>{t('home.carLocation')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridButton, styles.primaryButton]}
            onPress={navigateToAddSpot}
          >
            <Ionicons name="add-circle" size={24} color="#fff" />
            <Text style={styles.gridButtonText}>{t('home.addSpot')}</Text>
          </TouchableOpacity>
        </View>

        {/* Deuxième rangée */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.gridButton, styles.secondaryButton]}
            onPress={navigateToMap}
          >
            <Ionicons name="map" size={24} color="#4CAF50" />
            <Text style={[styles.gridButtonText, styles.secondaryButtonText]}>{t('home.viewMap')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gridButton, styles.secondaryButton]}
            onPress={navigateToSpotsList}
          >
            <Ionicons name="list" size={24} color="#4CAF50" />
            <Text style={[styles.gridButtonText, styles.secondaryButtonText]}>{t('home.spotsList')}</Text>
          </TouchableOpacity>
        </View>
      </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {locationPermission ? t('home.locationEnabled') : t('home.locationDisabled')}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundImage: {
    flex: 1,
  },
  backgroundImageStyle: {
    opacity: 0.9, // Image plus visible
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Overlay plus léger pour voir l'image
    paddingHorizontal: 20,
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
    paddingVertical: 24,
    paddingHorizontal: 8,
  },
  settingsButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  titleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  placeholder: {
    width: 48, // Match settingsButton width
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    padding: 12,
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
  },
  locationText: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 12,
  },
  actionsContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridButton: {
    flex: 1,
    aspectRatio: 1.2, // Format rectangulaire élégant
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(42, 42, 42, 0.9)',
  },
  gridButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  carSaveButton: {
    backgroundColor: '#FF9800', // Orange for saving car location
    shadowColor: '#FF9800',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  carNavigateButton: {
    backgroundColor: '#2196F3', // Blue for navigating to car
    shadowColor: '#2196F3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(42, 42, 42, 0.8)',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
});

export default function HomeScreen() {
  return (
    <LanguageProvider>
      <HomeScreenContent />
    </LanguageProvider>
  );
}
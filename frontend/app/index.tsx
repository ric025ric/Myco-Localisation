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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

// Platform-specific imports
let Location: any = null;
if (Platform.OS !== 'web') {
  Location = require('expo-location');
}

function HomeScreenContent() {
  const { t } = useLanguage();
  const [location, setLocation] = useState<any>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    checkLocationPermission();
  }, []);

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
          setLocation({
            coords: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
            }
          });
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
        'Location Required',
        'Please enable location services to add mushroom spots.',
        [{ text: 'OK' }]
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
        <TouchableOpacity
          style={[styles.actionButton, styles.primaryButton]}
          onPress={navigateToAddSpot}
        >
          <Ionicons name="add-circle" size={32} color="#fff" />
          <Text style={styles.buttonText}>{t('home.addSpot')}</Text>
          <Text style={styles.buttonSubtext}>{t('home.addSpotSubtext')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={navigateToMap}
        >
          <Ionicons name="map" size={32} color="#4CAF50" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('home.viewMap')}</Text>
          <Text style={[styles.buttonSubtext, styles.secondaryButtonSubtext]}>
            {t('home.viewMapSubtext')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={navigateToSpotsList}
        >
          <Ionicons name="list" size={32} color="#4CAF50" />
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('home.spotsList')}</Text>
          <Text style={[styles.buttonSubtext, styles.secondaryButtonSubtext]}>
            {t('home.spotsListSubtext')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {locationPermission ? t('home.locationEnabled') : t('home.locationDisabled')}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
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
    gap: 20,
  },
  actionButton: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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
  secondaryButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#4CAF50',
  },
  buttonSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
    textAlign: 'center',
  },
  secondaryButtonSubtext: {
    color: '#999',
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
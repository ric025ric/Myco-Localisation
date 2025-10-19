import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

// Platform-specific imports
let Location: any = null;
let ImagePicker: any = null;

if (Platform.OS !== 'web') {
  Location = require('expo-location');
  ImagePicker = require('expo-image-picker');
}

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const USERNAME_STORAGE_KEY = 'myco_username';

interface MushroomSpot {
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64?: string;
  created_by?: string;
}

function AddSpotScreen() {
  const { t } = useLanguage();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [mushroomType, setMushroomType] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);
  const [username, setUsername] = useState<string>('user');

  useEffect(() => {
    loadUsername();
    getCurrentLocation();
  }, []);

  const loadUsername = async () => {
    try {
      const savedUsername = await AsyncStorage.getItem(USERNAME_STORAGE_KEY);
      if (savedUsername) {
        setUsername(savedUsername);
      }
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };
  }, []);

  const getCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      
      if (Platform.OS === 'web') {
        // Use browser geolocation for web
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                coords: {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                }
              });
              setGettingLocation(false);
            },
            (error) => {
              console.error('Error getting web location:', error);
              Alert.alert(t('common.error'), t('error.location'));
              setGettingLocation(false);
            }
          );
        } else {
          Alert.alert(t('common.error'), 'Geolocation is not supported by this browser.');
          setGettingLocation(false);
        }
        return;
      }

      if (!Location) {
        Alert.alert(t('common.error'), 'Location service not available.');
        setGettingLocation(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          t('error.locationRequiredSpot')
        );
        router.back();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(location);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(t('common.error'), t('error.location'));
    } finally {
      setGettingLocation(false);
    }
  };

  const takePicture = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use a file input to simulate camera
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'camera';
        
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              // Remove data:image/...;base64, prefix
              const base64Data = base64.split(',')[1];
              setPhoto(base64Data);
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
        return;
      }

      if (!ImagePicker) {
        Alert.alert(t('common.error'), 'Camera not available on this platform.');
        return;
      }

      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          t('error.cameraRequired')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(t('common.error'), 'Could not take picture. Please try again.');
    }
  };

  const selectFromGallery = async () => {
    try {
      if (Platform.OS === 'web') {
        // For web, use a file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e: any) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              // Remove data:image/...;base64, prefix
              const base64Data = base64.split(',')[1];
              setPhoto(base64Data);
            };
            reader.readAsDataURL(file);
          }
        };
        
        input.click();
        return;
      }

      if (!ImagePicker) {
        Alert.alert(t('common.error'), 'Image picker not available on this platform.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          t('error.galleryRequired')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        setPhoto(result.assets[0].base64);
      }
    } catch (error) {
      console.error('Error selecting from gallery:', error);
      Alert.alert(t('common.error'), 'Could not select photo. Please try again.');
    }
  };

  const showPhotoOptions = () => {
    Alert.alert(
      t('addSpot.addPhoto'),
      'Choose how to add a photo of the mushroom',
      [
        { text: 'Take Photo', onPress: takePicture },
        { text: 'Choose from Gallery', onPress: selectFromGallery },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  };

  const saveSpot = async () => {
    if (!location) {
      Alert.alert(t('common.error'), t('error.location'));
      return;
    }

    if (!mushroomType.trim()) {
      Alert.alert(t('common.error'), t('error.mushroomTypeRequired'));
      return;
    }

    setLoading(true);

    try {
      const spotData: MushroomSpot = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        mushroom_type: mushroomType.trim(),
        notes: notes.trim(),
      };

      if (photo) {
        spotData.photo_base64 = photo;
      }

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spotData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Spot saved:', result);

      Alert.alert(
        t('addSpot.success'),
        t('addSpot.successMessage'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving spot:', error);
      Alert.alert(t('common.error'), t('error.saveSpot'));
    } finally {
      setLoading(false);
    }
  };

  if (gettingLocation) {
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
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={styles.title}>{t('addSpot.title')}</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {location && (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#4CAF50" />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>{t('addSpot.currentLocation')}</Text>
                <Text style={styles.locationText}>
                  {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationAccuracy}>
                  {t('addSpot.accuracy')}: {location.coords.accuracy?.toFixed(0)}m
                </Text>
              </View>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addSpot.mushroomType')}</Text>
            <TextInput
              style={styles.input}
              value={mushroomType}
              onChangeText={setMushroomType}
              placeholder={t('addSpot.mushroomTypePlaceholder')}
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('addSpot.notes')}</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={t('addSpot.notesPlaceholder')}
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.photoContainer}>
            <Text style={styles.label}>{t('addSpot.photo')}</Text>
            {photo ? (
              <View style={styles.photoWrapper}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${photo}` }}
                  style={styles.photoPreview}
                />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={showPhotoOptions}
                >
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.changePhotoText}>{t('addSpot.changePhoto')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.photoButton}
                onPress={showPhotoOptions}
              >
                <Ionicons name="camera" size={32} color="#4CAF50" />
                <Text style={styles.photoButtonText}>{t('addSpot.addPhoto')}</Text>
                <Text style={styles.photoButtonSubtext}>{t('addSpot.addPhotoSubtext')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={saveSpot}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>{t('addSpot.saveSpot')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function AddSpotScreenWithProvider() {
  return (
    <LanguageProvider>
      <AddSpotScreen />
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
  },
  locationInfo: {
    marginLeft: 12,
    flex: 1,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  locationText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  locationAccuracy: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  inputContainer: {
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#333',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoContainer: {
    marginVertical: 16,
  },
  photoWrapper: {
    alignItems: 'center',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changePhotoText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  photoButton: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  photoButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
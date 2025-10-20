import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const USERNAME_STORAGE_KEY = 'myco_username';

function ReceiveSpotScreen() {
  const { t } = useLanguage();
  const { data } = useLocalSearchParams();
  const [spotData, setSpotData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState<string>('Utilisateur');

  useEffect(() => {
    loadUsername();
    parseSpotData();
  }, [data]);

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

  const parseSpotData = () => {
    try {
      if (data) {
        const decoded = decodeURIComponent(data as string);
        const parsed = JSON.parse(decoded);
        setSpotData(parsed);
      }
    } catch (error) {
      console.error('Error parsing spot data:', error);
      Alert.alert('Erreur', 'Impossible de lire les données du spot');
      router.back();
    }
  };

  const saveSharedSpot = async () => {
    if (!spotData) return;

    setLoading(true);
    try {
      const payload = {
        latitude: spotData.latitude,
        longitude: spotData.longitude,
        mushroom_type: spotData.type,
        notes: spotData.notes ? `${spotData.notes}\n\n📤 Spot partagé, sauvegardé par ${username}` : `📤 Spot partagé, sauvegardé par ${username}`,
        photo_base64: spotData.photo || null,
        created_by: username,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert(
          'Succès',
          'Le spot partagé a été sauvegardé dans votre collection !',
          [{ text: 'OK', onPress: () => router.push('/spots-list') }]
        );
      } else {
        throw new Error('Failed to save spot');
      }
    } catch (error) {
      console.error('Error saving shared spot:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le spot. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  if (!spotData) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Spot Partagé</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="share-social" size={64} color="#4CAF50" />
        </View>

        <Text style={styles.title}>Un spot de champignons vous a été partagé ! 🍄</Text>

        <View style={styles.spotCard}>
          <View style={styles.infoRow}>
            <Ionicons name="leaf" size={24} color="#4CAF50" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{spotData.type}</Text>
            </View>
          </View>

          {spotData.notes && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={24} color="#4CAF50" />
              <View style={styles.infoText}>
                <Text style={styles.infoLabel}>Notes</Text>
                <Text style={styles.infoValue}>{spotData.notes}</Text>
              </View>
            </View>
          )}

          <View style={styles.infoRow}>
            <Ionicons name="location" size={24} color="#4CAF50" />
            <View style={styles.infoText}>
              <Text style={styles.infoLabel}>Coordonnées</Text>
              <Text style={styles.infoValue}>
                {spotData.latitude?.toFixed(6)}, {spotData.longitude?.toFixed(6)}
              </Text>
            </View>
          </View>

          {spotData.photo && (
            <View style={styles.photoContainer}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${spotData.photo}` }}
                style={styles.photo}
                resizeMode="cover"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={saveSharedSpot}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={24} color="#fff" />
              <Text style={styles.saveButtonText}>Sauvegarder dans ma collection</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Ignorer</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default function ReceiveSpotScreenWrapper() {
  return (
    <LanguageProvider>
      <ReceiveSpotScreen />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginVertical: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  spotCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
  },
  photoContainer: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 200,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 16,
  },
});

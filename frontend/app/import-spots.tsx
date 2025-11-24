import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { XMLParser } from 'fast-xml-parser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import { UserService } from '../services/UserService';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const USERNAME_STORAGE_KEY = 'myco_username';

interface ImportedSpot {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  selected: boolean;
  isDuplicate?: boolean;
  duplicateDistance?: number;
}

function ImportSpotsContent() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [spotsToImport, setSpotsToImport] = useState<ImportedSpot[]>([]);
  const [username, setUsername] = useState<string>('');

  React.useEffect(() => {
    loadUsername();
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

  const pickKMLFile = async () => {
    try {
      setLoading(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.google-earth.kml+xml', 'application/vnd.google-earth.kmz', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);

      if (!file.uri) {
        Alert.alert('Erreur', 'Impossible de lire le fichier');
        setLoading(false);
        return;
      }

      // Read file content
      let fileContent = '';
      
      if (Platform.OS === 'web') {
        // For web, use fetch
        const response = await fetch(file.uri);
        fileContent = await response.text();
      } else {
        // For mobile, use expo-document-picker's built-in file reading
        const RNFS = require('react-native-fs');
        fileContent = await RNFS.readFile(file.uri, 'utf8');
      }

      console.log('File content length:', fileContent.length);

      // Parse KML
      const spots = parseKML(fileContent);
      
      if (spots.length === 0) {
        Alert.alert(
          'Aucun spot trouvé',
          'Le fichier KML ne contient pas de points de localisation.'
        );
        setLoading(false);
        return;
      }

      // Check for duplicates
      const spotsWithDuplicateCheck = await checkDuplicates(spots);
      
      setSpotsToImport(spotsWithDuplicateCheck);
      setLoading(false);
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Erreur', `Impossible de lire le fichier: ${error.message}`);
      setLoading(false);
    }
  };

  const parseKML = (kmlContent: string): ImportedSpot[] => {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });

      const kmlData = parser.parse(kmlContent);
      const spots: ImportedSpot[] = [];

      // Navigate through KML structure
      const kml = kmlData.kml || kmlData.Document;
      if (!kml) {
        console.log('No KML root found');
        return spots;
      }

      const document = kml.Document || kml;
      const placemarks = document.Placemark || [];

      // Handle single placemark vs array
      const placemarksArray = Array.isArray(placemarks) ? placemarks : [placemarks];

      placemarksArray.forEach((placemark: any) => {
        try {
          const name = placemark.name || 'Spot sans nom';
          const description = placemark.description || '';
          
          // Extract coordinates from Point
          let coordinates = placemark.Point?.coordinates;
          
          // Sometimes coordinates is in LineString or Polygon
          if (!coordinates) {
            coordinates = placemark.LineString?.coordinates || 
                         placemark.Polygon?.outerBoundaryIs?.LinearRing?.coordinates;
          }

          if (coordinates) {
            // KML coordinates format: longitude,latitude,altitude
            const coordsStr = typeof coordinates === 'string' ? coordinates : coordinates.toString();
            const parts = coordsStr.trim().split(/[\s,]+/);
            
            if (parts.length >= 2) {
              const longitude = parseFloat(parts[0]);
              const latitude = parseFloat(parts[1]);

              if (!isNaN(latitude) && !isNaN(longitude)) {
                spots.push({
                  name,
                  latitude,
                  longitude,
                  description,
                  selected: true,
                  isDuplicate: false,
                });
              }
            }
          }
        } catch (err) {
          console.error('Error parsing placemark:', err);
        }
      });

      console.log(`Parsed ${spots.length} spots from KML`);
      return spots;
    } catch (error) {
      console.error('Error parsing KML:', error);
      Alert.alert('Erreur', 'Impossible de lire le fichier KML. Format invalide.');
      return [];
    }
  };

  const checkDuplicates = async (spots: ImportedSpot[]): Promise<ImportedSpot[]> => {
    try {
      // Fetch existing spots
      const response = await fetch(
        `${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots?created_by=${encodeURIComponent(username)}`
      );
      
      if (!response.ok) {
        console.warn('Could not fetch existing spots');
        return spots;
      }

      const existingSpots = await response.json();

      // Check each spot for proximity to existing spots (within 50 meters)
      return spots.map(spot => {
        const duplicate = existingSpots.find((existing: any) => {
          const distance = calculateDistance(
            spot.latitude,
            spot.longitude,
            existing.latitude,
            existing.longitude
          );
          return distance < 0.05; // 50 meters
        });

        if (duplicate) {
          const distance = calculateDistance(
            spot.latitude,
            spot.longitude,
            duplicate.latitude,
            duplicate.longitude
          );
          return {
            ...spot,
            isDuplicate: true,
            duplicateDistance: Math.round(distance * 1000), // Convert to meters
          };
        }

        return spot;
      });
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return spots;
    }
  };

  // Calculate distance between two coordinates (in km)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toggleSpotSelection = (index: number) => {
    const updated = [...spotsToImport];
    updated[index].selected = !updated[index].selected;
    setSpotsToImport(updated);
  };

  const selectAll = () => {
    setSpotsToImport(spotsToImport.map(s => ({ ...s, selected: true })));
  };

  const deselectAll = () => {
    setSpotsToImport(spotsToImport.map(s => ({ ...s, selected: false })));
  };

  const importSelectedSpots = async () => {
    const selectedSpots = spotsToImport.filter(s => s.selected);
    
    if (selectedSpots.length === 0) {
      Alert.alert('Attention', 'Veuillez sélectionner au moins un spot à importer');
      return;
    }

    setImporting(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const spot of selectedSpots) {
        try {
          const spotData = {
            latitude: spot.latitude,
            longitude: spot.longitude,
            mushroom_type: spot.name,
            notes: spot.description || '',
            created_by: username,
          };

          const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(spotData),
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.error('Error importing spot:', error);
          failCount++;
        }
      }

      setImporting(false);

      Alert.alert(
        'Import terminé',
        `✅ ${successCount} spot(s) importé(s)\n${failCount > 0 ? `❌ ${failCount} échec(s)` : ''}`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error during import:', error);
      Alert.alert('Erreur', "Une erreur s'est produite lors de l'import");
      setImporting(false);
    }
  };

  const selectedCount = spotsToImport.filter(s => s.selected).length;
  const duplicateCount = spotsToImport.filter(s => s.isDuplicate).length;

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
        <Text style={styles.title}>Importer des Spots</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {spotsToImport.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cloud-upload-outline" size={80} color="#666" />
            <Text style={styles.emptyTitle}>Importer depuis Google Maps</Text>
            <Text style={styles.emptyDescription}>
              1. Exportez vos lieux depuis Google My Maps{'\n'}
              2. Choisissez le format KML{'\n'}
              3. Sélectionnez le fichier ci-dessous
            </Text>
            
            <TouchableOpacity
              style={styles.pickButton}
              onPress={pickKMLFile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="document-outline" size={24} color="#fff" />
                  <Text style={styles.pickButtonText}>Sélectionner fichier KML/KMZ</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                📦 {spotsToImport.length} spot(s) trouvé(s)
              </Text>
              <Text style={styles.summaryText}>
                ✅ {selectedCount} sélectionné(s)
              </Text>
              {duplicateCount > 0 && (
                <Text style={styles.warningText}>
                  ⚠️ {duplicateCount} doublon(s) potentiel(s)
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={selectAll}>
                <Text style={styles.actionButtonText}>Tout sélectionner</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={deselectAll}>
                <Text style={styles.actionButtonText}>Tout désélectionner</Text>
              </TouchableOpacity>
            </View>

            {spotsToImport.map((spot, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.spotCard,
                  !spot.selected && styles.spotCardUnselected,
                  spot.isDuplicate && styles.spotCardDuplicate,
                ]}
                onPress={() => toggleSpotSelection(index)}
              >
                <View style={styles.spotCardLeft}>
                  <Ionicons
                    name={spot.selected ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={spot.selected ? '#4CAF50' : '#666'}
                  />
                </View>
                <View style={styles.spotCardContent}>
                  <Text style={styles.spotName}>{spot.name}</Text>
                  <Text style={styles.spotCoords}>
                    📍 {spot.latitude.toFixed(6)}, {spot.longitude.toFixed(6)}
                  </Text>
                  {spot.description && (
                    <Text style={styles.spotDescription} numberOfLines={2}>
                      {spot.description}
                    </Text>
                  )}
                  {spot.isDuplicate && (
                    <Text style={styles.duplicateWarning}>
                      ⚠️ Doublon possible (~{spot.duplicateDistance}m d'un spot existant)
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.importButton, importing && styles.importButtonDisabled]}
              onPress={importSelectedSpots}
              disabled={importing || selectedCount === 0}
            >
              {importing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={24} color="#fff" />
                  <Text style={styles.importButtonText}>
                    Importer {selectedCount} spot(s)
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSpotsToImport([])}
            >
              <Text style={styles.cancelButtonText}>Annuler et choisir un autre fichier</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  pickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    color: '#ff9800',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  spotCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  spotCardUnselected: {
    borderColor: '#333',
    opacity: 0.6,
  },
  spotCardDuplicate: {
    borderColor: '#ff9800',
  },
  spotCardLeft: {
    marginRight: 12,
  },
  spotCardContent: {
    flex: 1,
  },
  spotName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  spotCoords: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  spotDescription: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  duplicateWarning: {
    fontSize: 12,
    color: '#ff9800',
    marginTop: 6,
    fontStyle: 'italic',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  importButtonDisabled: {
    backgroundColor: '#666',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
  },
});

export default function ImportSpotsScreen() {
  return (
    <LanguageProvider>
      <ImportSpotsContent />
    </LanguageProvider>
  );
}

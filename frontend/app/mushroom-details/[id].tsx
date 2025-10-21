import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext';
import PinModal from '../../components/PinModal';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface MushroomLookalike {
  name: string;
  latin_name: string;
  difference: string;
  danger_level: string;
}

interface MushroomInfo {
  id: string;
  common_name: string;
  latin_name: string;
  edibility: string;
  season: string;
  description: string;
  characteristics: string[];
  habitat: string;
  lookalikes: MushroomLookalike[];
  photo_urls: string[];
  photos_base64?: string[];  // Photos en base64
}

function MushroomDetailsScreen() {
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [mushroom, setMushroom] = useState<MushroomInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadMushroomDetails();
  }, [id]);

  const loadMushroomDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushrooms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setMushroom(data);
      }
    } catch (error) {
      console.error('Error loading mushroom details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMushroom = async () => {
    if (!mushroom) return;

    try {
      setDeleting(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushrooms/${mushroom.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        Alert.alert(
          t('common.success'),
          'Champignon supprimé avec succès',
          [
            {
              text: t('common.ok'),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error('Failed to delete mushroom');
      }
    } catch (error) {
      console.error('Error deleting mushroom:', error);
      Alert.alert(t('common.error'), 'Erreur lors de la suppression du champignon');
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    if (!mushroom) return;
    
    Alert.alert(
      'Supprimer le champignon',
      `Êtes-vous sûr de vouloir supprimer "${mushroom.common_name}" ?`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: handleDeleteMushroom,
        },
      ]
    );
  };

  const getEdibilityColor = (edibility: string) => {
    switch (edibility) {
      case 'comestible':
        return '#4CAF50';
      case 'toxique':
        return '#FF9800';
      case 'mortel':
        return '#f44336';
      case 'non_comestible':
        return '#999';
      case 'comestible_conditionnel':
        return '#FFC107';
      default:
        return '#999';
    }
  };

  const getDangerLevelColor = (level: string) => {
    switch (level) {
      case 'mortel':
        return '#f44336';
      case 'toxique':
        return '#FF9800';
      case 'non_comestible':
        return '#999';
      default:
        return '#999';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </SafeAreaView>
    );
  }

  if (!mushroom) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#f44336" />
          <Text style={styles.errorText}>{t('common.error')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {mushroom.common_name}
        </Text>
        <TouchableOpacity 
          onPress={() => setShowPinModal(true)} 
          style={styles.deleteButton}
          disabled={deleting}
        >
          <Ionicons name="trash-outline" size={24} color="#f44336" />
        </TouchableOpacity>
      </View>

      <PinModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={() => {
          setShowPinModal(false);
          confirmDelete();
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Photos (URLs et Base64) */}
        {((mushroom.photo_urls && mushroom.photo_urls.length > 0) || (mushroom.photos_base64 && mushroom.photos_base64.length > 0)) && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosContainer}>
            {/* Photos depuis URLs */}
            {mushroom.photo_urls && mushroom.photo_urls.map((url, index) => (
              <Image key={`url-${index}`} source={{ uri: url }} style={styles.photo} />
            ))}
            {/* Photos en base64 */}
            {mushroom.photos_base64 && mushroom.photos_base64.map((photo, index) => (
              <Image key={`base64-${index}`} source={{ uri: photo }} style={styles.photo} />
            ))}
          </ScrollView>
        )}

        <View style={styles.section}>
          <Text style={styles.latinName}>{mushroom.latin_name}</Text>

          <View
            style={[
              styles.edibilityBadge,
              { backgroundColor: `${getEdibilityColor(mushroom.edibility)}20` },
            ]}
          >
            <Ionicons
              name={mushroom.edibility === 'comestible' ? 'checkmark-circle' : 'warning'}
              size={24}
              color={getEdibilityColor(mushroom.edibility)}
            />
            <Text style={[styles.edibilityText, { color: getEdibilityColor(mushroom.edibility) }]}>
              {t(`mushroom.edibility.${mushroom.edibility}`)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>{t('mushroom.season')}:</Text>
            <Text style={styles.infoValue}>{mushroom.season}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#4CAF50" />
            <Text style={styles.infoLabel}>{t('mushroom.habitat')}:</Text>
            <Text style={styles.infoValue}>{mushroom.habitat}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('mushroom.description')}</Text>
          <Text style={styles.descriptionText}>{mushroom.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('mushroom.characteristics')}</Text>
          {mushroom.characteristics.map((char, index) => (
            <View key={index} style={styles.characteristicItem}>
              <Ionicons name="checkmark" size={20} color="#4CAF50" />
              <Text style={styles.characteristicText}>{char}</Text>
            </View>
          ))}
        </View>

        {mushroom.lookalikes && mushroom.lookalikes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ {t('mushroom.lookalikes')}</Text>
            {mushroom.lookalikes.map((lookalike, index) => (
              <View key={index} style={styles.lookalikeCard}>
                <View style={styles.lookalikeHeader}>
                  <Text style={styles.lookalikeName}>{lookalike.name}</Text>
                  <View
                    style={[
                      styles.dangerBadge,
                      { backgroundColor: `${getDangerLevelColor(lookalike.danger_level)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.dangerText,
                        { color: getDangerLevelColor(lookalike.danger_level) },
                      ]}
                    >
                      {t(`mushroom.danger.${lookalike.danger_level}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.lookalikeLatinName}>{lookalike.latin_name}</Text>
                <Text style={styles.lookalikeDifference}>{lookalike.difference}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function MushroomDetailsScreenWrapper() {
  return (
    <LanguageProvider>
      <MushroomDetailsScreen />
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
  headerBackButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  placeholder: {
    width: 40,
  },
  deleteButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#fff',
    marginTop: 16,
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  photosContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  photo: {
    width: 300,
    height: 200,
    borderRadius: 16,
    marginRight: 12,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  latinName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 16,
  },
  edibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  edibilityText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 24,
  },
  characteristicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  characteristicText: {
    fontSize: 15,
    color: '#ccc',
    flex: 1,
  },
  lookalikeCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  lookalikeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lookalikeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  dangerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dangerText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  lookalikeLatinName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 8,
  },
  lookalikeDifference: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
});
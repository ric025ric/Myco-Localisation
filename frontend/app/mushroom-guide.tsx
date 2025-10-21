import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import PinModal from '../components/PinModal';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Mushroom {
  id: string;
  common_name: string;
  latin_name: string;
  edibility: string;
  season: string;
  photo_urls: string[];
}

function MushroomGuideScreen() {
  const { t } = useLanguage();
  const [mushrooms, setMushrooms] = useState<Mushroom[]>([]);
  const [filteredMushrooms, setFilteredMushrooms] = useState<Mushroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMushrooms();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMushrooms(mushrooms);
    } else {
      const filtered = mushrooms.filter(
        (m) =>
          m.common_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.latin_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMushrooms(filtered);
    }
  }, [searchQuery, mushrooms]);

  const loadMushrooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushrooms`);
      if (response.ok) {
        const data = await response.json();
        setMushrooms(data);
        setFilteredMushrooms(data);
      }
    } catch (error) {
      console.error('Error loading mushrooms:', error);
    } finally {
      setLoading(false);
    }
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

  const getEdibilityIcon = (edibility: string) => {
    switch (edibility) {
      case 'comestible':
        return 'checkmark-circle';
      case 'toxique':
      case 'mortel':
        return 'warning';
      case 'non_comestible':
        return 'close-circle';
      case 'comestible_conditionnel':
        return 'help-circle';
      default:
        return 'help-circle';
    }
  };

  const renderMushroomItem = ({ item }: { item: Mushroom }) => (
    <TouchableOpacity
      style={styles.mushroomCard}
      onPress={() => router.push(`/mushroom-details/${item.id}`)}
    >
      {item.photo_urls && item.photo_urls.length > 0 ? (
        <Image source={{ uri: item.photo_urls[0] }} style={styles.mushroomImage} />
      ) : (
        <View style={[styles.mushroomImage, styles.noImage]}>
          <Ionicons name="leaf" size={48} color="#666" />
        </View>
      )}

      <View style={styles.mushroomInfo}>
        <Text style={styles.mushroomName}>{item.common_name}</Text>
        <Text style={styles.mushroomLatinName}>{item.latin_name}</Text>
        <Text style={styles.mushroomSeason}>{item.season}</Text>

        <View style={styles.edibilityBadge}>
          <Ionicons
            name={getEdibilityIcon(item.edibility)}
            size={16}
            color={getEdibilityColor(item.edibility)}
          />
          <Text
            style={[
              styles.edibilityText,
              { color: getEdibilityColor(item.edibility) },
            ]}
          >
            {t(`mushroom.edibility.${item.edibility}`)}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('mushroom.guide')}</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('mushroom.search')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : filteredMushrooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="leaf-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>{t('mushroom.noResults')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMushrooms}
          keyExtractor={(item) => item.id}
          renderItem={renderMushroomItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

export default function MushroomGuideScreenWrapper() {
  return (
    <LanguageProvider>
      <MushroomGuideScreen />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  mushroomCard: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  mushroomImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 12,
  },
  noImage: {
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mushroomInfo: {
    flex: 1,
  },
  mushroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  mushroomLatinName: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 4,
  },
  mushroomSeason: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  edibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  edibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
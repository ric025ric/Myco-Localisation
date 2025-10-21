import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface MushroomLookalike {
  name: string;
  latin_name: string;
  difference: string;
  danger_level: string;
}

function AdminMushroomContent() {
  const { t } = useLanguage();
  const [commonName, setCommonName] = useState('');
  const [latinName, setLatinName] = useState('');
  const [edibility, setEdibility] = useState('comestible');
  const [season, setSeason] = useState('');
  const [description, setDescription] = useState('');
  const [characteristics, setCharacteristics] = useState('');
  const [habitat, setHabitat] = useState('');
  const [photoUrls, setPhotoUrls] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);  // Photos en base64
  const [lookalikes, setLookalikes] = useState<MushroomLookalike[]>([]);
  const [saving, setSaving] = useState(false);

  const edibilityOptions = [
    { value: 'comestible', label: t('guide.edible') },
    { value: 'toxique', label: t('guide.toxic') },
    { value: 'mortel', label: t('guide.deadly') },
    { value: 'non_comestible', label: t('guide.notEdible') },
    { value: 'comestible_conditionnel', label: t('guide.conditionallyEdible') },
  ];

  const dangerOptions = [
    { value: 'mortel', label: t('admin.dangerDeadly') },
    { value: 'toxique', label: t('admin.dangerToxic') },
    { value: 'non_comestible', label: t('admin.dangerNotEdible') },
  ];

  const addLookalike = () => {
    setLookalikes([
      ...lookalikes,
      { name: '', latin_name: '', difference: '', danger_level: 'toxique' },
    ]);
  };

  const updateLookalike = (index: number, field: keyof MushroomLookalike, value: string) => {
    const updated = [...lookalikes];
    updated[index][field] = value;
    setLookalikes(updated);
  };

  const removeLookalike = (index: number) => {
    const updated = lookalikes.filter((_, i) => i !== index);
    setLookalikes(updated);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission d\'accès à la galerie refusée');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,  // Compression pour réduire la taille
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhotos([...photos, base64Image]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert(t('common.error'), 'Erreur lors de la sélection de l\'image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission d\'accès à la caméra refusée');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.3,  // Compression pour réduire la taille
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setPhotos([...photos, base64Image]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('common.error'), 'Erreur lors de la prise de photo');
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    setPhotos(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!commonName.trim() || !latinName.trim() || !season.trim() || !description.trim() || !habitat.trim()) {
      Alert.alert(t('common.error'), t('admin.fillRequired'));
      return;
    }

    try {
      setSaving(true);

      // Parse characteristics and photo URLs
      const characteristicsArray = characteristics
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      const photoUrlsArray = photoUrls
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Filter out empty lookalikes
      const validLookalikes = lookalikes.filter(
        l => l.name.trim() && l.latin_name.trim() && l.difference.trim()
      );

      const mushroomData = {
        common_name: commonName.trim(),
        latin_name: latinName.trim(),
        edibility,
        season: season.trim(),
        description: description.trim(),
        characteristics: characteristicsArray,
        habitat: habitat.trim(),
        lookalikes: validLookalikes,
        photo_urls: photoUrlsArray,
        photos_base64: photos,  // Ajout des photos en base64
      };

      console.log('Sending to:', `${API_URL}/api/mushrooms`);
      console.log('Data:', JSON.stringify(mushroomData, null, 2));
      
      const response = await fetch(`${API_URL}/api/mushrooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mushroomData),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to save mushroom: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Success:', result);

      Alert.alert(
        t('common.success'),
        t('admin.success'),
        [
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving mushroom:', error);
      const errorMessage = error instanceof Error ? error.message : t('admin.error');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setSaving(false);
    }
  };

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
        <Text style={styles.headerTitle}>{t('admin.title')}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Common Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.commonName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.commonNamePlaceholder')}
              placeholderTextColor="#666"
              value={commonName}
              onChangeText={setCommonName}
            />
          </View>

          {/* Latin Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.latinName')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.latinNamePlaceholder')}
              placeholderTextColor="#666"
              value={latinName}
              onChangeText={setLatinName}
            />
          </View>

          {/* Edibility */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.edibility')}</Text>
            <View style={styles.optionsContainer}>
              {edibilityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    edibility === option.value && styles.optionButtonActive,
                  ]}
                  onPress={() => setEdibility(option.value)}
                >
                  <Text
                    style={[
                      styles.optionButtonText,
                      edibility === option.value && styles.optionButtonTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Season */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.season')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('admin.seasonPlaceholder')}
              placeholderTextColor="#666"
              value={season}
              onChangeText={setSeason}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.description')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('admin.descriptionPlaceholder')}
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Characteristics */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.characteristics')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('admin.characteristicsPlaceholder')}
              placeholderTextColor="#666"
              value={characteristics}
              onChangeText={setCharacteristics}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Habitat */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.habitat')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('admin.habitatPlaceholder')}
              placeholderTextColor="#666"
              value={habitat}
              onChangeText={setHabitat}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photo URLs */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('admin.photoUrls')}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={t('admin.photoUrlsPlaceholder')}
              placeholderTextColor="#666"
              value={photoUrls}
              onChangeText={setPhotoUrls}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photos (Base64) */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>Photos (Appareil)</Text>
              <View style={styles.photoButtonsContainer}>
                <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                  <Ionicons name="camera" size={20} color="#fff" />
                  <Text style={styles.photoButtonText}>Prendre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                  <Ionicons name="images" size={20} color="#fff" />
                  <Text style={styles.photoButtonText}>Galerie</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {photos.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosPreview}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoPreviewContainer}>
                    <Image source={{ uri: photo }} style={styles.photoPreview} />
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color="#f44336" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
            
            {photos.length === 0 && (
              <Text style={styles.noPhotosText}>Aucune photo ajoutée</Text>
            )}
          </View>

          {/* Lookalikes */}
          <View style={styles.inputGroup}>
            <View style={styles.sectionHeader}>
              <Text style={styles.label}>{t('mushroom.lookalikes')}</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={addLookalike}
              >
                <Ionicons name="add-circle" size={24} color="#4CAF50" />
                <Text style={styles.addButtonText}>{t('admin.addLookalike')}</Text>
              </TouchableOpacity>
            </View>

            {lookalikes.map((lookalike, index) => (
              <View key={index} style={styles.lookalikeCard}>
                <View style={styles.lookalikeHeader}>
                  <Text style={styles.lookalikeIndex}>Confusion #{index + 1}</Text>
                  <TouchableOpacity onPress={() => removeLookalike(index)}>
                    <Ionicons name="trash-outline" size={20} color="#F44336" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder={t('admin.lookalikeName')}
                  placeholderTextColor="#666"
                  value={lookalike.name}
                  onChangeText={(value) => updateLookalike(index, 'name', value)}
                />

                <TextInput
                  style={[styles.input, styles.inputSpacing]}
                  placeholder={t('admin.lookalikeLatinName')}
                  placeholderTextColor="#666"
                  value={lookalike.latin_name}
                  onChangeText={(value) => updateLookalike(index, 'latin_name', value)}
                />

                <TextInput
                  style={[styles.input, styles.textArea, styles.inputSpacing]}
                  placeholder={t('admin.lookalikeDifference')}
                  placeholderTextColor="#666"
                  value={lookalike.difference}
                  onChangeText={(value) => updateLookalike(index, 'difference', value)}
                  multiline
                  numberOfLines={3}
                />

                <Text style={[styles.label, styles.inputSpacing]}>{t('admin.lookalikeDanger')}</Text>
                <View style={styles.optionsContainer}>
                  {dangerOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionButton,
                        lookalike.danger_level === option.value && styles.optionButtonActive,
                      ]}
                      onPress={() => updateLookalike(index, 'danger_level', option.value)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          lookalike.danger_level === option.value && styles.optionButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Text style={styles.saveButtonText}>{t('common.loading')}</Text>
              </>
            ) : (
              <>
                <Ionicons name="save" size={24} color="#fff" />
                <Text style={styles.saveButtonText}>{t('admin.saveMushroom')}</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    color: '#fff',
    fontSize: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputSpacing: {
    marginTop: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#333',
  },
  optionButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  optionButtonTextActive: {
    color: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  lookalikeCard: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
  },
  lookalikeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lookalikeIndex: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  photoButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  photoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photosPreview: {
    marginTop: 12,
  },
  photoPreviewContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#3a3a3a',
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
  },
  noPhotosText: {
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  spacer: {
    height: 32,
  },
});

export default function AdminMushroomScreen() {
  return (
    <LanguageProvider>
      <AdminMushroomContent />
    </LanguageProvider>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLanguage } from '../contexts/LanguageContext';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface VersionInfo {
  min_version: string;
  min_version_code: number;
  latest_version: string;
  update_required: boolean;
  update_message_fr: string;
  update_message_en: string;
  play_store_url: string;
}

export function UpdateRequiredModal() {
  const { language } = useLanguage();
  const [updateRequired, setUpdateRequired] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/version`);
      const info: VersionInfo = await response.json();
      
      setVersionInfo(info);

      // Récupérer la version actuelle de l'app
      const currentVersion = Constants.expoConfig?.version || '0.0.0';
      const currentVersionCode = Constants.expoConfig?.android?.versionCode || 0;

      console.log('📱 Version actuelle:', currentVersion, 'versionCode:', currentVersionCode);
      console.log('🔒 Version minimale requise:', info.min_version, 'versionCode:', info.min_version_code);

      // Comparer les versionCodes (plus fiable que les strings)
      if (currentVersionCode < info.min_version_code) {
        console.log('⚠️  Mise à jour requise !');
        setUpdateRequired(true);
      } else {
        console.log('✅ Version à jour');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de version:', error);
      // En cas d'erreur, ne pas bloquer l'app
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    if (versionInfo?.play_store_url) {
      Linking.openURL(versionInfo.play_store_url);
    }
  };

  if (loading) {
    return null; // Ou un petit loader si vous voulez
  }

  if (!updateRequired || !versionInfo) {
    return null;
  }

  const message = language === 'fr' ? versionInfo.update_message_fr : versionInfo.update_message_en;
  const updateButtonText = language === 'fr' ? 'Mettre à jour' : 'Update';
  const currentVersionText = language === 'fr' ? 'Version actuelle' : 'Current version';
  const requiredVersionText = language === 'fr' ? 'Version requise' : 'Required version';

  return (
    <Modal
      visible={true}
      transparent={true}
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={80} color="#FF6B6B" />
          </View>

          <Text style={styles.title}>
            {language === 'fr' ? 'Mise à jour requise' : 'Update Required'}
          </Text>

          <Text style={styles.message}>{message}</Text>

          <View style={styles.versionInfo}>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>{currentVersionText}:</Text>
              <Text style={styles.versionValue}>
                {Constants.expoConfig?.version || '0.0.0'}
              </Text>
            </View>
            <View style={styles.versionRow}>
              <Text style={styles.versionLabel}>{requiredVersionText}:</Text>
              <Text style={styles.versionValueHighlight}>
                {versionInfo.min_version}+
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
          >
            <Ionicons name="download" size={24} color="#fff" />
            <Text style={styles.updateButtonText}>{updateButtonText}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            {language === 'fr' 
              ? 'Cette mise à jour est nécessaire pour la sécurité et la confidentialité de vos données.'
              : 'This update is necessary for the security and privacy of your data.'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  versionInfo: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 15,
    marginBottom: 25,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  versionLabel: {
    color: '#999',
    fontSize: 14,
  },
  versionValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  versionValueHighlight: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 15,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

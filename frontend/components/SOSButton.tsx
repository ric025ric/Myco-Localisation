import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

let Contacts: any = null;
if (Platform.OS !== 'web') {
  Contacts = require('expo-contacts');
}

interface SOSButtonProps {
  location: any;
}

export default function SOSButton({ location }: SOSButtonProps) {
  const { t } = useLanguage();

  const handleSOS = async () => {
    if (!location) {
      Alert.alert(t('common.error'), t('error.locationRequired'));
      return;
    }

    if (Platform.OS === 'web') {
      // Sur web, juste partager via le share API
      sharePosition();
      return;
    }

    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.error'), 'Permission contacts requise');
        return;
      }

      sharePosition();
    } catch (error) {
      console.error('Error requesting contacts permission:', error);
      sharePosition();
    }
  };

  const sharePosition = async () => {
    const { latitude, longitude } = location.coords;
    const googleMapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
    const message = `🚨 SOS - Je partage ma position avec vous!\n\nCoordonnées: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\nOuvrir dans Google Maps: ${googleMapsLink}`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing position:', error);
      Alert.alert(t('common.error'), t('sos.error'));
    }
  };

  return (
    <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
      <Ionicons name="alert-circle" size={24} color="#fff" />
      <Text style={styles.sosText}>{t('home.sos')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  sosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  sosText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
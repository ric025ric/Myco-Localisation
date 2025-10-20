import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface ShareSpotModalProps {
  visible: boolean;
  onClose: () => void;
  spot: any;
}

export default function ShareSpotModal({ visible, onClose, spot }: ShareSpotModalProps) {
  const { t } = useLanguage();

  if (!spot) return null;

  const handleShare = async () => {
    try {
      const googleMapsLink = `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`;
      const sharedBy = spot.created_by || 'Un utilisateur';
      
      const message = `🍄 Spot de champignons partagé !\n\nType : ${spot.mushroom_type}\n${spot.notes ? `Notes : ${spot.notes}\n` : ''}Partagé par : ${sharedBy}\n\n📍 Coordonnées : ${spot.latitude.toFixed(6)}, ${spot.longitude.toFixed(6)}\n\nOuvrir dans Google Maps:\n${googleMapsLink}`;
      
      await Share.share({
        message,
        title: `Spot: ${spot.mushroom_type}`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>{t('share.title')}</Text>

          <View style={styles.spotInfo}>
            <Text style={styles.spotType}>{spot.mushroom_type}</Text>
            {spot.notes && <Text style={styles.spotNotes}>{spot.notes}</Text>}
          </View>

          <View style={styles.qrContainer}>
            <Text style={styles.qrText}>{t('share.qrcode')}</Text>
            <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
              <View style={styles.qrCodeWrapper}>
                <QRCode
                  value={shareLink}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </View>
            </ViewShot>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleCopyLink}>
            <Ionicons name="copy-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>{t('share.copyLink')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.shareButton]} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>{t('share.shareButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  spotInfo: {
    backgroundColor: '#2a2a2a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  spotType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  spotNotes: {
    fontSize: 14,
    color: '#ccc',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrText: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 12,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  shareButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';

interface PinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ADMIN_PIN = '160810';

export default function PinModal({ visible, onClose, onSuccess }: PinModalProps) {
  const { t } = useLanguage();
  const [pin, setPin] = useState('');

  const handleSubmit = () => {
    if (pin === ADMIN_PIN) {
      setPin('');
      onSuccess();
    } else {
      Alert.alert(
        t('common.error'),
        'Code PIN incorrect',
        [{ text: t('common.ok') }]
      );
      setPin('');
    }
  };

  const handleClose = () => {
    setPin('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Ionicons name="lock-closed" size={48} color="#4CAF50" />
          </View>

          <Text style={styles.title}>Accès Admin</Text>
          <Text style={styles.subtitle}>Entrez le code PIN à 6 chiffres</Text>

          <TextInput
            style={styles.input}
            placeholder="000000"
            placeholderTextColor="#666"
            value={pin}
            onChangeText={setPin}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            autoFocus
            onSubmitEditing={handleSubmit}
          />

          <TouchableOpacity
            style={[styles.submitButton, pin.length !== 6 && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={pin.length !== 6}
          >
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.submitButtonText}>Valider</Text>
          </TouchableOpacity>
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
  modal: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 8,
    borderWidth: 2,
    borderColor: '#4CAF50',
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%',
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

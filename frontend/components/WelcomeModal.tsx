import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { UserService } from '../services/UserService';

interface WelcomeModalProps {
  visible: boolean;
  onComplete: (username: string) => void;
}

export default function WelcomeModal({ visible, onComplete }: WelcomeModalProps) {
  const { t } = useLanguage();
  const [username, setUsername] = useState('');
  const [importing, setImporting] = useState(false);

  const handleContinue = () => {
    if (username.trim()) {
      onComplete(username.trim());
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const result = await UserService.importAccount();
      if (result.success && result.account) {
        Alert.alert(
          '✅ Compte restauré',
          `Bienvenue ${result.account.username} !`,
          [{ text: 'OK', onPress: () => onComplete(result.account!.username) }]
        );
      } else {
        Alert.alert('❌ Erreur', result.error || 'Impossible d\'importer le compte');
      }
    } catch (error) {
      Alert.alert('❌ Erreur', 'Une erreur est survenue');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="leaf" size={64} color="#4CAF50" />
            </View>
            
            <Text style={styles.title}>{t('welcome.title')}</Text>
            <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={24} color="#4CAF50" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={t('welcome.placeholder')}
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoFocus
                maxLength={20}
                testID="welcome-username-input"
              />
            </View>
            
            <TouchableOpacity
              style={[styles.button, !username.trim() && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={!username.trim()}
              testID="welcome-continue-button"
            >
              <Text style={styles.buttonText}>{t('welcome.continue')}</Text>
              <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    padding: 32,
    width: '100%',
    maxWidth: 400,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    paddingVertical: 16,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

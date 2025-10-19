import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { LanguageProvider, useLanguage } from '../contexts/LanguageContext';

function SettingsContent() {
  const { language, setLanguage, t } = useLanguage();

  const languageOptions = [
    { key: 'fr' as const, label: t('settings.french') },
    { key: 'en' as const, label: t('settings.english') },
  ];

  const handleLanguageChange = async (newLanguage: 'fr' | 'en') => {
    await setLanguage(newLanguage);
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
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <Text style={styles.sectionDescription}>{t('settings.languageDescription')}</Text>
          
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.languageOption,
                language === option.key && styles.languageOptionSelected
              ]}
              onPress={() => handleLanguageChange(option.key)}
            >
              <View style={styles.languageOptionContent}>
                <Text style={[
                  styles.languageOptionText,
                  language === option.key && styles.languageOptionTextSelected
                ]}>
                  {option.label}
                </Text>
                {language === option.key && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.about')}</Text>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t('app.title')}</Text>
            <Text style={styles.aboutValue}>{t('app.subtitle')}</Text>
          </View>
          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>{t('settings.version')}</Text>
            <Text style={styles.aboutValue}>{Constants.expoConfig?.version || '1.0.0'}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.mushroomIcon}
            />
            <Text style={styles.footerText}>{t('app.title')}</Text>
          </View>
          <Text style={styles.footerSubtext}>
            {t('app.subtitle')}
          </Text>
        </View>
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
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
    lineHeight: 20,
  },
  languageOption: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#333',
  },
  languageOptionSelected: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  languageOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  languageOptionTextSelected: {
    color: '#4CAF50',
  },
  aboutItem: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  aboutValue: {
    fontSize: 14,
    color: '#ccc',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default function SettingsScreen() {
  return (
    <LanguageProvider>
      <SettingsContent />
    </LanguageProvider>
  );
}
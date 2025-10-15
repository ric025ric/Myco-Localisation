import React from 'react';
import { Slot } from 'expo-router';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Slot />
    </LanguageProvider>
  );
}
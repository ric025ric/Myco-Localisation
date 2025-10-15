import React from 'react';
import { Stack } from 'expo-router';
import { LanguageProvider } from '../contexts/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="add-spot" />
        <Stack.Screen name="map" />
        <Stack.Screen name="spots-list" />
        <Stack.Screen name="spot-details/[id]" />
        <Stack.Screen name="settings" />
      </Stack>
    </LanguageProvider>
  );
}
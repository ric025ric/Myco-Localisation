import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { AdService } from '../services/AdService';

export function AdBanner() {
  const [isAdFree, setIsAdFree] = useState(false);

  useEffect(() => {
    checkAdFree();
  }, []);

  const checkAdFree = async () => {
    const adFree = await AdService.isAdFree();
    setIsAdFree(adFree);
  };

  if (isAdFree) {
    // L'utilisateur est en mode sans pub
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={AdService.getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    paddingVertical: 8,
  },
});

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Import conditionnel pour éviter les erreurs sur web
let mobileAds: any = null;
let InterstitialAd: any = null;
let AdEventType: any = null;

if (Platform.OS !== 'web') {
  const GoogleAds = require('react-native-google-mobile-ads');
  mobileAds = GoogleAds.default;
  InterstitialAd = GoogleAds.InterstitialAd;
  AdEventType = GoogleAds.AdEventType;
}

// Configuration des IDs de production
const AD_UNIT_IDS = {
  banner: 'ca-app-pub-6288945556818548/1575403137',
  interstitial: 'ca-app-pub-6288945556818548/9061628022',
};

const AD_FREE_KEY = 'ad_free_until';
const SPOTS_SAVED_KEY = 'spots_saved_count';

export class AdService {
  private static interstitial: InterstitialAd | null = null;
  private static rewarded: RewardedAd | null = null;

  /**
   * Initialiser AdMob
   */
  static async initialize() {
    // Ne pas initialiser sur web
    if (Platform.OS === 'web' || !mobileAds) {
      console.log('⚠️  AdMob not available on web platform');
      return;
    }

    try {
      await mobileAds().initialize();
      console.log('✅ AdMob initialized');
      
      // Précharger l'interstitiel
      this.loadInterstitial();
      
      // Précharger la rewarded ad
      this.loadRewarded();
    } catch (error) {
      console.error('❌ AdMob initialization error:', error);
    }
  }

  /**
   * Vérifier si l'utilisateur est en mode sans pub
   */
  static async isAdFree(): Promise<boolean> {
    try {
      const adFreeUntil = await AsyncStorage.getItem(AD_FREE_KEY);
      if (!adFreeUntil) return false;

      const expiryDate = new Date(adFreeUntil);
      const now = new Date();

      if (now < expiryDate) {
        console.log('🎉 User is ad-free until:', expiryDate);
        return true;
      } else {
        // Expired, remove key
        await AsyncStorage.removeItem(AD_FREE_KEY);
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Activer le mode sans pub pour 24h
   */
  static async enableAdFree24h() {
    try {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 24);
      await AsyncStorage.setItem(AD_FREE_KEY, expiryDate.toISOString());
      console.log('✅ Ad-free mode enabled until:', expiryDate);
    } catch (error) {
      console.error('❌ Error enabling ad-free:', error);
    }
  }

  /**
   * Obtenir l'ID de la bannière
   */
  static getBannerAdUnitId(): string {
    return AD_UNIT_IDS.banner;
  }

  /**
   * Charger l'interstitiel
   */
  static loadInterstitial() {
    if (Platform.OS === 'web' || !InterstitialAd) return;
    
    this.interstitial = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial);
    
    this.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      console.log('✅ Interstitial loaded');
    });

    this.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('👋 Interstitial closed');
      // Précharger le prochain
      this.loadInterstitial();
    });

    this.interstitial.load();
  }

  /**
   * Afficher l'interstitiel après avoir sauvegardé des spots
   */
  static async showInterstitialAfterSpotSaved(): Promise<void> {
    if (Platform.OS === 'web' || !InterstitialAd) return;
    
    try {
      // Vérifier si l'utilisateur est en mode sans pub
      const isAdFree = await this.isAdFree();
      if (isAdFree) {
        console.log('🎉 User is ad-free, skipping interstitial');
        return;
      }

      // Incrémenter le compteur de spots sauvegardés
      const countStr = await AsyncStorage.getItem(SPOTS_SAVED_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const newCount = count + 1;
      await AsyncStorage.setItem(SPOTS_SAVED_KEY, newCount.toString());

      // Afficher l'interstitiel tous les 3 spots
      if (newCount % 3 === 0) {
        if (this.interstitial && this.interstitial.loaded) {
          console.log('📺 Showing interstitial after 3 spots');
          await this.interstitial.show();
        } else {
          console.log('⏳ Interstitial not ready yet, loading...');
          this.loadInterstitial();
        }
      } else {
        console.log(`📊 Spots count: ${newCount}/3`);
      }
    } catch (error) {
      console.error('❌ Error showing interstitial:', error);
    }
  }

  /**
   * Charger la rewarded ad
   */
  static loadRewarded() {
    if (Platform.OS === 'web' || !RewardedAd) return;
    
    this.rewarded = RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded);

    this.rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      console.log('✅ Rewarded ad loaded');
    });

    this.rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('🎁 User earned reward:', reward);
      // Activer le mode sans pub 24h
      this.enableAdFree24h();
    });

    this.rewarded.load();
  }

  /**
   * Afficher la rewarded ad (mode sans pub 24h)
   */
  static async showRewardedAd(): Promise<{ success: boolean; rewarded: boolean }> {
    if (Platform.OS === 'web' || !RewardedAd) {
      return { success: false, rewarded: false };
    }
    
    try {
      if (this.rewarded && this.rewarded.loaded) {
        console.log('📺 Showing rewarded ad');
        await this.rewarded.show();
        // Recharger la prochaine
        this.loadRewarded();
        return { success: true, rewarded: true };
      } else {
        console.log('⏳ Rewarded ad not ready, loading...');
        this.loadRewarded();
        return { success: false, rewarded: false };
      }
    } catch (error) {
      console.error('❌ Error showing rewarded ad:', error);
      return { success: false, rewarded: false };
    }
  }

  /**
   * Vérifier si la rewarded ad est prête
   */
  static isRewardedAdReady(): boolean {
    if (Platform.OS === 'web' || !RewardedAd) return false;
    return this.rewarded !== null && this.rewarded.loaded;
  }
}

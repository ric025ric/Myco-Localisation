import mobileAds, {
  BannerAd,
  BannerAdSize,
  TestIds,
  InterstitialAd,
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuration des IDs
const AD_UNIT_IDS = {
  banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-6288945556818548/1575403137',
  interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-6288945556818548/9061628022',
  rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-6288945556818548/4930811323',
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

      // Afficher l'interstitiel tous les 5 spots
      if (newCount % 5 === 0) {
        if (this.interstitial && this.interstitial.loaded) {
          console.log('📺 Showing interstitial after 5 spots');
          await this.interstitial.show();
        } else {
          console.log('⏳ Interstitial not ready yet');
          this.loadInterstitial();
        }
      }
    } catch (error) {
      console.error('❌ Error showing interstitial:', error);
    }
  }

  /**
   * Charger la rewarded ad
   */
  static loadRewarded() {
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
    return this.rewarded !== null && this.rewarded.loaded;
  }
}

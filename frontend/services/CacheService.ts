import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = 'cache_';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class CacheService {
  /**
   * Sauvegarder des données dans le cache
   */
  static async set<T>(key: string, data: T): Promise<void> {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(
        `${CACHE_PREFIX}${key}`,
        JSON.stringify(cacheItem)
      );
    } catch (error) {
      console.error('CacheService: Error setting cache', error);
    }
  }

  /**
   * Récupérer des données du cache
   * Retourne null si le cache est expiré ou inexistant
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!cached) {
        return null;
      }

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheItem.timestamp;

      // Vérifier si le cache est encore valide
      if (age > CACHE_EXPIRY_MS) {
        // Cache expiré, le supprimer
        await this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('CacheService: Error getting cache', error);
      return null;
    }
  }

  /**
   * Supprimer une entrée du cache
   */
  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
    } catch (error) {
      console.error('CacheService: Error removing cache', error);
    }
  }

  /**
   * Vider tout le cache
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('CacheService: Error clearing cache', error);
    }
  }

  /**
   * Vérifier si une clé existe dans le cache et est valide
   */
  static async has(key: string): Promise<boolean> {
    const data = await this.get(key);
    return data !== null;
  }
}

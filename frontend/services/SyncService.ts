import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const PENDING_SPOTS_KEY = 'pending_spots_sync';
const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export interface PendingSpot {
  id_local: string;
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64: string | null;
  created_by: string;
  timestamp: string;
  sync_status: 'pending' | 'syncing' | 'failed';
  sync_attempts: number;
  error_message?: string;
}

export class SyncService {
  /**
   * Ajouter un spot à la queue de synchronisation
   */
  static async addPendingSpot(spot: Omit<PendingSpot, 'id_local' | 'timestamp' | 'sync_status' | 'sync_attempts'>): Promise<string> {
    try {
      const pendingSpots = await this.getPendingSpots();
      
      const id_local = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const pendingSpot: PendingSpot = {
        ...spot,
        id_local,
        timestamp: new Date().toISOString(),
        sync_status: 'pending',
        sync_attempts: 0,
      };
      
      pendingSpots.push(pendingSpot);
      await AsyncStorage.setItem(PENDING_SPOTS_KEY, JSON.stringify(pendingSpots));
      
      console.log('✅ Spot saved locally:', id_local);
      return id_local;
    } catch (error) {
      console.error('❌ Error saving pending spot:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les spots en attente de sync
   */
  static async getPendingSpots(): Promise<PendingSpot[]> {
    try {
      const data = await AsyncStorage.getItem(PENDING_SPOTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting pending spots:', error);
      return [];
    }
  }

  /**
   * Compter les spots en attente
   */
  static async getPendingSpotsCount(): Promise<number> {
    const spots = await this.getPendingSpots();
    return spots.filter(s => s.sync_status === 'pending' || s.sync_status === 'failed').length;
  }

  /**
   * Vérifier si le réseau est disponible
   */
  static async isNetworkAvailable(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected === true && state.isInternetReachable === true;
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  /**
   * Synchroniser un spot spécifique
   */
  static async syncSpot(spot: PendingSpot): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔄 Syncing spot:', spot.id_local);
      
      // Préparer les données pour le serveur
      const spotData = {
        latitude: spot.latitude,
        longitude: spot.longitude,
        mushroom_type: spot.mushroom_type,
        notes: spot.notes,
        photo_base64: spot.photo_base64,
        created_by: spot.created_by,
      };

      const response = await fetch(`${EXPO_PUBLIC_BACKEND_URL}/api/mushroom-spots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(spotData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Spot synced successfully:', spot.id_local, '→', result.id);
      
      return { success: true };
    } catch (error: any) {
      console.error('❌ Sync failed for spot:', spot.id_local, error);
      return { 
        success: false, 
        error: error.message || 'Erreur de synchronisation' 
      };
    }
  }

  /**
   * Synchroniser tous les spots en attente
   */
  static async syncAllPendingSpots(): Promise<{
    total: number;
    synced: number;
    failed: number;
  }> {
    const isOnline = await this.isNetworkAvailable();
    
    if (!isOnline) {
      console.log('⚠️ No network connection, skipping sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    const pendingSpots = await this.getPendingSpots();
    const spotsToSync = pendingSpots.filter(
      s => s.sync_status === 'pending' || s.sync_status === 'failed'
    );

    if (spotsToSync.length === 0) {
      console.log('✅ No spots to sync');
      return { total: 0, synced: 0, failed: 0 };
    }

    console.log(`🔄 Starting sync for ${spotsToSync.length} spot(s)...`);

    let synced = 0;
    let failed = 0;
    const updatedSpots: PendingSpot[] = [];

    for (const spot of pendingSpots) {
      if (spot.sync_status !== 'pending' && spot.sync_status !== 'failed') {
        // Already synced, keep as is
        continue;
      }

      // Update status to syncing
      spot.sync_status = 'syncing';
      spot.sync_attempts = (spot.sync_attempts || 0) + 1;

      const result = await this.syncSpot(spot);

      if (result.success) {
        synced++;
        // Don't add to updatedSpots - remove from queue
        console.log('✅ Removed synced spot from queue:', spot.id_local);
      } else {
        failed++;
        spot.sync_status = 'failed';
        spot.error_message = result.error;
        updatedSpots.push(spot);
      }
    }

    // Save updated pending spots (only failed ones remain)
    await AsyncStorage.setItem(PENDING_SPOTS_KEY, JSON.stringify(updatedSpots));

    console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`);
    
    return {
      total: spotsToSync.length,
      synced,
      failed,
    };
  }

  /**
   * Supprimer tous les spots synchronisés
   */
  static async clearSyncedSpots(): Promise<void> {
    try {
      const pendingSpots = await this.getPendingSpots();
      const remainingSpots = pendingSpots.filter(
        s => s.sync_status === 'pending' || s.sync_status === 'failed'
      );
      await AsyncStorage.setItem(PENDING_SPOTS_KEY, JSON.stringify(remainingSpots));
    } catch (error) {
      console.error('Error clearing synced spots:', error);
    }
  }

  /**
   * Supprimer un spot spécifique de la queue
   */
  static async removePendingSpot(id_local: string): Promise<void> {
    try {
      const pendingSpots = await this.getPendingSpots();
      const updated = pendingSpots.filter(s => s.id_local !== id_local);
      await AsyncStorage.setItem(PENDING_SPOTS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error removing pending spot:', error);
    }
  }
}

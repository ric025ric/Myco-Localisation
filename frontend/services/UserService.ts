import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const USER_ID_KEY = 'user_id';
const USERNAME_KEY = 'myco_username';

export interface UserAccount {
  user_id: string;
  username: string;
  created_at: string;
}

export class UserService {
  /**
   * Générer un UUID unique pour l'utilisateur
   */
  static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obtenir ou créer l'ID utilisateur
   */
  static async getUserId(): Promise<string> {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = this.generateUserId();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
      await AsyncStorage.setItem(`${USER_ID_KEY}_created_at`, new Date().toISOString());
      console.log('✅ New user ID generated:', userId);
    }
    
    return userId;
  }

  /**
   * Sauvegarder le pseudo
   */
  static async setUsername(username: string): Promise<void> {
    await AsyncStorage.setItem(USERNAME_KEY, username);
  }

  /**
   * Récupérer le pseudo
   */
  static async getUsername(): Promise<string | null> {
    return await AsyncStorage.getItem(USERNAME_KEY);
  }

  /**
   * Obtenir le compte complet
   */
  static async getUserAccount(): Promise<UserAccount | null> {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    const username = await AsyncStorage.getItem(USERNAME_KEY);
    const createdAt = await AsyncStorage.getItem(`${USER_ID_KEY}_created_at`);

    if (!userId || !username) {
      return null;
    }

    return {
      user_id: userId,
      username: username,
      created_at: createdAt || new Date().toISOString(),
    };
  }

  /**
   * Exporter le compte dans un fichier
   */
  static async exportAccount(): Promise<{ success: boolean; error?: string; filePath?: string }> {
    try {
      const account = await this.getUserAccount();
      
      if (!account) {
        return { success: false, error: 'Aucun compte à exporter' };
      }

      // Créer le contenu du fichier
      const exportData = {
        version: '1.0',
        app: 'Myco Localisation',
        exported_at: new Date().toISOString(),
        account: account,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const fileName = `myco_account_${account.username}_${Date.now()}.myco`;

      if (Platform.OS === 'android') {
        // Sur Android, utiliser le Storage Access Framework pour sauvegarder où l'utilisateur veut
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        
        if (!permissions.granted) {
          return { success: false, error: 'Permission refusée' };
        }

        // Créer le fichier dans le dossier choisi par l'utilisateur
        const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          fileName,
          'application/json'
        );

        await FileSystem.writeAsStringAsync(fileUri, jsonContent);
        
        console.log('✅ Account exported to:', fileUri);
        return { success: true, filePath: 'Téléchargements ou dossier choisi' };
      } else {
        // Sur iOS/Web, utiliser le système de partage
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, jsonContent);

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Sauvegarder mon compte Myco Localisation',
          });
        }

        console.log('✅ Account exported:', fileName);
        return { success: true };
      }
    } catch (error: any) {
      console.error('❌ Export error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Importer un compte depuis un fichier
   */
  static async importAccount(): Promise<{ success: boolean; account?: UserAccount; error?: string }> {
    try {
      // Ouvrir le sélecteur de fichier
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return { success: false, error: 'Import annulé' };
      }

      const file = result.assets[0];
      
      // Lire le contenu du fichier
      let fileContent: string;
      
      if (Platform.OS === 'web') {
        const response = await fetch(file.uri);
        fileContent = await response.text();
      } else {
        // Utiliser expo-file-system pour mobile
        fileContent = await FileSystem.readAsStringAsync(file.uri);
      }

      // Parser le JSON
      const importData = JSON.parse(fileContent);

      // Vérifier la structure
      if (!importData.account || !importData.account.user_id || !importData.account.username) {
        return { success: false, error: 'Fichier invalide' };
      }

      const account: UserAccount = importData.account;

      // Sauvegarder le compte
      await AsyncStorage.setItem(USER_ID_KEY, account.user_id);
      await AsyncStorage.setItem(USERNAME_KEY, account.username);
      await AsyncStorage.setItem(`${USER_ID_KEY}_created_at`, account.created_at);

      console.log('✅ Account imported:', account.user_id);
      return { success: true, account };
    } catch (error: any) {
      console.error('❌ Import error:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'import' };
    }
  }

  /**
   * Réinitialiser le compte (pour les tests)
   */
  static async resetAccount(): Promise<void> {
    await AsyncStorage.removeItem(USER_ID_KEY);
    await AsyncStorage.removeItem(USERNAME_KEY);
    await AsyncStorage.removeItem(`${USER_ID_KEY}_created_at`);
    console.log('⚠️ Account reset');
  }

  /**
   * Vérifier si un compte existe
   */
  static async hasAccount(): Promise<boolean> {
    const userId = await AsyncStorage.getItem(USER_ID_KEY);
    const username = await AsyncStorage.getItem(USERNAME_KEY);
    return !!(userId && username);
  }
}

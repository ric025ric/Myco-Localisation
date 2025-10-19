import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'fr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  fr: {
    // Navigation & Main Screen
    'app.title': 'Myco Localisation',
    'app.subtitle': 'Suivez vos découvertes de cueillette',
    
    // Home Screen
    'home.addSpot': 'Ajouter un Spot de Champignon',
    'home.addSpotSubtext': 'Marquer votre localisation actuelle',
    'home.carLocation': 'Localiser ma Voiture',
    'home.carLocationSubtext': 'Sauvegarder et retrouver votre véhicule',
    'home.viewMap': 'Voir la Carte',
    'home.viewMapSubtext': 'Voir tous vos spots',
    'home.spotsList': 'Liste des Spots',
    'home.spotsListSubtext': 'Parcourir vos trouvailles',
    'home.locationEnabled': '✅ Localisation activée',
    'home.locationDisabled': '❌ Localisation désactivée',
    'home.gettingLocation': 'Obtention de votre localisation...',
    'home.sos': 'Je suis perdu',
    'home.settings': 'Paramètres',
    
    // Welcome Screen
    'welcome.title': 'Bienvenue sur Myco Localisation !',
    'welcome.subtitle': 'Pour commencer, quel est votre nom ou pseudo ?',
    'welcome.placeholder': 'Votre nom ou pseudo',
    'welcome.continue': 'Continuer',
    
    // Share Spot
    'share.title': 'Partager ce Spot',
    'share.qrcode': 'Scannez ce QR Code',
    'share.copyLink': 'Copier le lien',
    'share.shareButton': 'Partager',
    'share.linkCopied': 'Lien copié !',
    'share.sharedFrom': 'Partagé depuis:',
    
    // SOS
    'sos.title': 'Partage de Position Urgence',
    'sos.message': 'Sélectionnez un contact pour partager votre position',
    'sos.selectContact': 'Sélectionner un contact',
    'sos.sent': 'Position partagée avec succès',
    'sos.error': 'Impossible de partager la position',
    
    // Add Spot Screen
    'addSpot.title': 'Ajouter un Spot de Champignon',
    'addSpot.currentLocation': 'Localisation Actuelle',
    'addSpot.accuracy': 'Précision',
    'addSpot.mushroomType': 'Type de Champignon *',
    'addSpot.mushroomTypePlaceholder': 'ex: Girolle, Cèpe, Champignon Inconnu',
    'addSpot.notes': 'Notes',
    'addSpot.notesPlaceholder': 'Ajoutez des détails sur la taille, l\'habitat, l\'état...',
    'addSpot.photo': 'Photo',
    'addSpot.addPhoto': 'Ajouter une Photo',
    'addSpot.addPhotoSubtext': 'Prendre ou sélectionner une photo',
    'addSpot.changePhoto': 'Changer la Photo',
    'addSpot.saveSpot': 'Sauvegarder le Spot',
    'addSpot.success': 'Succès !',
    'addSpot.successMessage': 'Spot de champignon sauvegardé avec succès.',
    
    // Map Screen  
    'map.title': 'Carte des Champignons',
    'map.loadingMap': 'Chargement de la carte...',
    'map.spotsCount': 'spots',
    'map.spot': 'spot',
    'map.gpsActive': 'GPS actif',
    
    // Spots List Screen
    'spotsList.title': 'Mes Spots',
    'spotsList.spotsFound': 'spots trouvés',
    'spotsList.spotFound': 'spot trouvé',
    'spotsList.loadingSpots': 'Chargement de vos spots...',
    'spotsList.noSpots': 'Aucun spot de champignon pour l\'instant',
    'spotsList.noSpotsText': 'Commencez à explorer et ajoutez votre première trouvaille !',
    'spotsList.addFirstSpot': 'Ajouter le Premier Spot',
    'spotsList.view': 'Voir',
    'spotsList.delete': 'Supprimer',
    'spotsList.found': 'Trouvé',
    
    // Spot Details Screen
    'spotDetails.mushroomType': 'Type de Champignon',
    'spotDetails.foundOn': 'Trouvé le',
    'spotDetails.location': 'Localisation',
    'spotDetails.openInMaps': 'Ouvrir dans Maps',
    'spotDetails.notes': 'Notes',
    'spotDetails.details': 'Détails',
    'spotDetails.spotId': 'ID du Spot',
    'spotDetails.addedBy': 'Ajouté par',
    'spotDetails.share': 'Partager',
    'spotDetails.navigate': 'Naviguer',
    'spotDetails.delete': 'Supprimer',
    'spotDetails.notFound': 'Spot non trouvé',
    'spotDetails.loading': 'Chargement des détails du spot...',
    
    // Settings Screen
    'settings.title': 'Paramètres',
    'settings.language': 'Langue',
    'settings.languageDescription': 'Choisissez votre langue préférée',
    'settings.french': 'Français',
    'settings.english': 'English',
    'settings.about': 'À Propos',
    'settings.version': 'Version 1.0.0',
    
    // Common & Alerts
    'common.ok': 'OK',
    'common.cancel': 'Annuler',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Errors & Permissions
    'error.location': 'Impossible d\'obtenir votre localisation. Veuillez réessayer.',
    'error.locationRequired': 'L\'accès à la localisation est requis pour cette fonctionnalité.',
    'error.locationRequiredSpot': 'L\'accès à la localisation est requis pour ajouter des spots.',
    'error.cameraRequired': 'L\'accès à la caméra est requis pour prendre des photos.',
    'error.galleryRequired': 'L\'accès à la galerie est requis pour sélectionner des photos.',
    'error.mushroomTypeRequired': 'Veuillez saisir le type de champignon.',
    'error.saveSpot': 'Impossible de sauvegarder le spot. Veuillez réessayer.',
    'error.loadSpots': 'Impossible de charger les spots. Veuillez réessayer.',
    'error.deleteSpot': 'Impossible de supprimer le spot. Veuillez réessayer.',
    'error.loadMap': 'Impossible de charger les données de la carte. Veuillez réessayer.',
    
    // Delete Confirmations
    'delete.spotTitle': 'Supprimer le Spot',
    'delete.spotMessage': 'Êtes-vous sûr de vouloir supprimer ce spot de champignon ?',
    'delete.success': 'Spot de champignon supprimé avec succès.',
    
    // Car Location
    'car.save': 'Sauvegarder Position Voiture',
    'car.saved': 'Position de voiture sauvegardée !',
    'car.navigate': 'Naviguer vers ma Voiture',
    'car.notSaved': 'Aucune position de voiture sauvegardée',
    'car.distance': 'Distance',
    'car.saveCurrentLocation': 'Sauvegarder cette position comme emplacement de ma voiture ?',
    'car.delete': 'Supprimer Position',
    'car.deleteConfirm': 'Supprimer la position de voiture sauvegardée ?',
    'car.deleted': 'Position de voiture supprimée.',
  },
  
  en: {
    // Navigation & Main Screen
    'app.title': 'Myco Localisation',
    'app.subtitle': 'Track your foraging discoveries',
    
    // Home Screen
    'home.addSpot': 'Add Mushroom Spot',
    'home.addSpotSubtext': 'Mark your current location',
    'home.carLocation': 'Locate My Car',
    'home.carLocationSubtext': 'Save and find your vehicle',
    'home.viewMap': 'View Map',
    'home.viewMapSubtext': 'See all your spots',
    'home.spotsList': 'Spots List',
    'home.spotsListSubtext': 'Browse your findings',
    'home.locationEnabled': '✅ Location enabled',
    'home.locationDisabled': '❌ Location disabled',
    'home.gettingLocation': 'Getting your location...',
    'home.sos': "I'm lost",
    'home.settings': 'Settings',
    
    // Welcome Screen
    'welcome.title': 'Welcome to Myco Localisation!',
    'welcome.subtitle': 'To get started, what is your name or nickname?',
    'welcome.placeholder': 'Your name or nickname',
    'welcome.continue': 'Continue',
    
    // Share Spot
    'share.title': 'Share this Spot',
    'share.qrcode': 'Scan this QR Code',
    'share.copyLink': 'Copy link',
    'share.shareButton': 'Share',
    'share.linkCopied': 'Link copied!',
    'share.sharedFrom': 'Shared from:',
    
    // SOS
    'sos.title': 'Emergency Position Sharing',
    'sos.message': 'Select a contact to share your position',
    'sos.selectContact': 'Select contact',
    'sos.sent': 'Position shared successfully',
    'sos.error': 'Unable to share position',
    
    // Add Spot Screen
    'addSpot.title': 'Add Mushroom Spot',
    'addSpot.currentLocation': 'Current Location',
    'addSpot.accuracy': 'Accuracy',
    'addSpot.mushroomType': 'Mushroom Type *',
    'addSpot.mushroomTypePlaceholder': 'e.g., Chanterelle, Porcini, Unknown',
    'addSpot.notes': 'Notes',
    'addSpot.notesPlaceholder': 'Add details about size, habitat, condition...',
    'addSpot.photo': 'Photo',
    'addSpot.addPhoto': 'Add Photo',
    'addSpot.addPhotoSubtext': 'Take or select a photo',
    'addSpot.changePhoto': 'Change Photo',
    'addSpot.saveSpot': 'Save Spot',
    'addSpot.success': 'Success!',
    'addSpot.successMessage': 'Mushroom spot saved successfully.',
    
    // Map Screen
    'map.title': 'Mushroom Map',
    'map.loadingMap': 'Loading map...',
    'map.spotsCount': 'spots',
    'map.spot': 'spot',
    'map.gpsActive': 'GPS active',
    
    // Spots List Screen
    'spotsList.title': 'My Spots',
    'spotsList.spotsFound': 'spots found',
    'spotsList.spotFound': 'spot found',
    'spotsList.loadingSpots': 'Loading your spots...',
    'spotsList.noSpots': 'No mushroom spots yet',
    'spotsList.noSpotsText': 'Start exploring and add your first find!',
    'spotsList.addFirstSpot': 'Add First Spot',
    'spotsList.view': 'View',
    'spotsList.delete': 'Delete',
    'spotsList.found': 'Found',
    
    // Spot Details Screen
    'spotDetails.mushroomType': 'Mushroom Type',
    'spotDetails.foundOn': 'Found On',
    'spotDetails.location': 'Location',
    'spotDetails.openInMaps': 'Open in Maps',
    'spotDetails.notes': 'Notes',
    'spotDetails.details': 'Details',
    'spotDetails.spotId': 'Spot ID',
    'spotDetails.addedBy': 'Added by',
    'spotDetails.share': 'Share',
    'spotDetails.navigate': 'Navigate',
    'spotDetails.delete': 'Delete',
    'spotDetails.notFound': 'Spot not found',
    'spotDetails.loading': 'Loading spot details...',
    
    // Settings Screen
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.languageDescription': 'Choose your preferred language',
    'settings.french': 'Français',
    'settings.english': 'English',
    'settings.about': 'About',
    'settings.version': 'Version 1.0.0',
    
    // Common & Alerts
    'common.ok': 'OK',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    
    // Errors & Permissions
    'error.location': 'Could not get your location. Please try again.',
    'error.locationRequired': 'Location access is required for this feature.',
    'error.locationRequiredSpot': 'Location access is required to add mushroom spots.',
    'error.cameraRequired': 'Camera access is required to take photos.',
    'error.galleryRequired': 'Gallery access is required to select photos.',
    'error.mushroomTypeRequired': 'Please enter the mushroom type.',
    'error.saveSpot': 'Could not save mushroom spot. Please try again.',
    'error.loadSpots': 'Could not load mushroom spots. Please try again.',
    'error.deleteSpot': 'Could not delete spot. Please try again.',
    'error.loadMap': 'Could not load map data. Please try again.',
    
    // Delete Confirmations
    'delete.spotTitle': 'Delete Spot',
    'delete.spotMessage': 'Are you sure you want to delete this mushroom spot?',
    'delete.success': 'Mushroom spot deleted successfully.',
    
    // Car Location
    'car.save': 'Save Car Location',
    'car.saved': 'Car location saved!',
    'car.navigate': 'Navigate to my Car',
    'car.notSaved': 'No car location saved',
    'car.distance': 'Distance',
    'car.saveCurrentLocation': 'Save this location as my car position?',
    'car.delete': 'Delete Position',
    'car.deleteConfirm': 'Delete saved car position?',
    'car.deleted': 'Car position deleted.',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'mushroomfinder_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr'); // Default to French

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLanguage && (savedLanguage === 'fr' || savedLanguage === 'en')) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language preference:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
      setLanguageState(lang);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language][key as keyof typeof translations['fr']];
    if (!translation) {
      console.warn(`Missing translation for key: ${key} in language: ${language}`);
      return key;
    }
    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
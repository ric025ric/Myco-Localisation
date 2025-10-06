import React from 'react';

interface MushroomSpot {
  id: string;
  latitude: number;
  longitude: number;
  mushroom_type: string;
  notes: string;
  photo_base64?: string;
  timestamp: string;
}

interface NativeMapViewProps {
  spots: MushroomSpot[];
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  onMarkerPress: (spot: MushroomSpot) => void;
  onMapReady: () => void;
  mapRef: React.RefObject<any>;
}

// Web version - returns null since we use WebMapFallback instead
export default function NativeMapView(props: NativeMapViewProps) {
  return null;
}
import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, Linking, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MapPin, Navigation } from "lucide-react-native";

interface Props {
  latitude: number;
  longitude: number;
  location?: string;
}

export function CommunityMap({ latitude, longitude, location }: Props) {
  const mapRef = useRef<MapView>(null);

  // Si pas de coordonnées, afficher un message d'attente natif
  if (!latitude || !longitude) {
    return (
      <View className="rounded-xl h-40 bg-white/5 border border-white/10 flex items-center justify-center">
        <Text className="text-white/30 text-sm">Carte non disponible</Text>
      </View>
    );
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Erreur", "Impossible d'ouvrir l'application de navigation.");
    });
  };

  return (
    <View className="space-y-2">
      <View className="flex flex-row items-center justify-between">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>
        <Pressable
          onPress={openGoogleMaps}
          className="flex flex-row items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5"
        >
          <Navigation size={12} className="text-white/60" />
          <Text className="text-xs text-white/60">Itinéraire</Text>
        </Pressable>
      </View>

      {/* Carte Native */}
      <View className="rounded-xl overflow-hidden h-48 relative bg-white/5">
        <MapView
          ref={mapRef}
          className="w-full h-full"
          initialRegion={{
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          }}
          showsUserLocation={true}
        >
          {/* Marqueur de la communauté / de l'annonce */}
          <Marker
            coordinate={{ latitude, longitude }}
            title={location || "Emplacement"}
            description={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
          />
        </MapView>

        <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-full">
          <Text className="text-white/60 text-[10px]">OpenStreetMap</Text>
        </View>
      </View>
    </View>
  );
}

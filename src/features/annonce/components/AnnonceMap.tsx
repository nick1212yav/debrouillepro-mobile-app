import { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, Linking, Alert } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MapPin, Navigation, Loader2 } from "lucide-react-native";
import * as Location from "expo-location";

// Remplacement de sonner par l'abstraction native UIService
import { UIService } from "@/core/sdk/ui/UIService";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export function AnnonceMap({ location, latitude, longitude, address }: Props) {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // Calcul de la distance entre deux points (formule de Haversine)
  const calculateDistance = (
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Recalculer la distance si la position de l'utilisateur change
  useEffect(() => {
    if (latitude && longitude && userLocation) {
      const dist = calculateDistance(
        latitude,
        longitude,
        userLocation.lat,
        userLocation.lng,
      );
      setDistance(dist);
    }
  }, [latitude, longitude, userLocation]);

  // Détection de la localisation utilisateur via expo-location
  const detectUserLocation = async () => {
    setLoadingUser(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission requise",
          "Vous devez autoriser l'accès à la localisation pour utiliser cette fonctionnalité.",
        );
        setLoadingUser(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setUserLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      UIService.openToast("Position détectée", "success");
    } catch (error) {
      UIService.openToast("Impossible de détecter votre position", "error");
    } finally {
      setLoadingUser(false);
    }
  };

  const openGoogleMaps = () => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      Linking.openURL(url).catch(() => {
        Alert.alert("Erreur", "Impossible d'ouvrir Google Maps.");
      });
    }
  };

  const openWaze = () => {
    if (latitude && longitude) {
      const wazeUrl = `waze://?ll=${latitude},${longitude}&navigate=yes`;
      const webUrl = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;

      Linking.canOpenURL(wazeUrl).then((supported) => {
        if (supported) {
          Linking.openURL(wazeUrl);
        } else {
          // Si l'application Waze n'est pas installée, on ouvre le fallback Web
          Linking.openURL(webUrl);
        }
      });
    }
  };

  // Si pas de coordonnées, afficher un message d'attente natif
  if (!latitude || !longitude) {
    return (
      <View className="bg-white/5 rounded-2xl p-4 space-y-2">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>
        <View className="mt-2 rounded-xl h-48 flex flex-col items-center justify-center bg-white/5 border border-white/10 gap-2">
          <MapPin size={32} className="text-white/20" />
          <Text className="text-white/30 text-sm">
            {location || "Carte non disponible"}
          </Text>
          <Text className="text-white/20 text-xs">
            Coordonnées géographiques manquantes
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="space-y-2">
      <View className="flex flex-row items-center justify-between">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>
        <View className="flex flex-row gap-2 flex-wrap">
          <Pressable
            onPress={detectUserLocation}
            disabled={loadingUser}
            className="flex flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/5 disabled:opacity-50"
          >
            {loadingUser ? (
              <Loader2 size={12} className="animate-spin text-white/60" />
            ) : (
              <Navigation size={12} className="text-white/60" />
            )}
            <Text className="text-xs text-white/60">
              {loadingUser ? "..." : "Me localiser"}
            </Text>
          </Pressable>

          <Pressable
            onPress={openGoogleMaps}
            className="flex flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/5"
          >
            <MapPin size={12} className="text-white/60" />
            <Text className="text-xs text-white/60">Google Maps</Text>
          </Pressable>

          <Pressable
            onPress={openWaze}
            className="flex flex-row items-center gap-1 px-2 py-1 rounded-lg bg-white/5"
          >
            <Navigation size={12} className="text-white/60" />
            <Text className="text-xs text-white/60">Waze</Text>
          </Pressable>
        </View>
      </View>

      {/* Carte Native */}
      <View className="rounded-xl overflow-hidden h-52 relative bg-white/5">
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
          {/* Marqueur de l'annonce */}
          <Marker
            coordinate={{ latitude, longitude }}
            title={address || location || "Emplacement"}
            description={
              distance !== null
                ? `À ${distance.toFixed(1)} km de vous`
                : `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            }
          />
        </MapView>

        {userLocation && (
          <View className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-full flex flex-row items-center gap-1">
            <View className="w-2 h-2 rounded-full bg-green-400" />
            <Text className="text-green-400 text-[10px]">Vous êtes ici</Text>
          </View>
        )}

        <View className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded-full">
          <Text className="text-white/60 text-[10px]">
            {distance !== null
              ? `Distance : ${distance.toFixed(1)} km`
              : "Carte active"}
          </Text>
        </View>
      </View>
    </View>
  );
}

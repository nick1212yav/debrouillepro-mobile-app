// src/features/service/components/ServiceMap.tsx
//
// Vue localisation native — sans carte interactive.
//
// Le composant affiche :
//   - l'adresse textuelle du prestataire
//   - un bouton "Itinéraire" qui ouvre Google Maps / Plans
//   - un lien si latitude + longitude sont connues
//
// Aucune dépendance web (leaflet retiré).
// Aucun rendu DOM dans une View React Native.

import { View, Text, Pressable, Linking } from "react-native";
import { MapPin, Navigation } from "lucide-react-native";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
}

function buildMapsUrl(
  location: string,
  latitude?: number,
  longitude?: number,
): string {
  if (latitude !== undefined && longitude !== undefined) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

export function ServiceMap({ location, latitude, longitude }: Props) {
  const hasLocation = Boolean(location && location.trim().length > 0);
  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  if (!hasLocation && !hasCoordinates) {
    return (
      <View className="bg-white/5 rounded-2xl p-4">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>
        <View className="mt-2 rounded-xl h-24 flex items-center justify-center bg-white/5 border border-white/10">
          <View className="flex items-center gap-2">
            <MapPin size={16} color="rgba(255,255,255,0.3)" />
            <Text className="text-sm text-white/30">
              Localisation non renseignée
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const displayLocation = hasLocation ? location! : `${latitude}, ${longitude}`;

  const handleOpenMaps = async () => {
    const url = buildMapsUrl(displayLocation, latitude, longitude);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // Silent — pas de handler d'erreur UX nécessaire ici
    }
  };

  return (
    <View className="bg-white/5 rounded-2xl p-4">
      <View className="flex items-center justify-between mb-3">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>
        <Pressable
          onPress={handleOpenMaps}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 active:bg-white/10"
        >
          <Navigation size={12} color="rgba(255,255,255,0.6)" />
          <Text className="text-xs text-white/60">Itinéraire</Text>
        </Pressable>
      </View>

      <View className="rounded-xl p-4 bg-white/5 border border-white/10">
        <View className="flex flex-row items-start gap-2">
          <MapPin size={16} color="#F97316" />
          <Text className="text-sm text-white flex-1">{displayLocation}</Text>
        </View>
        {hasCoordinates && (
          <Text className="text-xs text-white/40 mt-2">
            Coordonnées GPS disponibles
          </Text>
        )}
      </View>
    </View>
  );
}

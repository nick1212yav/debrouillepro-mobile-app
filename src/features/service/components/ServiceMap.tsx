// src/features/service/components/ServiceMap.tsx

import { useCallback, useMemo } from "react";
import { Linking, Platform, Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { MapPin, Navigation, Wrench } from "lucide-react-native";

interface Props {
  location?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_LATITUDE_DELTA = 0.012;
const DEFAULT_LONGITUDE_DELTA = 0.012;

export function ServiceMap({ location, latitude, longitude }: Props) {
  const hasCoordinates =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const region = useMemo(() => {
    if (!hasCoordinates) {
      return undefined;
    }

    return {
      latitude: latitude as number,
      longitude: longitude as number,
      latitudeDelta: DEFAULT_LATITUDE_DELTA,
      longitudeDelta: DEFAULT_LONGITUDE_DELTA,
    };
  }, [hasCoordinates, latitude, longitude]);

  const handleDirections = useCallback(async () => {
    if (!hasCoordinates) {
      return;
    }

    const destinationLatitude = latitude as number;
    const destinationLongitude = longitude as number;

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${destinationLatitude},${destinationLongitude}`;

    const nativeMapsUrl =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?daddr=${destinationLatitude},${destinationLongitude}`
        : `geo:${destinationLatitude},${destinationLongitude}?q=${destinationLatitude},${destinationLongitude}`;

    try {
      const canOpenNativeMaps = await Linking.canOpenURL(nativeMapsUrl);

      if (canOpenNativeMaps) {
        await Linking.openURL(nativeMapsUrl);
        return;
      }

      const canOpenGoogleMaps = await Linking.canOpenURL(googleMapsUrl);

      if (canOpenGoogleMaps) {
        await Linking.openURL(googleMapsUrl);
      }
    } catch (error) {
      console.error(
        "[ServiceMap] Impossible d'ouvrir l'application de navigation:",
        error,
      );
    }
  }, [hasCoordinates, latitude, longitude]);

  /*
   * Aucun emplacement GPS exploitable.
   */
  if (!hasCoordinates || !region) {
    return (
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-sm font-medium text-white/50">Localisation</Text>

        <View className="mt-3 h-48 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <View className="max-w-[85%] flex-row items-center justify-center gap-2">
            <MapPin size={18} color="rgba(255,255,255,0.35)" />

            <Text
              numberOfLines={2}
              className="text-center text-sm text-white/35"
            >
              {location?.trim() || "Carte non disponible"}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-2xl bg-white/5 p-4">
      {/* ============================================================ */}
      {/* HEADER                                                        */}
      {/* ============================================================ */}

      <View className="flex-row items-center justify-between">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-medium text-white/50">
            Localisation
          </Text>

          {location?.trim() ? (
            <Text numberOfLines={1} className="mt-1 text-xs text-white/35">
              {location.trim()}
            </Text>
          ) : null}
        </View>

        <Pressable
          onPress={() => {
            void handleDirections();
          }}
          className="ml-3 flex-row items-center gap-1.5 rounded-lg bg-white/5 px-3 py-2 active:bg-white/10"
          accessibilityRole="button"
          accessibilityLabel="Obtenir un itinéraire"
        >
          <Navigation size={13} color="rgba(255,255,255,0.65)" />

          <Text className="text-xs font-medium text-white/65">Itinéraire</Text>
        </Pressable>
      </View>

      {/* ============================================================ */}
      {/* MAP                                                           */}
      {/* ============================================================ */}

      <View className="h-52 overflow-hidden rounded-xl">
        <MapView
          provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
          initialRegion={region}
          className="h-full w-full"
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
          toolbarEnabled
        >
          <Marker
            coordinate={{
              latitude: latitude as number,
              longitude: longitude as number,
            }}
            title={location?.trim() || "Emplacement"}
            description="Localisation du service"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-orange-500 shadow-lg">
              <Wrench size={17} color="#FFFFFF" />
            </View>
          </Marker>
        </MapView>

        {/* Attribution visuelle */}
        <View className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-1">
          <Text className="text-[9px] text-white/55">Carte</Text>
        </View>
      </View>
    </View>
  );
}

export default ServiceMap;

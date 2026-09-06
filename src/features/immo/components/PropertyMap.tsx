// src/features/immo/components/PropertyMap.tsx

import { Alert, Linking, Platform, Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { MapPin } from "lucide-react-native";

interface Props {
  city: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export function PropertyMap({ city, address, latitude, longitude }: Props) {
  const hasCoords =
    typeof latitude === "number" &&
    Number.isFinite(latitude) &&
    typeof longitude === "number" &&
    Number.isFinite(longitude);

  const locationLabel =
    address?.trim() || city?.trim() || "Adresse non renseignée";

  const openMaps = async () => {
    if (!hasCoords) {
      return;
    }

    const latitudeValue = latitude.toFixed(6);
    const longitudeValue = longitude.toFixed(6);
    const label = encodeURIComponent(locationLabel);

    try {
      if (Platform.OS === "ios") {
        const appleMapsUrl =
          `http://maps.apple.com/?ll=${latitudeValue},${longitudeValue}` +
          `&q=${label}`;

        await Linking.openURL(appleMapsUrl);
        return;
      }

      const geoUrl =
        `geo:${latitudeValue},${longitudeValue}` +
        `?q=${latitudeValue},${longitudeValue}(${label})`;

      const supported = await Linking.canOpenURL(geoUrl);

      if (supported) {
        await Linking.openURL(geoUrl);
        return;
      }

      const browserMapsUrl =
        `https://www.google.com/maps/search/?api=1&query=` +
        `${latitudeValue},${longitudeValue}`;

      await Linking.openURL(browserMapsUrl);
    } catch (error) {
      console.error(
        "Impossible d'ouvrir l'application de cartographie:",
        error,
      );

      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application de cartographie.",
      );
    }
  };

  if (!hasCoords) {
    return (
      <View className="rounded-2xl bg-white/5 p-4">
        <Text className="text-[10px] uppercase tracking-wider text-white/40">
          Localisation
        </Text>

        <View className="mt-1 flex-row items-center">
          <MapPin size={14} color="rgba(255,255,255,0.3)" />

          <Text
            className="ml-1 flex-1 text-sm font-medium text-white"
            numberOfLines={2}
          >
            {locationLabel}
          </Text>
        </View>

        <View className="mt-3 h-40 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <MapPin size={28} color="rgba(255,255,255,0.2)" />

          <Text className="mt-2 text-sm text-white/30">
            Coordonnées non disponibles
          </Text>
        </View>
      </View>
    );
  }

  const region = {
    latitude,
    longitude,
    latitudeDelta: 0.012,
    longitudeDelta: 0.012,
  };

  return (
    <View className="rounded-2xl bg-white/5 p-4">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-[10px] uppercase tracking-wider text-white/40">
            Localisation
          </Text>

          <View className="mt-1 flex-row items-center">
            <MapPin size={14} color="rgba(255,255,255,0.3)" />

            <Text
              className="ml-1 flex-1 text-sm font-medium text-white"
              numberOfLines={2}
            >
              {locationLabel}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={openMaps}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir l'itinéraire"
          className="rounded-full bg-white/5 px-3 py-2"
        >
          <Text className="text-xs font-medium text-orange-400">
            Itinéraire
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 h-48 overflow-hidden rounded-xl">
        <MapView
          provider={PROVIDER_DEFAULT}
          className="h-full w-full"
          initialRegion={region}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled
          accessibilityLabel={`Carte de ${locationLabel}`}
        >
          <Marker
            coordinate={{
              latitude,
              longitude,
            }}
            title={address || city || "Bien immobilier"}
            description={
              address ? city : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }
            pinColor="#F97316"
          />
        </MapView>

        <View
          pointerEvents="none"
          className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1"
        >
          <Text className="text-[10px] text-white/60">Carte</Text>
        </View>
      </View>
    </View>
  );
}

import { View, Text, Linking } from "react-native";
// src/features/sante/components/DoctorLocation.tsx
import { MapPin, Building, Globe } from "lucide-react-native";

interface DoctorLocationProps {
  address: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export function DoctorLocation({
  address,
  city,
  country,
  latitude,
  longitude,
}: DoctorLocationProps) {
  const fullAddress = [address, city, country].filter(Boolean).join(", ");

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <MapPin size={14} /> Localisation
      </Text>
      <View className="flex items-start gap-3">
        <MapPin size={16} className="text-white/40 mt-0.5 flex-shrink-0" />
        <View>
          <Text className="text-white text-sm">{fullAddress}</Text>
          {latitude && longitude && (
            <Text className="text-white/30 text-[10px] mt-1">
              <Text>Coordonnées :</Text>{latitude.toFixed(4)}<Text>,</Text>{longitude.toFixed(4)}
            </Text>
          )}
          <Pressable
            onPress={() => {
              if (latitude && longitude) {
                const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
                Linking.openURL(String(url));
              }
            }}
            className="mt-2 text-xs text-blue-400"
          >
            <Text>Voir sur la carte</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

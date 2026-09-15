import { View, Text, Linking } from "react-native";

// src/features/sante/components/DoctorMap.tsx
import { MapPin } from "lucide-react-native";

interface DoctorMapProps {
  latitude?: number;
  longitude?: number;
  name: string;
  address?: string;
}

export function DoctorMap({
  latitude,
  longitude,
  name,
  address,
}: DoctorMapProps) {
  const hasCoordinates = latitude !== undefined && longitude !== undefined;

  const handleOpenMaps = () => {
    if (hasCoordinates) {
      Linking.openURL(String(`https://www.google.com/maps?q=${latitude},${longitude}`));
    } else if (address) {
      Linking.openURL(String(`https://www.google.com/maps?q=${encodeURIComponent(address)}`));
    }
  };

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10"><Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3"><MapPin size={14} />Carte
      </Text><View onPress={handleOpenMaps} className="relative aspect-[16/9] rounded-xl overflow-hidden bg-black/30 border border-white/10 transition-colors">{hasCoordinates ? (
          <iframe
            src={`https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
            className="w-full h-full"
            title="Carte du médecin"
            loading="lazy"
          />
        ) : (
          <View className="w-full h-full flex flex-col items-center justify-center text-white/30">
            <MapPin size={32} className="mb-2" />
            <Text className="text-sm">{name}</Text>
            {address && <Text className="text-xs">{address}</Text>}
            <Text className="text-xs mt-2">Cliquez pour ouvrir dans Google Maps</Text>
          </View>
        )}</View></View>
  );
}

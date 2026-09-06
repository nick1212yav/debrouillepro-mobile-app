import { View, Text, Linking } from "react-native";
// src/features/sante/components/DoctorDirections.tsx
import { MapPin, Navigation, ExternalLink } from "lucide-react-native";

interface DoctorDirectionsProps {
  latitude?: number;
  longitude?: number;
  address?: string;
}

export function DoctorDirections({
  latitude,
  longitude,
  address,
}: DoctorDirectionsProps) {
  const handleDirections = (mode: "driving" | "walking" | "transit") => {
    let dest = "";
    if (latitude && longitude) {
      dest = `${latitude},${longitude}`;
    } else if (address) {
      dest = encodeURIComponent(address);
    } else {
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=${mode}`;
    Linking.openURL(String(url));
  };

  if (!latitude && !longitude && !address) {
    return null;
  }

  return (
    <View className="p-4 rounded-2xl bg-white/5 border border-white/10">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider flex items-center gap-2 mb-3">
        <Navigation size={14} /> Itinéraire
      </Text>
      <View className="flex flex-wrap gap-2">
        <Pressable
          onPress={() => handleDirections("driving")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/20"
        >
          <Text>🚗 Voiture</Text></Pressable>
        <Pressable
          onPress={() => handleDirections("walking")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/20"
        >
          <Text>🚶 Piéton</Text></Pressable>
        <Pressable
          onPress={() => handleDirections("transit")}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/20"
        >
          <Text>🚌 Transport</Text></Pressable>
        <Pressable
          onPress={() =>
            Linking.openURL(String(`https://www.google.com/maps/place/${latitude},${longitude}`))
          }
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-white/10 text-white/60 border border-white/10"
        >
          <ExternalLink size={12} /> <Text>Ouvrir dans Maps</Text></Pressable>
      </View>
    </View>
  );
}

import { Pressable, View, Text, Image, Alert } from "react-native";
import { Compass, ShieldAlert } from "lucide-react-native";
import type { GeoCoordinates } from "../../types/common.types";

interface DeliveryMapProps {
  courierCoordinates: GeoCoordinates;
  destinationCoordinates: GeoCoordinates;
  height?: string;
}

export function DeliveryMap({
  courierCoordinates,
  destinationCoordinates,
  height = "h-48",
}: DeliveryMapProps) {
  return (
    <View className="relative rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.01]">
      {/* Simulation cartographique noire et orange vectorielle */}
      <Image
       
       
        className={`w-full ${height} object-cover brightness-[0.25] contrast-[1.1] grayscale`}
       source={{ uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80" }} accessibilityLabel="Delivery Tracking Map"/>
      <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Superposition des données géographiques en temps réel */}
      <View className="absolute inset-0 flex flex-col justify-between p-3.5 text-left">
        <View className="flex justify-between items-start">
          <Text className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center gap-1">
            <Text className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
            Signal GPS Actif
          </Text>
          <Text className="bg-white/5 border border-white/10 text-white text-[8px] font-bold px-2 py-0.5 rounded">
            Resto ➔ Client
          </Text>
        </View>

        <View className="flex justify-between items-end">
          <View className="min-w-0 pr-4">
            <Text className="block text-[8px] text-white/40 uppercase font-black">
              <Text>Coordonnées du livreur</Text></Text>
            <Text className="text-[10px] text-white/80 font-mono block truncate">
              {courierCoordinates.lat.toFixed(5)}<Text>,</Text>{" "}
              {courierCoordinates.lng.toFixed(5)}
            </Text>
          </View>

          <Pressable
            onPress={() =>
              Alert.alert("Recentrage automatique de la carte sur le coursier")
            }
            className="p-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400"
          >
            <Compass size={14} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

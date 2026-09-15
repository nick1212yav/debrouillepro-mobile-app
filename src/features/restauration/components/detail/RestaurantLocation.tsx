import { View, Pressable, Text } from "react-native";
import { MapPin, Compass } from "lucide-react-native";

interface RestaurantLocationProps {
  location: string;
}

export function RestaurantLocation({ location }: RestaurantLocationProps) {
  return (
    <View className="px-4 py-2"><View className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-2.5"><MapPin size={16} className="text-orange-400 shrink-0 mt-0.5" /><View className="flex-1 min-w-0"><Text className="block text-[10px] text-white/40 uppercase font-bold">Adresse physique
          </Text><Text className="text-xs text-white/90 leading-relaxed block truncate">{location}</Text></View><Pressable onPress={() =>
            toast.success("Itinéraire transmis vers votre application GPS")
          } className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 shrink-0 active:scale-95 transition-all"><Compass size={16} /></Pressable></View></View>
  );
}

// Injection locale de toast pour pallier l'absence de framework global dans l'environnement de compilation autonome
const toast = {
  success: (msg: string) => console.log(`[Toast Success] ${msg}`),
};

import { View, Text, Image } from "react-native";
import { Star } from "lucide-react-native";

export function RestaurantSimilar() {
  const similars = [
    {
      name: "La Cour des Grands",
      cuisine: "Africaine & Grillades",
      rating: 4.6,
      thumb:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80",
    },
  ];

  return (
    <View className="px-4 py-4 border-t border-white/[0.04]"><Text className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3 text-left">Établissements similaires
      </Text>{similars.map((sim) => (
        <View key={sim.name} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-left"><Image className="w-12 h-12 rounded-lg object-cover" source={{ uri: sim.thumb }} accessibilityLabel={sim.name} /><View className="flex-1 min-w-0"><Text className="block text-xs font-bold text-white truncate">{sim.name}</Text><Text className="block text-[10px] text-white/40 mt-0.5">{sim.cuisine}</Text></View><View className="flex items-center gap-1 bg-amber-400/10 px-2 py-0.5 rounded"><Star size={10} className="text-amber-400 fill-amber-400" /><Text className="text-[10px] text-amber-400 font-bold">{sim.rating}</Text></View></View>
      ))}</View>
  );
}

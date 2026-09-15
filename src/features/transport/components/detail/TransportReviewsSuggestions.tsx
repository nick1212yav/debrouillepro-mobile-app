import { View, Text } from "react-native";

// src/features/transport/components/detail/TransportReviewsSuggestions.tsx
import { Star, MessageSquare, MapPin, ArrowUpRight } from "lucide-react-native";

interface ReviewsSuggestionsProps {
  origin: string;
}

export function TransportReviewsSuggestions({
  origin,
}: ReviewsSuggestionsProps) {
  // Liste de suggestions alternatives pertinentes
  const alternatives = [
    { destination: "Matadi", price: "25 000", time: "3h 45m" },
    { destination: "Kikwit", price: "40 000", time: "6h 20m" },
  ];

  return (
    <View className="space-y-4">{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-4"><View className="flex items-center justify-between pb-3 border-b border-white/5"><Text className="text-[9px] font-black text-white/30 uppercase tracking-widest">Avis vérifiés RDC
          </Text><View className="flex items-center gap-1.5"><View className="flex text-amber-400"><Star size={10} className="fill-amber-400" /><Star size={10} className="fill-amber-400" /><Star size={10} className="fill-amber-400" /><Star size={10} className="fill-amber-400" /><Star size={10} className="fill-amber-400" /></View><Text className="text-xs font-bold text-white">4.97/5</Text></View></View>{}<View className="space-y-3"><View className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5"><View className="flex justify-between items-center"><Text className="text-xs font-bold text-white">Patrick K.</Text><Text className="text-[9px] text-white/40">Il y a 3 jours</Text></View><Text className="text-xs text-white/60 mt-1 leading-relaxed">"Chauffeur très calme et prudent. Véhicule climatisé du début à la
              fin. Parfait pour voyager sereinement."
            </Text></View></View></View>{}<View className="p-5 rounded-3xl border border-white/5 bg-white/[0.01] space-y-3"><Text className="text-[9px] font-black text-white/30 uppercase tracking-widest">Trajets au départ de {origin}</Text><View className="space-y-2">{alternatives.map((alt) => (
            <View key={alt.destination} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all"><View className="flex items-center gap-2"><MapPin size={12} className="text-violet-400" /><View><Text className="text-xs font-bold text-white">{origin}→ {alt.destination}</Text><Text className="text-[9px] text-white/40">{alt.time}</Text></View></View><View className="text-right"><Text className="text-xs font-bold text-violet-400">{alt.price}FC
                </Text><Text className="text-[8px] text-emerald-400">Direct</Text></View></View>
          ))}</View></View></View>
  );
}

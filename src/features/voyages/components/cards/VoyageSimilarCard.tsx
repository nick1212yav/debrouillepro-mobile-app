import { Pressable, View, Text, Image } from "react-native";

// src/features/voyages/components/cards/VoyageSimilarCard.tsx
import { Clock, Star } from "lucide-react-native";
import type { VoyageTrip } from "../../types/voyage.types";
import { VoyagePrice } from "../common/VoyagePrice";

interface VoyageSimilarCardProps {
  trip: VoyageTrip;
  onClick?: () => void;
}

export function VoyageSimilarCard({ trip, onClick }: VoyageSimilarCardProps) {
  return (
    <Pressable whileTap={{ scale: 0.98 }} onPress={onClick} className="flex items-center gap-3 p-3 w-full rounded-2xl bg-white/[0.02] border border-white/5 transition-all text-left">
      <View className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/[0.01] flex-shrink-0">{trip.imageUrl ? (
          <Image className="w-full h-full object-cover" source={{ uri: trip.imageUrl }} accessibilityLabel={trip.to} />
        ) : (
          <View className="w-full h-full bg-gradient-to-r from-blue-900/10 to-indigo-900/10 flex items-center justify-center text-xl"><Text>✈️</Text></View>
        )}</View>

      <View className="flex-1 min-w-0 flex flex-col justify-between h-14"><View><Text className="text-white font-bold text-xs truncate leading-none">{trip.from}→ {trip.to}</Text><Text className="text-[10px] text-white/40 truncate mt-1">{trip.operator}• {trip.type}</Text></View><View className="flex items-center justify-between gap-2">{}<VoyagePrice price={trip.price} currency={trip.currency} variant="small" /><View className="flex items-center gap-1.5 text-[9px] text-white/40"><View className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-500 text-yellow-500" /><Text className="font-bold text-white/80">{trip.rating.toFixed(1)}</Text></View><Text>·</Text><View className="flex items-center gap-0.5"><Clock size={10} /><Text>{Math.floor(trip.durationMinutes / 60)}h</Text></View></View></View></View>
    </Pressable>
  );
}

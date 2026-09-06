import { Pressable, View, Text, Image } from "react-native";

// src/features/voyages/components/cards/VoyageDestinationCard.tsx
import { Star, MapPin } from "lucide-react-native";
import { VoyagePrice } from "../common/VoyagePrice";

interface VoyageDestination {
  _id: string;
  name: string;
  country: string;
  continent: string;
  imageUrl?: string;
  budget: string; // Ex: '185000' ou 'Moyen'
  rating: number;
  reviewCount: number;
}

interface VoyageDestinationCardProps {
  destination: VoyageDestination;
  onClick?: () => void;
}

export function VoyageDestinationCard({
  destination,
  onClick,
}: VoyageDestinationCardProps) {
  // Parsing sécurisé du budget
  const priceValue = isNaN(parseFloat(destination.budget))
    ? 0
    : parseFloat(destination.budget);

  return (
    <Pressable
      onPress={onClick}
      className="w-full text-left bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden flex flex-col"
    >
      <View className="relative aspect-[16/10] w-full bg-white/[0.01]">
        {destination.imageUrl ? (
          <Image
           
           
            className="w-full h-full object-cover"
            loading="lazy"
           source={{ uri: destination.imageUrl }} accessibilityLabel={destination.name}/>
        ) : (
          <View className="w-full h-full bg-gradient-to-r from-blue-900/10 to-indigo-900/10 flex items-center justify-center text-3xl">
            <Text>🌍</Text></View>
        )}
        <View className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

        <View className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          {destination.continent}
        </View>
      </View>

      <View className="p-4 space-y-2 flex-1 justify-between flex flex-col w-full">
        <View className="space-y-0.5">
          <Text className="text-white font-bold text-sm truncate">
            {destination.name}
          </Text>
          <View className="flex items-center gap-1 text-[10px] text-white/40">
            <MapPin size={10} />
            <Text>{destination.country}</Text>
          </View>
        </View>

        <View className="flex items-center justify-between pt-1 border-t border-white/5 w-full">
          {/* ✅ Correction : 'amount' remplacé par 'price' [1] */}
          <VoyagePrice price={priceValue} currency="FCFA" variant="small" />

          <View className="flex items-center gap-1 text-[10px] text-white/40">
            <Star size={10} className="fill-yellow-500 text-yellow-500" />
            <Text className="font-bold text-white/80">
              {destination.rating.toFixed(1)}
            </Text>
            <Text><Text>(</Text>{destination.reviewCount}<Text>)</Text></Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

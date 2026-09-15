import { View, Text, Image } from "react-native";

// src/features/restauration/create/steps/RestaurantPreviewStep.tsx
import { Button } from "@/components/ui/button";
import { Loader2, Star, MapPin, UtensilsCrossed, Truck } from "lucide-react-native";

interface Props {
  data: any;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function RestaurantPreviewStep({
  data,
  onSubmit,
  onBack,
  isLoading,
}: Props) {
  const coverImage =
    data.images && data.images.length > 0 ? data.images[0] : null;

  return (
    <View className="space-y-6"><View className="text-center"><Text className="text-3xl">✨</Text><Text className="text-white font-bold text-lg mt-2">Votre restaurant est prêt !
        </Text><Text className="text-white/40 text-sm">Voici un aperçu de ce que verront vos clients.
        </Text></View>{}<View className="rounded-2xl overflow-hidden border border-white/10 bg-white/5">{coverImage && (
          <View className="relative h-48"><Image className="w-full h-full object-cover" source={{ uri: coverImage }} accessibilityLabel={data.name} /><View className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" /></View>
        )}<View className="p-4 space-y-2"><Text className="text-white font-bold text-lg">{data.name || "Mon restaurant"}</Text><View className="flex items-center gap-2 text-sm text-white/60"><UtensilsCrossed size={14} /><Text>{data.cuisine || "Cuisine"}</Text><Text className="text-white/20">•</Text><View className="flex items-center gap-0.5"><Star size={12} className="fill-yellow-400 text-yellow-400" /><Text className="text-white/60">4.8</Text><Text className="text-white/30 text-xs">(0 avis)</Text></View></View>{data.location && (
            <View className="flex items-center gap-1 text-sm text-white/40"><MapPin size={14} /><Text>{data.location}</Text></View>
          )}<View className="flex flex-wrap gap-2 pt-1">{data.hasDelivery && (
              <Text className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/20">Livraison
              </Text>
            )}{data.hasTakeaway && (
              <Text className="px-2 py-0.5 rounded-full text-[10px] bg-green-500/20 text-green-300 border border-green-500/20">À emporter
              </Text>
            )}{data.hasDineIn && (
              <Text className="px-2 py-0.5 rounded-full text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/20">Sur place
              </Text>
            )}</View></View></View><View className="flex gap-3"><Button onPress={onBack} variant="outline" className="flex-1 h-12 rounded-xl border-white/10 text-white">← Modifier
        </Button><Button onPress={onSubmit} disabled={isLoading} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-base">{isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Publication...
            </>
          ) : (
            "🚀 Publier mon restaurant"
          )}</Button></View></View>
  );
}

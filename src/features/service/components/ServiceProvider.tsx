import { View, Text, Image, Pressable } from "react-native";
import { Star, MapPin, Shield } from "lucide-react-native";
import type { ServiceProvider } from "../types";

export function ServiceProviderCard({
  provider,
  onClick,
}: {
  provider: ServiceProvider;
  onClick?: () => void;
}) {
  return (
    <Pressable
      className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden"
      onPress={onClick}
    >
      <View className="relative h-32 bg-white/5">
        {provider.imageUrl && (
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: provider.imageUrl }} accessibilityLabel={provider.name}/>
        )}
        {provider.urgent && (
          <Text className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-xs bg-red-500/80 text-white">
            Urgence
          </Text>
        )}
      </View>
      <View className="p-3">
        <View className="flex items-center gap-2">
          <Text className="text-white font-semibold">{provider.name}</Text>
          {provider.verified && <Shield size={14} className="text-green-400" />}
        </View>
        <Text className="text-orange-400 text-xs">{provider.specialty}</Text>
        <View className="flex items-center gap-1 text-xs text-white/50">
          <MapPin size={12} />
          {provider.location}
        </View>
        <View className="flex items-center justify-between mt-2">
          <Text className="text-orange-400 font-bold">{provider.price}</Text>
          <Text className="flex items-center">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {provider.rating.toFixed(1)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

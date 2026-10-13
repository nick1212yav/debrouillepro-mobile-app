import { View, Image, Text, Pressable } from "react-native";
import { Star, MapPin, Shield } from "lucide-react-native";
import type { ServiceProvider } from "../types";

interface Props {
  provider: ServiceProvider;
  onClick?: () => void;
}

export function ServiceProviderCard({ provider, onClick }: Props) {
  return (
    <Pressable
      onPress={onClick}
      disabled={!onClick}
      accessibilityRole={onClick ? "button" : undefined}
      accessibilityLabel={`Voir le prestataire ${provider.name}`}
      className="rounded-2xl bg-white/5 border border-white/5 overflow-hidden active:bg-white/10"
    >
      <View className="relative h-32 bg-white/5">
        {provider.imageUrl ? (
          <Image
            className="w-full h-full"
            resizeMode="cover"
            source={{ uri: provider.imageUrl }}
            accessibilityLabel={provider.name}
          />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Text className="text-white/30 text-3xl">
              {provider.name.trim().charAt(0).toUpperCase() || "P"}
            </Text>
          </View>
        )}

        {provider.urgent && (
          <View className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-red-500/80">
            <Text className="text-xs text-white font-medium">Urgence</Text>
          </View>
        )}
      </View>

      <View className="p-3 gap-1">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-white font-semibold" numberOfLines={1}>
            {provider.name}
          </Text>

          {provider.verified && <Shield size={14} color="#4ADE80" />}
        </View>

        <Text className="text-orange-400 text-xs" numberOfLines={1}>
          {provider.specialty}
        </Text>

        <View className="flex-row items-center gap-1">
          <MapPin size={12} color="rgba(255,255,255,0.5)" />
          <Text className="flex-1 text-xs text-white/50" numberOfLines={1}>
            {provider.location}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-orange-400 font-bold">{provider.price}</Text>

          <View className="flex-row items-center gap-1">
            <Star size={14} color="#FCD34D" fill="#FCD34D" />
            <Text className="text-xs text-white/70">
              {provider.rating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

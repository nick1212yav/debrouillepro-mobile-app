import { Pressable, View, Text } from "react-native";
import { ArrowLeft, Share2, Heart } from "lucide-react-native";
import type { ServiceProvider } from "../types";

export function ServiceHeader({
  provider,
  isFavorited,
  onFavorite,
  onShare,
  onBack,
}: {
  provider: ServiceProvider;
  isFavorited?: boolean;
  onFavorite?: () => void;
  onShare?: () => void;
  onBack?: () => void;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 pt-12 pb-3">
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        className="w-10 h-10 rounded-2xl items-center justify-center bg-white/5 active:bg-white/10"
      >
        <ArrowLeft size={20} color="white" />
      </Pressable>

      <Text className="text-white font-bold text-lg flex-1" numberOfLines={1}>
        {provider.name}
      </Text>

      <Pressable
        onPress={onFavorite}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"
        }
        hitSlop={8}
        className="p-2 rounded-xl bg-white/5 active:bg-white/10"
      >
        <Heart
          size={18}
          color={isFavorited ? "#EF4444" : "rgba(255,255,255,0.6)"}
          fill={isFavorited ? "#EF4444" : "none"}
        />
      </Pressable>

      <Pressable
        onPress={onShare}
        accessibilityRole="button"
        accessibilityLabel="Partager"
        hitSlop={8}
        className="p-2 rounded-xl bg-white/5 active:bg-white/10"
      >
        <Share2 size={18} color="rgba(255,255,255,0.6)" />
      </Pressable>
    </View>
  );
}

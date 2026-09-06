import { Pressable, View, Text } from "react-native";
import { ArrowLeft, Share2, Heart, Shield, CheckCircle } from "lucide-react-native";
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
    <View className="flex items-center gap-3 px-4 pt-12 pb-3">
      <Pressable
        onPress={onBack}
        className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
      >
        <ArrowLeft size={20} className="text-white" />
      </Pressable>
      <Text className="text-white font-bold text-lg flex-1 truncate">
        {provider.name}
      </Text>
      <Pressable
        onPress={onFavorite}
        className="p-2 rounded-xl bg-white/5"
      >
        <Heart
          size={18}
          className={
            isFavorited ? "fill-red-500 text-red-500" : "text-white/60"
          }
        />
      </Pressable>
      <Pressable
        onPress={onShare}
        className="p-2 rounded-xl bg-white/5"
      >
        <Share2 size={18} className="text-white/60" />
      </Pressable>
    </View>
  );
}

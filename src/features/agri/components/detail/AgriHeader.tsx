import { Pressable, View } from "react-native";

// src/features/agri/components/detail/AgriHeader.tsx
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";

interface AgriHeaderProps {
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export function AgriHeader({
  isFavorite,
  onBack,
  onToggleFavorite,
  onShare,
}: AgriHeaderProps) {
  return (
    <View className="w-full flex items-center justify-between p-4 z-20"><Pressable whileTap={{ scale: 0.9 }} onPress={onBack} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-all"><ArrowLeft size={18} className="text-white" /></Pressable><View className="flex items-center gap-2.5"><Pressable whileTap={{ scale: 0.9 }} onPress={onToggleFavorite} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-all"><Heart size={18} className={isFavorite ? "fill-red-500 text-red-500" : "text-white"} /></Pressable><Pressable whileTap={{ scale: 0.9 }} onPress={onShare} className="w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/5 active:bg-black/60 transition-all"><Share2 size={18} className="text-white" /></Pressable></View></View>
  );
}

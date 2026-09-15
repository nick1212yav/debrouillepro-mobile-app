import { View, Pressable } from "react-native";
import { ArrowLeft, Heart, Share2 } from "lucide-react-native";

interface RestaurantHeaderProps {
  onBack: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onShare: () => void;
}

export function RestaurantHeader({
  onBack,
  isFavorite,
  onToggleFavorite,
  onShare,
}: RestaurantHeaderProps) {
  return (
    <View className="absolute top-12 left-4 right-4 flex items-center justify-between z-30"><Pressable onPress={onBack} className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}><ArrowLeft size={20} className="text-white" /></Pressable><View className="flex gap-2"><Pressable onPress={onToggleFavorite} className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}><Heart size={20} className={
              isFavorite ? "fill-rose-500 text-rose-500" : "text-white"
            } /></Pressable><Pressable onPress={onShare} className="w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-md active:scale-95 transition-all" style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", borderStyle: "solid" }}><Share2 size={18} className="text-white" /></Pressable></View></View>
  );
}

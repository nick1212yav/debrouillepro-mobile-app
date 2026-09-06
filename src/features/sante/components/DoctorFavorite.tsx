import { Pressable } from "react-native";

// src/features/sante/components/DoctorFavorite.tsx
import { Heart } from "lucide-react-native";

interface DoctorFavoriteProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function DoctorFavorite({
  isFavorite,
  onToggle,
  size = "md",
}: DoctorFavoriteProps) {
  const sizes = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 text-base",
    lg: "w-12 h-12 text-lg",
  };

  return (
    <Pressable
      onPress={onToggle}
      className={`flex items-center justify-center rounded-2xl transition-colors ${
        sizes[size]
      } ${
        isFavorite
          ? "bg-red-500/20 hover:bg-red-500/30"
          : "bg-white/5 hover:bg-white/10"
      }`}
    >
      <Heart
        size={size === "sm" ? 16 : size === "md" ? 20 : 24}
        className={isFavorite ? "fill-red-500 text-red-500" : "text-white/60"}
      />
    </Pressable>
  );
}

import { Text, Pressable } from "react-native";
import { useState } from "react";
import { Heart } from "lucide-react-native";

interface Props {
  count: number;
  isLiked: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function CommunityLikes({
  count,
  isLiked,
  onToggle,
  size = "md",
}: Props) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    onToggle();
  };

  const sizes = {
    sm: { icon: 14, text: "text-xs", gap: "gap-1" },
    md: { icon: 16, text: "text-sm", gap: "gap-1.5" },
    lg: { icon: 20, text: "text-base", gap: "gap-2" },
  };

  const { icon, text, gap } = sizes[size];

  return (
    <Pressable onPress={handleClick} className={`flex items-center ${gap} transition-all active:scale-90 cursor-pointer`}>
      <Heart
        size={icon}
        className={`transition-all duration-200 ${
          isLiked ? "fill-red-500 text-red-500" : "text-white/40"
        } ${isAnimating ? "scale-125" : "scale-100"}`}
      />
      <Text className={`${text} ${isLiked ? "text-red-400" : "text-white/40"}`}>
        {count > 0 ? count : ""}
      </Text>
    </Pressable>
  );
}

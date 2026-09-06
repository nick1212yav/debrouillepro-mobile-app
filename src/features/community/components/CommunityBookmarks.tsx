import { Text, Pressable } from "react-native";
import { useState } from "react";
import { Bookmark } from "lucide-react-native";

interface Props {
  count: number;
  isBookmarked: boolean;
  onToggle: () => void;
  size?: "sm" | "md" | "lg";
}

export function CommunityBookmarks({
  count,
  isBookmarked,
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
    <Pressable
      onPress={handleClick}
      className={`flex items-center ${gap} transition-all active:scale-90 cursor-pointer`}
    >
      <Bookmark
        size={icon}
        className={`transition-all duration-200 ${
          isBookmarked ? "fill-amber-400 text-amber-400" : "text-white/40"
        } ${isAnimating ? "scale-110" : "scale-100"}`}
      />
      <Text
        className={`${text} ${isBookmarked ? "text-amber-400" : "text-white/40"}`}
      >
        {count > 0 ? count : ""}
      </Text>
    </Pressable>
  );
}

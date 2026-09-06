import { Text, View, Pressable } from "react-native";
import { Star } from "lucide-react-native";

interface StarRatingProps {
  value: number;           // current rating 0–5
  onChange?: (v: number) => void;  // if provided, interactive
  size?: number;
  color?: string;
}

export function StarRating({ value, onChange, size = 18, color = "#F59E0B" }: StarRatingProps) {
  return (
    <View className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(value);
        return (
          <Pressable
            key={star}
            onPress={onChange ? () => onChange(star) : undefined}
            className={onChange ? "cursor-pointer" : "cursor-default"}
            style={{  }}
          >
            <Star
              size={size}
              style={{
                color: filled ? color : "rgba(255,255,255,0.18)",
                fill: filled ? color : "transparent"
              }}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

interface RatingBadgeProps {
  avg: number;
  count: number;
  size?: "sm" | "md";
  color?: string;
}

export function RatingBadge({ avg, count, size = "sm", color = "#F59E0B" }: RatingBadgeProps) {
  if (count === 0) return null;
  return (
    <View className="flex items-center gap-1">
      <Star
        size={size === "sm" ? 11 : 14}
        style={{ color, fill: color }}
      />
      <Text
        className={`font-bold ${size === "sm" ? "text-[11px]" : "text-sm"}`}
        style={{ color }}
      >
        {avg.toFixed(1)}
      </Text>
      <Text className={`text-white/35 ${size === "sm" ? "text-[10px]" : "text-xs"}`}>
        ({count})
      </Text>
    </View>
  );
}

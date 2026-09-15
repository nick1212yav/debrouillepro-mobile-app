import { Text } from "react-native";

interface PriceRangeProps {
  priceRange: string; // "$", "$$", "$$$"
}

export function PriceRange({ priceRange }: PriceRangeProps) {
  return (
    <Text className="text-[10px] font-black tracking-wide text-white/35">Gamme : <Text className="text-white/70">{priceRange}</Text></Text>
  );
}

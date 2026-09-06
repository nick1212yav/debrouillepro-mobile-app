import { Pressable, Text, View } from "react-native";

// src/features/marketplace/components/QuantitySelector.tsx
import { Minus, Plus } from "lucide-react-native";

interface Props {
  quantity: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}

export function QuantitySelector({
  quantity,
  min = 1,
  max = 99,
  onChange,
}: Props) {
  const handleDecrease = () => {
    if (quantity > min) onChange(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < max) onChange(quantity + 1);
  };

  return (
    <View className="flex items-center gap-2">
      <Pressable
        onPress={handleDecrease}
        disabled={quantity <= min}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 disabled:opacity-30"
      >
        <Minus size={14} className="text-white" />
      </Pressable>
      <Text className="text-white font-bold text-sm w-8 text-center">
        {quantity}
      </Text>
      <Pressable
        onPress={handleIncrease}
        disabled={quantity >= max}
        className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 disabled:opacity-30"
      >
        <Plus size={14} className="text-white" />
      </Pressable>
    </View>
  );
}

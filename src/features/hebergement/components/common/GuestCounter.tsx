import { View, Text, Pressable } from "react-native";
import React from "react";
import { Minus, Plus } from "lucide-react-native";

interface GuestCounterProps {
  label: string;
  subtitle?: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  className?: string;
}

export const GuestCounter: React.FC<GuestCounterProps> = ({
  label,
  subtitle,
  value,
  min = 0,
  max = 10,
  onChange,
  className = "",
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <View className={`flex items-center justify-between py-3 ${className}`}><View><Text className="text-sm font-medium text-white">{label}</Text>{subtitle && <Text className="text-xs text-white/40">{subtitle}</Text>}</View><View className="flex items-center gap-4"><Pressable onPress={handleDecrement} disabled={value <= min} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"><Minus size={14} className="text-white" /></Pressable><Text className="text-sm font-semibold text-white w-4 text-center">{value}</Text><Pressable onPress={handleIncrement} disabled={value >= max} className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none"><Plus size={14} className="text-white" /></Pressable></View></View>
  );
};

import { View, Text, TextInput } from "react-native";
import React from "react";

interface AccommodationPriceFilterProps {
  maxPrice: number;
  onPriceChange: (price: number) => void;
  className?: string;
}

export const AccommodationPriceFilter: React.FC<
  AccommodationPriceFilterProps
> = ({ maxPrice, onPriceChange, className = "" }) => {
  const formatValue = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val);
  };

  return (
    <View className={`flex flex-col gap-2 ${className}`}><View className="flex justify-between items-baseline"><Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Budget maximum
        </Text><Text className="text-xs font-black text-indigo-400">{formatValue(maxPrice)}FCFA
        </Text></View><TextInput value={maxPrice} onChangeText={(value) => onPriceChange(Number(value))} className="w-full h-1 bg-white/5 rounded-lg accent-indigo-500" /><View className="flex justify-between text-[9px] text-white/20 font-bold mt-0.5"><Text>30 000 FCFA</Text><Text>1 000 000 FCFA+</Text></View></View>
  );
};

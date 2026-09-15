import { View, Text, Pressable, TextInput } from "react-native";

// src/features/agri/components/search/AgriPriceFilter.tsx
import { useState, useEffect } from "react";

interface AgriPriceFilterProps {
  currency: string;
  minPrice: string;
  maxPrice: string;
  onChangePrice: (min: string, max: string, curr: string) => void;
}

export function AgriPriceFilter({
  currency,
  minPrice,
  maxPrice,
  onChangePrice,
}: AgriPriceFilterProps) {
  const [curr, setCurr] = useState(currency);
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);

  useEffect(() => {
    onChangePrice(min, max, curr);
  }, [min, max, curr, onChangePrice]);

  return (
    <View className="space-y-4">{}<View className="space-y-1.5"><Text className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Devise
        </Text><View className="gap-2">{["CDF", "USD", "CFA"].map((c) => {
            const isSelected = curr === c;
            return (
              <Pressable key={c} onPress={() => setCurr(c)} className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  isSelected
                    ? "bg-green-500/15 border-green-500/30 text-green-400"
                    : "bg-white/[0.02] border-white/5 text-white/50 hover:text-white/80"
                }`}>{c}</Pressable>
            );
          })}</View></View>{}<View className="space-y-1.5"><Text className="text-[10px] text-white/30 uppercase tracking-wider font-bold">Fourchette budgétaire
        </Text><View className="gap-3"><View className="relative flex items-center"><Text className="absolute left-3 text-[10px] text-white/20 font-bold">{curr}</Text><TextInput value={min} onChangeText={(value) => setMin(value)} placeholder="Minimum" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-3 text-white text-xs outline-none" keyboardType="numeric" /></View><View className="relative flex items-center"><Text className="absolute left-3 text-[10px] text-white/20 font-bold">{curr}</Text><TextInput value={max} onChangeText={(value) => setMax(value)} placeholder="Maximum" className="w-full h-11 bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-3 text-white text-xs outline-none" keyboardType="numeric" /></View></View></View></View>
  );
}

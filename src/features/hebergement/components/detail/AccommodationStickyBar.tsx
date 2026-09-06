import { Pressable, View, Text } from "react-native";
import React from "react";
import { Calendar } from "lucide-react-native";

interface AccommodationStickyBarProps {
  price: {
    amount: number;
    period: "night" | "day" | "week" | "month";
    currency?: string;
  };
  onBook: () => void;
}

export const AccommodationStickyBar: React.FC<AccommodationStickyBarProps> = ({
  price,
  onBook,
}) => {
  const formattedPrice = new Intl.NumberFormat("fr-FR").format(price.amount);
  const periodLabel: Record<string, string> = {
    night: "nuit",
    day: "jour",
    week: "semaine",
    month: "mois",
  };

  return (
    <View className="fixed bottom-0 left-0 right-0 z-30 p-4 border-t border-white/10 bg-[#020617]/90 flex items-center justify-between gap-4">
      <View className="flex flex-col">
        <Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
          A partir de
        </Text>
        <View className="flex items-baseline gap-1">
          <Text className="text-lg font-black text-indigo-400">
            {formattedPrice} {price.currency || "FCFA"}
          </Text>
          <Text className="text-xs text-white/40">
            <Text>/</Text>{periodLabel[price.period] || price.period}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onBook}
        className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-extrabold shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-2 grow sm:grow-0"
      >
        <Calendar size={14} />
        <Text><Text>Réserver maintenant</Text></Text>
      </Pressable>
    </View>
  );
};

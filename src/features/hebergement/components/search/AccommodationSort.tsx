import { Pressable, View } from "react-native";
import React from "react";
import { ArrowUpDown } from "lucide-react-native";

export type SortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc";

interface AccommodationSortProps {
  selectedOption: SortOption;
  onOptionChange: (option: SortOption) => void;
  className?: string;
}

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommandé" },
  { value: "price_asc", label: "Prix : croissant" },
  { value: "price_desc", label: "Prix : décroissant" },
  { value: "rating_desc", label: "Meilleures notes" },
];

export const AccommodationSort: React.FC<AccommodationSortProps> = ({
  selectedOption,
  onOptionChange,
  className = "",
}) => {
  return (
    <View className={`flex items-center gap-2 ${className}`}>
      <ArrowUpDown size={12} className="text-white/40 shrink-0" />
      <View className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {SORT_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onOptionChange(opt.value as SortOption)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
              selectedOption === opt.value
                ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                : "bg-white/5 border-transparent text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {opt.label}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

import { View, Text, Pressable } from "react-native";
import React from "react";

interface AccommodationTypeFilterProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  className?: string;
}

const TYPES = [
  "Tout",
  "Appartement",
  "Villa",
  "Studio",
  "Hôtel",
  "Colocation",
  "Maison",
  "Chambre",
];

export const AccommodationTypeFilter: React.FC<
  AccommodationTypeFilterProps
> = ({ selectedType, onTypeChange, className = "" }) => {
  return (
    <View className={`flex flex-col gap-2 ${className}`}><Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Type d'hébergement
      </Text><View className="flex flex-wrap gap-1.5">{TYPES.map((type) => {
          const isSelected =
            selectedType === type || (type === "Tout" && !selectedType);
          return (
            <Pressable key={type} onPress={() => onTypeChange(type === "Tout" ? "" : type)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer border ${
                isSelected
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                  : "bg-black/20 border-white/5 text-white/40 hover:bg-black/30 hover:text-white/60"
              }`}>
              {type}
            </Pressable>
          );
        })}</View></View>
  );
};

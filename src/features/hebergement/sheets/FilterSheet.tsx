import { Pressable, Text, View } from "react-native";
import React from "react";
import { X, Filter } from "lucide-react-native";
import { AccommodationFilters } from "../components/search/AccommodationFilters";

interface FilterState {
  type: string;
  maxPrice: number;
  amenities: string[];
  city: string;
}

interface FilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const FilterSheet: React.FC<FilterSheetProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <View className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <View
        className="w-full max-w-lg rounded-t-[32px] p-6 text-white flex flex-col max-h-[85vh] overflow-y-auto bg-slate-950 border-t border-white/10 text-xs no-scrollbar"
      >
        <View className="flex items-center justify-between mb-4">
          <Text className="text-base font-bold flex items-center gap-2">
            <Filter size={18} className="text-indigo-400" />
            <Text>Filtres Avancés</Text>
          </Text>
          <Pressable
            onPress={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60"
          >
            <X size={16} />
          </Pressable>
        </View>

        <AccommodationFilters
          filters={filters}
          onChange={onChange}
          onReset={onReset}
        />

        <Pressable
          onPress={onClose}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-white mt-4 text-xs"
        >
          Appliquer les filtres
        </Pressable>
      </View>
    </View>
  );
};

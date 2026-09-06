import { View, Text } from "react-native";
import React from "react";
import { Filter, RotateCcw } from "lucide-react-native";
import { AccommodationTypeFilter } from "./AccommodationTypeFilter";
import { AccommodationPriceFilter } from "./AccommodationPriceFilter";
import { AccommodationAmenityFilter } from "./AccommodationAmenityFilter";
import { AccommodationLocationFilter } from "./AccommodationLocationFilter";

interface FilterState {
  type: string;
  maxPrice: number;
  amenities: string[];
  city: string;
}

interface AccommodationFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  className?: string;
}

export const AccommodationFilters: React.FC<AccommodationFiltersProps> = ({
  filters,
  onChange,
  onReset,
  className = "",
}) => {
  return (
    <View
      className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 ${className}`}
    >
      <View className="flex items-center justify-between pb-3 border-b border-white/5">
        <Text className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
          <Filter size={14} className="text-indigo-400" />
          <Text>Filtres de recherche</Text>
        </Text>
        <Pressable
          type="button"
          onPress={onReset}
          className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"
        >
          <RotateCcw size={10} />
          <Text><Text>Réinitialiser</Text></Text>
        </Pressable>
      </View>

      <AccommodationLocationFilter
        selectedCity={filters.city}
        onCityChange={(city) => onChange({ ...filters, city })}
      />

      <AccommodationTypeFilter
        selectedType={filters.type}
        onTypeChange={(type) => onChange({ ...filters, type })}
      />

      <AccommodationPriceFilter
        maxPrice={filters.maxPrice}
        onPriceChange={(maxPrice) => onChange({ ...filters, maxPrice })}
      />

      <AccommodationAmenityFilter
        selectedAmenities={filters.amenities}
        onAmenitiesChange={(amenities) => onChange({ ...filters, amenities })}
      />
    </View>
  );
};

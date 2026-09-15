import { View, Text, Pressable } from "react-native";
import React from "react";
import { Check } from "lucide-react-native";

interface AccommodationAmenityFilterProps {
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  className?: string;
}

const AMENITY_OPTIONS = [
  { id: "wifi", label: "WiFi" },
  { id: "parking", label: "Parking" },
  { id: "cuisine", label: "Cuisine" },
  { id: "piscine", label: "Piscine" },
  { id: "climatisation", label: "Climatisation" },
  { id: "tv", label: "Télévision" },
];

export const AccommodationAmenityFilter: React.FC<
  AccommodationAmenityFilterProps
> = ({ selectedAmenities, onAmenitiesChange, className = "" }) => {
  const handleToggle = (id: string) => {
    if (selectedAmenities.includes(id)) {
      onAmenitiesChange(selectedAmenities.filter((x) => x !== id));
    } else {
      onAmenitiesChange([...selectedAmenities, id]);
    }
  };

  return (
    <View className={`flex flex-col gap-2 ${className}`}><Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Équipements souhaités
      </Text><View className="gap-2">{AMENITY_OPTIONS.map((item) => {
          const isChecked = selectedAmenities.includes(item.id);
          return (
            <Pressable key={item.id} onPress={() => handleToggle(item.id)} className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                isChecked
                  ? "bg-indigo-500/10 border-indigo-500 text-indigo-400"
                  : "bg-black/20 border-white/5 text-white/50 hover:bg-black/40 hover:text-white"
              }`}>
              <Text className="font-medium">{item.label}</Text>
              {isChecked && <Check size={12} className="stroke-[3]" />}
            </Pressable>
          );
        })}</View></View>
  );
};

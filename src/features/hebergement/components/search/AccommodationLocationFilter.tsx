import { Picker } from "@react-native-picker/picker";
import { View, Text } from "react-native";
import React from "react";
import { MapPin } from "lucide-react-native";

interface AccommodationLocationFilterProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  className?: string;
}

const CITIES = [
  "Tout",
  "Abidjan",
  "Bingerville",
  "Yamoussoukro",
  "San-Pédro",
  "Bouaké",
];

export const AccommodationLocationFilter: React.FC<
  AccommodationLocationFilterProps
> = ({ selectedCity, onCityChange, className = "" }) => {
  return (
    <View className={`flex flex-col gap-2 ${className}`}>
      <Text className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">
        Localisation (Ville)
      </Text>
      <View className="relative">
        <Picker
         
          onValueChange={(val) =>
            onCityChange(val === "Tout" ? "" : val)}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white"
         selectedValue={selectedCity}>
          {CITIES.map((city) => (
            <Picker.Item label={`${city}`} value={city} />
          ))}
        </Picker>
        <MapPin size={14} className="text-indigo-400 absolute left-3 top-3" />
        <View className="absolute inset-y-0 right-0 flex items-center px-3 text-white/40">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </View>
      </View>
    </View>
  );
};

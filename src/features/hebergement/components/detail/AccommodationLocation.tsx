import { View, Text } from "react-native";
import React from "react";
import { MapPin } from "lucide-react-native";

interface AccommodationLocationProps {
  location: {
    country: string;
    city: string;
    district?: string;
    address?: string;
  };
}

export const AccommodationLocation: React.FC<AccommodationLocationProps> = ({
  location,
}) => {
  const fullAddress = [
    location.address,
    location.district,
    location.city,
    location.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-2">Emplacement</Text><View className="flex items-start gap-2 text-sm text-white/70"><MapPin size={16} className="text-indigo-400 shrink-0 mt-0.5" /><View className="flex flex-col gap-0.5"><Text className="font-medium text-white">{location.district || location.city}</Text><Text className="text-xs text-white/50">{fullAddress}</Text></View></View></View>
  );
};

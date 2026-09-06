import { View, Text } from "react-native";
import React from "react";
import { MapPin, Navigation } from "lucide-react-native";

interface AccommodationMapProps {
  location: {
    latitude?: number;
    longitude?: number;
    city: string;
    district?: string;
  };
}

export const AccommodationMap: React.FC<AccommodationMapProps> = ({
  location,
}) => {
  return (
    <View className="p-4 md:p-6 border-b border-white/5">
      <View className="relative w-full h-[180px] rounded-2xl overflow-hidden border border-white/10 group bg-slate-950">
        <View
          className="absolute inset-0 opacity-40 bg-cover bg-center"
         
        />
        <View className="absolute inset-0 flex items-center justify-center bg-black/40">
          <View className="relative flex items-center justify-center">
            <Text className="absolute inline-flex h-16 w-16 rounded-full bg-indigo-500/30 animate-ping" />
            <Text className="absolute inline-flex h-8 w-8 rounded-full bg-indigo-500/50" />
            <View className="relative z-10 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-xl">
              <MapPin size={18} />
            </View>
          </View>
        </View>

        <View className="absolute bottom-3 left-3 right-3 p-2 bg-black/60 rounded-xl border border-white/10 flex items-center justify-between">
          <View className="flex flex-col">
            <Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">
              <Text>Position approximative</Text></Text>
            <Text className="text-xs text-white font-medium">
              {location.district || location.city}
            </Text>
          </View>
          <Pressable
            type="button"
            className="p-1.5 rounded-lg bg-indigo-500 text-white"
          >
            <Navigation size={12} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

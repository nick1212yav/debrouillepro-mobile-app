import { View, Text } from "react-native";
import React from "react";
import { Compass, ShoppingBag, Landmark, ShieldCheck } from "lucide-react-native";

interface AccommodationNearbyProps {
  city?: string;
}

export const AccommodationNearby: React.FC<AccommodationNearbyProps> = () => {
  const items = [
    {
      label: "Supermarché local",
      dist: "350 m - 5 min à pied",
      icon: ShoppingBag,
    },
    {
      label: "Clinique médicale de la lagune",
      dist: "1.2 km - 4 min en voiture",
      icon: ShieldCheck,
    },
    {
      label: "Aéroport International",
      dist: "15.4 km - 25 min en voiture",
      icon: Compass,
    },
    {
      label: "Centre financier - Le Plateau",
      dist: "6.8 km - 12 min en voiture",
      icon: Landmark,
    },
  ];

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">À proximité</Text><View className="flex flex-col gap-3">{items.map((item, i) => {
          const Icon = item.icon;
          return (
            <View key={i} className="flex items-start gap-3"><View className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 shrink-0"><Icon size={14} className="text-indigo-400" /></View><View className="flex flex-col gap-0.5"><Text className="text-xs font-semibold text-white">{item.label}</Text><Text className="text-[10px] text-white/40">{item.dist}</Text></View></View>
          );
        })}</View></View>
  );
};

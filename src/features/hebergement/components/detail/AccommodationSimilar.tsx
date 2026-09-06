import { View, Text, Image } from "react-native";
import React from "react";
import { MapPin } from "lucide-react-native";

interface AccommodationSimilarProps {
  currentId: string;
}

export const AccommodationSimilar: React.FC<AccommodationSimilarProps> = () => {
  const similars = [
    {
      id: "sim-1",
      title: "Appartement d'architecte",
      city: "Cocody",
      price: "150k",
      img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&q=80",
    },
    {
      id: "sim-2",
      title: "Suite Duplex premium",
      city: "Riviera",
      price: "200k",
      img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300&q=80",
    },
  ];

  return (
    <View className="p-4 md:p-6 border-b border-white/5">
      <Text className="text-white font-semibold text-sm mb-3">
        Hébergements similaires
      </Text>
      <View className="gap-3">
        {similars.map((item) => (
          <View
            key={item.id}
            className="rounded-xl overflow-hidden bg-white/5 border border-white/10 flex flex-col"
          >
            <View className="relative aspect-video w-full">
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: item.img }} accessibilityLabel={item.title}/>
            </View>
            <View className="p-2 flex flex-col gap-1">
              <Text className="text-xs font-semibold text-white truncate">
                {item.title}
              </Text>
              <View className="flex items-center gap-1 text-[10px] text-white/50">
                <MapPin size={10} className="text-white/30" />
                <Text>{item.city}</Text>
              </View>
              <Text className="text-[10px] font-bold text-indigo-400 mt-0.5">
                {item.price} <Text>FCFA / nuit</Text></Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

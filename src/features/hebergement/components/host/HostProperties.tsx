import { View, Text, Pressable, Image } from "react-native";
import React from "react";
import { Star, MapPin, ArrowRight } from "lucide-react-native";

interface HostedProperty {
  id: string;
  title: string;
  city: string;
  price: number;
  period: "night" | "day" | "week" | "month";
  rating: number;
  image: string;
}

interface HostPropertiesProps {
  hostName: string;
  properties?: HostedProperty[];
  onSelectProperty?: (id: string) => void;
  className?: string;
}

export const HostProperties: React.FC<HostPropertiesProps> = ({
  hostName,
  properties,
  onSelectProperty,
  className = "",
}) => {
  const defaultProperties: HostedProperty[] = [
    {
      id: "p1",
      title: "Studio Cozy Plateau",
      city: "Plateau, Abidjan",
      price: 45000,
      period: "night",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&q=80",
    },
    {
      id: "p2",
      title: "Villa Duplex Riviera",
      city: "Riviera, Abidjan",
      price: 120000,
      period: "night",
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=300&q=80",
    },
  ];

  const list = properties || defaultProperties;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val);
  };

  return (
    <View className={`flex flex-col gap-3 ${className}`}>
      <View className="flex justify-between items-baseline">
        <Text className="text-xs font-bold text-white/40 uppercase tracking-wider">
          Autres logements de {hostName}
        </Text>
        <Pressable
         
          className="text-[10px] font-bold text-indigo-400 flex items-center gap-1"
        >
          <Text>Tout voir</Text>
          <ArrowRight size={10} />
        </Pressable>
      </View>

      <View className="gap-3.5">
        {list.map((prop) => (
          <Pressable
            key={prop.id}
            onPress={() => onSelectProperty && onSelectProperty(prop.id)}
            className="flex gap-3 rounded-xl p-2.5 bg-white/5 border border-white/10"
          >
            <Image
             
             
              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-white/5"
             source={{ uri: prop.image }} accessibilityLabel={prop.title}/>
            <View className="flex flex-1 flex-col justify-between min-w-0">
              <View className="flex flex-col gap-0.5">
                <Text className="text-xs font-semibold text-white truncate">
                  {prop.title}
                </Text>
                <View className="flex items-center gap-0.5 text-[9px] text-white/50">
                  <MapPin size={10} className="text-white/30 shrink-0" />
                  <Text className="truncate">{prop.city}</Text>
                </View>
              </View>

              <View className="flex items-center justify-between gap-1 mt-1">
                <Text className="text-xs font-extrabold text-indigo-400">
                  {formatPrice(prop.price)} FCFA{" "}
                  <Text className="text-[9px] text-white/40 font-medium">
                    / nuit
                  </Text>
                </Text>
                <View className="flex items-center gap-0.5 text-[10px] font-bold text-white shrink-0">
                  <Star size={10} className="text-amber-400 fill-amber-400" />
                  <Text>{prop.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

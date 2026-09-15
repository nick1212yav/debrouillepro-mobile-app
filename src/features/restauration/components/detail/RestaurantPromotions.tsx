import { View, Text } from "react-native";
import { Tag } from "lucide-react-native";

export function RestaurantPromotions() {
  const promos = [
    {
      code: "MAMA225",
      text: "-15% sur la carte à partir de 10 000 FCFA d'achat",
    },
    { code: "FREECOCODY", text: "Livraison offerte sur Cocody" },
  ];

  return (
    <View className="px-4 py-2"><View className="flex gap-2.5 overflow-x-auto no-scrollbar">{promos.map((promo) => (
          <View key={promo.code} className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/15 flex flex-col gap-1.5 min-w-56 text-left"><View className="flex items-center gap-1.5"><Tag size={13} className="text-orange-400" /><Text className="text-[10px] font-black uppercase text-orange-400 tracking-wider">CODE : {promo.code}</Text></View><Text className="text-xs text-white/80 font-medium leading-tight">{promo.text}</Text></View>
        ))}</View></View>
  );
}

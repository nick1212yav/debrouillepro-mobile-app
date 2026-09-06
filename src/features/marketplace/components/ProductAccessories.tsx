import { View, Text, Image } from "react-native";
// src/features/marketplace/components/ProductAccessories.tsx
import { Package } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";

interface Accessory {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
}

interface Props {
  accessories: Accessory[];
  onSelect: (accessory: Accessory) => void;
}

export function ProductAccessories({ accessories, onSelect }: Props) {
  if (!accessories || accessories.length === 0) return null;

  return (
    <View className="space-y-2">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Accessoires compatibles
      </Text>
      <View
        className="flex gap-2 overflow-x-auto pb-1"
        style={{  }}
      >
        {accessories.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => onSelect(item)}
            className="flex-shrink-0 w-32 p-2 rounded-xl bg-white/5 border border-white/5 text-left"
          >
            {item.image ? (
              <Image
               
               
                className="w-full h-20 object-cover rounded-lg mb-1.5"
               source={{ uri: item.image }} accessibilityLabel={item.title}/>
            ) : (
              <View className="w-full h-20 rounded-lg bg-white/5 flex items-center justify-center mb-1.5">
                <Package size={20} className="text-white/20" />
              </View>
            )}
            <Text className="text-white/70 text-xs truncate">{item.title}</Text>
            <Text className="text-orange-400 font-bold text-xs">
              {formatPrice(item.price, item.currency)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

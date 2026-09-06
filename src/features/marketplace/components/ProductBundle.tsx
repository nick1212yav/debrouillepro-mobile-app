import { Pressable, View, Text, Image } from "react-native";
// src/features/marketplace/components/ProductBundle.tsx
import { Package, Plus } from "lucide-react-native";
import { formatPrice } from "../utils/formatter";

interface BundleItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
}

interface Props {
  items: BundleItem[];
  bundlePrice: number;
  currency: string;
  savings: number;
  onAddToCart: () => void;
}

export function ProductBundle({
  items,
  bundlePrice,
  currency,
  savings,
  onAddToCart,
}: Props) {
  if (!items || items.length < 2) return null;

  return (
    <View className="space-y-3">
      <Text className="text-xs text-white/40 font-semibold uppercase tracking-wider">
        Offre groupée
      </Text>
      <View
        className="p-4 rounded-2xl"
        style={{ backgroundColor: "rgba(139,92,246,0.06)", borderWidth: 1, borderColor: "rgba(139,92,246,0.12)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2 flex-wrap">
          {items.map((item, index) => (
            <View key={item.id} className="flex items-center gap-1">
              <View className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5">
                {item.image ? (
                  <Image
                   
                   
                    className="w-8 h-8 rounded object-cover"
                   source={{ uri: item.image }} accessibilityLabel={item.title}/>
                ) : (
                  <Package size={16} className="text-white/30" />
                )}
                <Text className="text-white/70 text-xs truncate max-w-[80px]">
                  {item.title}
                </Text>
              </View>
              {index < items.length - 1 && (
                <Plus size={12} className="text-white/20" />
              )}
            </View>
          ))}
        </View>
        <View className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <View>
            <Text className="text-white/40 text-xs line-through">
              {formatPrice(
                items.reduce((s, i) => s + i.price, 0),
                currency,
              )}
            </Text>
            <Text className="text-white font-black text-lg">
              {formatPrice(bundlePrice, currency)}
            </Text>
            <Text className="text-green-400 text-xs font-medium">
              <Text>Économisez</Text>{formatPrice(savings, currency)}
            </Text>
          </View>
          <Pressable
            onPress={onAddToCart}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white"
            style={{  }}
          >
            <Text>Ajouter le lot</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

import { Pressable, View, Text, Image } from "react-native";
import { useState } from "react";
import { ShoppingBag, Tag, MapPin, Star, Heart } from "lucide-react-native";

interface MarketplaceItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  location?: string;
  rating?: number;
  isLiked?: boolean;
}

interface Props {
  items: MarketplaceItem[];
  onSelect: (itemId: string) => void;
  onLike?: (itemId: string) => void;
}

export function CommunityMarketplace({ items, onSelect, onLike }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <View className="space-y-3"><View className="flex items-center gap-2"><ShoppingBag size={16} className="text-white/30" /><Text className="text-sm font-medium text-white/50">Marketplace</Text></View><View className="gap-2">{items.slice(0, 4).map((item) => (
          <Pressable key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} onPress={() => onSelect(item.id)} className="relative rounded-xl overflow-hidden group bg-white/5 border border-white/5">
            {item.image ? (
              <Image className="w-full aspect-square object-cover transition-transform duration-300" source={{ uri: item.image }} accessibilityLabel={item.title} />
            ) : (
              <View className="w-full aspect-square flex items-center justify-center bg-white/5">
                <Tag size={24} className="text-white/20" />
              </View>
            )}
            <View className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <View className="absolute bottom-2 left-2 right-2">
              <Text className="text-white text-xs font-medium truncate">
                {item.title}
              </Text>
              <Text className="text-amber-400 text-sm font-bold">
                {item.price} {item.currency}
              </Text>
            </View>
            {item.location && (
              <View className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/50 backdrop-blur px-1.5 py-0.5 rounded-lg">
                <MapPin size={10} className="text-white/40" />
                <Text className="text-white/40 text-[8px] truncate max-w-12">
                  {item.location}
                </Text>
              </View>
            )}
            {item.rating && (
              <View className="absolute top-2 left-2 flex items-center gap-0.5 bg-black/50 backdrop-blur px-1.5 py-0.5 rounded-lg">
                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                <Text className="text-white text-[8px]">{item.rating}</Text>
              </View>
            )}
            {onLike && (
              <Pressable onPress={(e) => {
                  onLike(item.id);
                }} className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/50 backdrop-blur transition-colors">
                <Heart
                  size={12}
                  className={
                    item.isLiked ? "fill-red-500 text-red-500" : "text-white/60"
                  }
                />
              </Pressable>
            )}
          </Pressable>
        ))}</View></View>
  );
}

import { View, Text } from "react-native";
// src/features/agri/components/seller/AgriSellerProfile.tsx
import { Calendar, MapPin, ShieldCheck, Star, Store } from "lucide-react-native";

interface AgriSellerProfileProps {
  seller: {
    userId: string;
    name: string;
    verified: boolean;
    rating: number;
    reviewCount: number;
    joinedAt: string;
  };
  locationCity: string;
}

export function AgriSellerProfile({
  seller,
  locationCity,
}: AgriSellerProfileProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  };

  return (
    <View className="w-full rounded-[28px] overflow-hidden bg-white/[0.02] border border-white/5 p-5 space-y-4">
      <View className="flex items-start justify-between gap-4">
        <View className="flex gap-4">
          <View className="w-14 h-14 rounded-2xl flex items-center justify-center bg-green-500/10 text-green-400 border border-green-500/20 flex-shrink-0">
            <Store size={26} />
          </View>
          <View className="space-y-1">
            <View className="flex items-center gap-1.5 flex-wrap">
              <Text className="text-white font-black text-base leading-tight">
                {seller.name}
              </Text>
              {seller.verified && (
                <ShieldCheck
                  size={16}
                  className="text-emerald-400 flex-shrink-0"
                />
              )}
            </View>
            <View className="flex items-center gap-2 text-xs text-white/50">
              <View className="flex items-center gap-0.5">
                <Star size={11} className="fill-yellow-500 text-yellow-500" />
                <Text className="font-bold text-white/80">
                  {seller.rating.toFixed(1)}
                </Text>
                <Text className="text-white/30">
                  ({seller.reviewCount} avis)
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View className="gap-3 pt-4 border-t border-white/5 text-[11px] text-white/50">
        <View className="flex items-center gap-2">
          <Calendar size={13} className="text-white/30 flex-shrink-0" />
          <Text>Inscrit en {formatDate(seller.joinedAt)}</Text>
        </View>
        <View className="flex items-center gap-2">
          <MapPin size={13} className="text-white/30 flex-shrink-0" />
          <Text><Text>Exploitation :</Text>{locationCity}</Text>
        </View>
      </View>
    </View>
  );
}

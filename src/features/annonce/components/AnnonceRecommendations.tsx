import { useRouter } from "expo-router";
import { View, Text, Image, Pressable } from "react-native";
import { Sparkles, Tag, Loader2 } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatPrice } from "@/lib/utils";

interface Props {
  publicationId: Id<"publications">;
  title?: string;
  maxItems?: number;
}

export function AnnonceRecommendations({
  publicationId,
  title = "Produits similaires",
  maxItems = 6,
}: Props) {
  const router = useRouter();
  const recommendationsData = useQuery(api.recommendations.getSimilar, {
    publicationId,
    limit: maxItems,
  });

  if (recommendationsData === undefined) {
    return (
      <View className="space-y-3">
        <View className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <Text className="text-sm font-medium text-white/70">{title}</Text>
        </View>
        <View className="flex justify-center py-4">
          <Loader2 size={24} className="text-white/30 animate-spin" />
        </View>
      </View>
    );
  }

  const annonces = recommendationsData || [];

  if (annonces.length === 0) return null;

  return (
    <View className="space-y-3">
      <View className="flex items-center gap-2">
        <Sparkles size={16} className="text-purple-400" />
        <Text className="text-sm font-medium text-white/70">{title}</Text>
      </View>

      <View className="gap-2">
        {annonces.slice(0, maxItems).map((pub: any, index: number) => {
          const price = pub.price ? parseFloat(pub.price) : undefined;
          const meta = pub.meta ? JSON.parse(pub.meta) : {};
          return (
            <Pressable
              key={pub._id}
              onPress={() => router.push(`/annonce/${pub._id}`)}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
            >
              {pub.images?.[0] ? (
                <Image
                 
                 
                  className="w-full h-20 object-cover"
                  loading="lazy"
                 source={{ uri: pub.images[0] }} accessibilityLabel={pub.title}/>
              ) : (
                <View className="w-full h-20 flex items-center justify-center bg-white/5">
                  <Tag size={20} className="text-white/20" />
                </View>
              )}
              <View className="p-2">
                <Text className="text-white text-xs font-medium">
                  {pub.title}
                </Text>
                {price && (
                  <Text className="text-amber-400 text-xs font-bold">
                    {formatPrice(price, meta.currency || "USD")}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

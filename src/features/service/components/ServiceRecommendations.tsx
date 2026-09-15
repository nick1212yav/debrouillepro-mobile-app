import { View, Text, Image } from "react-native";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptServiceProvider } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  providerId: Id<"serviceProviders">;
}

export function ServiceRecommendations({ providerId }: Props) {
  const navigate = useNavigate();
  const recsData = useQuery(api.serviceProviders.recommend, { providerId });

  if (!recsData || recsData.length === 0) return null;

  const recs = recsData.map(adaptServiceProvider);

  return (
    <View className="space-y-3"><Text className="text-sm font-medium text-white/50">Recommandations</Text><View className="gap-2">{recs.slice(0, 4).map((p) => (
          <View key={p._id} onPress={() => navigate(`/service/${p._id}`)} className="rounded-xl overflow-hidden bg-white/5 border border-white/5 p-2 transition-colors">
            {p.imageUrl && (
              <Image className="w-full h-16 object-cover rounded-lg" source={{ uri: p.imageUrl }} accessibilityLabel={p.name} />
            )}
            <Text className="text-white text-xs font-medium mt-1 truncate">
              {p.name}
            </Text>
            <Text className="text-orange-400 text-xs">{p.price}</Text>
          </View>
        ))}</View></View>
  );
}

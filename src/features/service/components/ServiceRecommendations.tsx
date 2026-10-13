import { Image, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { adaptServiceProvider } from "../adapter";

interface Props {
  providerId: Id<"serviceProviders">;
  /** Dev/preview : autorise la lecture des prestataires isDemo. */
  allowDemo?: boolean;
}

export function ServiceRecommendations({ providerId, allowDemo }: Props) {
  const router = useRouter();

  const recsData = useQuery(api.services.providers.recommend, {
    providerId,
    allowDemo,
  });

  if (!recsData || recsData.length === 0) {
    return null;
  }

  const recommendations = recsData.map(adaptServiceProvider).slice(0, 4);

  return (
    <View className="gap-3">
      <Text className="text-sm font-medium text-white/50">Recommandations</Text>

      <View className="gap-2">
        {recommendations.map((provider) => (
          <Pressable
            key={provider._id}
            accessibilityRole="button"
            accessibilityLabel={`Voir le service ${provider.name}`}
            onPress={() => router.push(`/service/${provider._id}`)}
            className="overflow-hidden rounded-xl border border-white/5 bg-white/5 p-2 active:bg-white/10"
          >
            {provider.imageUrl ? (
              <Image
                className="h-16 w-full rounded-lg"
                source={{ uri: provider.imageUrl }}
                resizeMode="cover"
                accessibilityLabel={provider.name}
              />
            ) : null}

            <Text
              className="mt-2 text-xs font-medium text-white"
              numberOfLines={1}
            >
              {provider.name}
            </Text>

            <Text className="text-xs text-orange-400">{provider.price}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

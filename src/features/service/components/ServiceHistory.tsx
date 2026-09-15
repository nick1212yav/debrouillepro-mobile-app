import { View, Text } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function ServiceHistory({
  providerId,
}: {
  providerId: Id<"serviceProviders">;
}) {
  const history = useQuery(api.serviceProviders.getHistory, { providerId });
  if (!history || history.length === 0) return null;
  return (
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Historique</Text>
      {history.map((h) => (
        <View key={h._id} className="p-2 rounded-xl bg-white/5 text-white/60 text-xs">
          {h.event}
        </View>
      ))}
    </View>
  );
}

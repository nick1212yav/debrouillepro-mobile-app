import { Text, View } from "react-native";
import type { TopPublication } from "../services/analytics.service";

import analyticsService from "../services/analytics.service";

interface TopPublicationsProps {
  publications: TopPublication[];
}

export function TopPublications({ publications }: TopPublicationsProps) {
  const sorted = analyticsService.sortTopPublications(publications);

  return (
    <View className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <View className="mb-4">
        <Text className="text-sm font-semibold text-white">
          Publications les plus performantes
        </Text>

        <Text className="mt-1 text-xs text-white/30">
          Top 5 selon les interactions
        </Text>
      </View>

      {sorted.length === 0 ? (
        <View className="py-8 text-center text-xs text-white/30">
          Aucune publication disponible.
        </View>
      ) : (
        <View className="space-y-2">
          {sorted.map((publication, index) => (
            <View
              key={publication._id}
              className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
            >
              <Text className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-xs font-semibold text-white/50">
                {index + 1}
              </Text>

              <View className="min-w-0 flex-1">
                <Text className="truncate text-sm font-medium text-white">
                  {publication.title}
                </Text>

                <Text className="mt-1 text-[10px] uppercase tracking-wide text-white/30">
                  {publication.type}
                </Text>
              </View>

              <View className="flex shrink-0 gap-3 text-[10px] text-white/40">
                <Text>👁 {publication.views}</Text>

                <Text>♥ {publication.likes}</Text>

                <Text>💬 {publication.comments}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default TopPublications;

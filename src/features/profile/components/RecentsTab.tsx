import { Text, View, Pressable } from "react-native";

// src/features/profile/components/RecentsTab.tsx
import { History, ChevronRight } from "lucide-react-native";
import { useActivity } from "@/hooks/use-activity.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface RecentsTabProps {
  onNavigate: (p: string) => void;
  accentHex: string;
}

export function RecentsTab({ onNavigate, accentHex }: RecentsTabProps) {
  const { entries, isLoading } = useActivity();
  const moduleVisits = entries.filter((e) => e.type === "view_module");

  const seen = new Set<string>();
  const unique = moduleVisits
    .filter((e) => {
      if (!e.target || seen.has(e.target)) return false;
      seen.add(e.target);
      return true;
    })
    .slice(0, 10);

  return (
    <View key="recents" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <View className="flex items-center gap-2 mb-3">
        <History size={14} className="text-white/40" />
        <Text className="text-xs font-bold text-white/50 uppercase tracking-wider">
          Modules consultés récemment
        </Text>
      </View>

      {isLoading ? (
        <View className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full rounded-2xl" />
          ))}
        </View>
      ) : unique.length === 0 ? (
        <View className="text-center py-8">
          <History size={28} className="mx-auto mb-2 text-white/20" />
          <Text className="text-white/30 text-sm font-semibold">
            Aucun module consulté
          </Text>
          <Text className="text-white/20 text-xs mt-1">
            Naviguez dans l'app pour voir votre historique
          </Text>
        </View>
      ) : (
        <View className="flex flex-col gap-2">
          {unique.map((entry, i) => (
            <Pressable key={entry._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onPress={() => onNavigate(entry.target ?? "")} className="flex items-center gap-3 p-3 rounded-2xl active:scale-98 transition-all text-left w-full" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
              <View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentHex}18`, borderStyle: "solid" }}>
                <Text className="text-lg">📱</Text>
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-sm font-semibold truncate">
                  {entry.label}
                </Text>
                <Text className="text-white/35 text-xs">
                  {new Date(entry._creationTime).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <ChevronRight size={14} className="text-white/25 flex-shrink-0" />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

import { Pressable, Text, View } from "react-native";

import type { Id } from "@/convex/_generated/dataModel";

interface MinimizedCallProps {
  callId: Id<"calls">;
  type: "audio" | "video";
  onExpand: () => void;
  onEnd: () => void;
}

export function MinimizedCall({
  callId: _callId,
  type,
  onExpand,
  onEnd,
}: MinimizedCallProps) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 shadow-2xl">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
        <Text className="text-base">{type === "video" ? "📹" : "📞"}</Text>
      </View>

      <Pressable
        onPress={onExpand}
        accessibilityRole="button"
        accessibilityLabel="Développer l'appel en cours"
        className="min-w-0 flex-1 active:opacity-70"
      >
        <Text numberOfLines={1} className="text-sm font-medium text-white">
          Appel en cours
        </Text>
      </Pressable>

      <Pressable
        onPress={onEnd}
        accessibilityRole="button"
        accessibilityLabel="Terminer l'appel"
        className="rounded-full bg-red-600 px-3 py-2 active:bg-red-700"
      >
        <Text className="text-xs font-semibold text-white">Fin</Text>
      </Pressable>
    </View>
  );
}

export default MinimizedCall;

import { Pressable, View, Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface MinimizedCallProps {
  callId: Id<"calls">;
  type: "audio" | "video";
  onExpand: () => void;
  onEnd: () => void;
}

export function MinimizedCall({ type, onExpand, onEnd }: MinimizedCallProps) {
  return (
    <View className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-white shadow-2xl">
      <View className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20">
        {type === "video" ? "📹" : "📞"}
      </View>

      <Pressable onPress={onExpand} className="text-sm font-medium">
        <Text>Appel en cours</Text></Pressable>

      <Pressable
        onPress={onEnd}
        className="rounded-full bg-red-600 px-3 py-2 text-xs"
      >
        <Text>Fin</Text></Pressable>
    </View>
  );
}

export default MinimizedCall;

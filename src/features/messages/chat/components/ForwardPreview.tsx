import { Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface ForwardPreviewProps {
  messageId: Id<"messages">;
  text?: string;
}

export function ForwardPreview({ text }: ForwardPreviewProps) {
  return (
    <View className="mb-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
        Message transféré
      </Text>

      {text && (
        <Text className="mt-1 text-xs text-white/60">{text}</Text>
      )}
    </View>
  );
}

export default ForwardPreview;

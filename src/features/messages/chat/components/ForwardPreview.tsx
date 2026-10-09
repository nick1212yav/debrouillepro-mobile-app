import { Text, View } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface ForwardPreviewProps {
  messageId: Id<"messages">;
  text?: string;
}

export function ForwardPreview({ messageId, text }: ForwardPreviewProps) {
  void messageId;

  const trimmedText = text?.trim();

  return (
    <View
      className="mb-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2.5"
      accessibilityRole="text"
      accessibilityLabel="Message transféré"
    >
      <View className="flex-row items-center">
        <View className="mr-2 h-1.5 w-1.5 rounded-full bg-white/40" />

        <Text
          className="text-[10px] font-semibold uppercase tracking-[0.8px] text-white/45"
          numberOfLines={1}
        >
          Message transféré
        </Text>
      </View>

      {trimmedText ? (
        <Text
          className="mt-1.5 text-xs leading-4 text-white/65"
          numberOfLines={4}
          ellipsizeMode="tail"
        >
          {trimmedText}
        </Text>
      ) : (
        <Text className="mt-1.5 text-xs italic leading-4 text-white/30">
          Contenu du message
        </Text>
      )}
    </View>
  );
}

export default ForwardPreview;

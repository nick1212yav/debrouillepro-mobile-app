import { Text, View } from "react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface ReplyPreviewProps {
  replyToId: Id<"messages">;
  own?: boolean;
}

export function ReplyPreview({ replyToId, own = false }: ReplyPreviewProps) {
  const message = useQuery(api.messages.messages.get, {
    messageId: replyToId,
  });

  if (message === undefined) {
    return (
      <View className="mb-2 rounded-lg bg-black/5 px-2 py-1 text-xs opacity-50">
        Chargement de la réponse...
      </View>
    );
  }

  if (!message) {
    return (
      <View className="mb-2 rounded-lg bg-black/5 px-2 py-1 text-xs opacity-50">
        Message original introuvable
      </View>
    );
  }

  return (
    <View
      className={`mb-2 rounded-lg border-l-2 px-2 py-1 ${
        own ? "border-black/30 bg-black/5" : "border-white/30 bg-white/5"
      }`}
    >
      <Text className="text-[10px] font-semibold opacity-60">
        {message.sender?.name ?? "Utilisateur"}
      </Text>

      <Text className="mt-0.5 text-xs opacity-60">
        {message.isDeleted ? "Message supprimé" : message.text}
      </Text>
    </View>
  );
}

export default ReplyPreview;

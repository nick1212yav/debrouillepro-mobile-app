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
      <View
        className={[
          "mb-2 rounded-xl border-l-2 px-3 py-2",
          own
            ? "border-black/20 bg-black/[0.04]"
            : "border-white/20 bg-white/[0.05]",
        ].join(" ")}
        accessibilityLabel="Chargement de la réponse"
      >
        <Text
          className={[
            "text-[11px] leading-4",
            own ? "text-black/45" : "text-white/45",
          ].join(" ")}
        >
          Chargement de la réponse…
        </Text>
      </View>
    );
  }

  if (!message) {
    return (
      <View
        className={[
          "mb-2 rounded-xl border-l-2 px-3 py-2",
          own
            ? "border-black/15 bg-black/[0.03]"
            : "border-white/15 bg-white/[0.04]",
        ].join(" ")}
        accessibilityLabel="Message original introuvable"
      >
        <Text
          className={[
            "text-[11px] italic leading-4",
            own ? "text-black/40" : "text-white/40",
          ].join(" ")}
        >
          Message original introuvable
        </Text>
      </View>
    );
  }

  const senderName = message.sender?.name?.trim() || "Utilisateur";

  const previewText = message.isDeleted
    ? "Message supprimé"
    : message.text?.trim() || "Pièce jointe";

  return (
    <View
      className={[
        "mb-2 overflow-hidden rounded-xl border-l-2 px-3 py-2",
        own
          ? "border-black/25 bg-black/[0.05]"
          : "border-white/25 bg-white/[0.05]",
      ].join(" ")}
      accessibilityLabel={`Réponse à ${senderName}`}
    >
      <Text
        className={[
          "text-[10px] font-semibold leading-4",
          own ? "text-black/60" : "text-white/60",
        ].join(" ")}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {senderName}
      </Text>

      <Text
        className={[
          "mt-0.5 text-xs leading-4",
          own ? "text-black/55" : "text-white/55",
        ].join(" ")}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {previewText}
      </Text>
    </View>
  );
}

export default ReplyPreview;

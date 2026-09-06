import { View } from "react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { VoicePlayer } from "./VoicePlayer";

interface VoiceMessageProps {
  messageId: Id<"messages">;
  fileUrl?: string | null;
}

export function VoiceMessage({ messageId, fileUrl }: VoiceMessageProps) {
  const voice = useQuery(api.messages.voice.getVoiceMessage, {
    messageId,
  });

  if (voice === undefined) {
    return (
      <View className="text-sm text-white/50">
        Chargement du message vocal...
      </View>
    );
  }

  if (!voice) {
    return (
      <View className="text-sm text-red-400">Message vocal introuvable.</View>
    );
  }

  if (!voice.fileId) {
    return (
      <View className="text-sm text-red-400">Fichier vocal indisponible.</View>
    );
  }

  if (!fileUrl) {
    return (
      <View className="text-sm text-white/50">Fichier vocal non disponible.</View>
    );
  }

  return <VoicePlayer src={fileUrl} duration={voice.duration ?? 0} />;
}

export default VoiceMessage;

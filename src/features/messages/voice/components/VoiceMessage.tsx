// src/features/messages/voice/components/VoiceMessage.tsx

import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import { VoicePlayer } from "./VoicePlayer";

interface VoiceMessageProps {
  messageId: Id<"messages">;
  fileUrl?: string | null;
}

export function VoiceMessage({ messageId, fileUrl }: VoiceMessageProps) {
  const voice = useQuery(api.messages.voice.getVoiceMessage, { messageId });

  if (voice === undefined) {
    return (
      <View
        style={styles.stateContainer}
        accessibilityRole="text"
        accessibilityLabel="Chargement du message vocal"
      >
        <Text style={styles.loadingText}>Chargement du message vocal...</Text>
      </View>
    );
  }

  if (!voice) {
    return (
      <View
        style={styles.stateContainer}
        accessibilityRole="text"
        accessibilityLabel="Message vocal introuvable"
      >
        <Text style={styles.errorText}>Message vocal introuvable.</Text>
      </View>
    );
  }

  if (!voice.fileId) {
    return (
      <View
        style={styles.stateContainer}
        accessibilityRole="text"
        accessibilityLabel="Fichier vocal indisponible"
      >
        <Text style={styles.errorText}>Fichier vocal indisponible.</Text>
      </View>
    );
  }

  if (!fileUrl) {
    return (
      <View
        style={styles.stateContainer}
        accessibilityRole="text"
        accessibilityLabel="Fichier vocal non disponible"
      >
        <Text style={styles.loadingText}>Fichier vocal non disponible.</Text>
      </View>
    );
  }

  return <VoicePlayer src={fileUrl} duration={voice.duration ?? 0} />;
}

const styles = StyleSheet.create({
  stateContainer: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },

  loadingText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
  },

  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#f87171",
  },
});

export default VoiceMessage;

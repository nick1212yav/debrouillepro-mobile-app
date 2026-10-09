// src/features/messages/voice/components/VoiceTranscription.tsx

import { StyleSheet, Text, View } from "react-native";

interface VoiceTranscriptionProps {
  transcription?: string | null;
  isLoading?: boolean;
  error?: string | null;
}

export function VoiceTranscription({
  transcription,
  isLoading = false,
  error,
}: VoiceTranscriptionProps) {
  if (isLoading) {
    return (
      <View
        style={styles.loadingContainer}
        accessible
        accessibilityRole="text"
        accessibilityLabel="Transcription en cours"
      >
        <Text style={styles.loadingText}>Transcription en cours...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer} accessible accessibilityRole="alert">
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!transcription) {
    return null;
  }

  return (
    <View
      style={styles.transcriptionContainer}
      accessible
      accessibilityRole="text"
      accessibilityLabel="Transcription du message vocal"
    >
      <Text style={styles.transcriptionText}>{transcription}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  loadingText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.50)",
  },

  errorContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.10)",
  },

  errorText: {
    fontSize: 12,
    lineHeight: 17,
    color: "#f87171",
  },

  transcriptionContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  transcriptionText: {
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.80)",
  },
});

export default VoiceTranscription;

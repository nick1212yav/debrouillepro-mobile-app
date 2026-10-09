// src/features/messages/voice/components/VoiceRecorder.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect } from "react";

import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { VoiceWaveform } from "./VoiceWaveform";

interface VoiceRecorderProps {
  onRecorded: (recording: {
    blob: Blob;
    duration: number;
    mimeType: string;
  }) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safeSeconds / 60);

  const remaining = safeSeconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function VoiceRecorder({
  onRecorded,
  onCancel,
  disabled = false,
}: VoiceRecorderProps) {
  const {
    isRecording,
    duration,
    recording,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder();

  useEffect(() => {
    if (!recording) {
      return;
    }

    onRecorded(recording);
  }, [onRecorded, recording]);

  const handleRecordingToggle = () => {
    if (disabled) {
      return;
    }

    if (isRecording) {
      void stopRecording();
      return;
    }

    void startRecording();
  };

  const handleCancel = () => {
    if (disabled) {
      return;
    }

    void cancelRecording();
    onCancel?.();
  };

  const waveformProgress = duration > 0 ? 0.5 : 0;

  return (
    <View style={[styles.container, disabled && styles.containerDisabled]}>
      <Pressable
        disabled={disabled}
        onPress={handleRecordingToggle}
        style={({ pressed }) => [
          styles.recordButton,
          isRecording ? styles.recordButtonRecording : styles.recordButtonIdle,
          pressed && !disabled && styles.recordButtonPressed,
          disabled && styles.recordButtonDisabled,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isRecording
            ? "Arrêter l'enregistrement"
            : "Commencer l'enregistrement"
        }
        accessibilityState={{
          disabled,
          busy: isRecording,
        }}
      >
        <Text style={styles.recordIcon}>{isRecording ? "■" : "🎙"}</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.waveformRow}>
          <Text
            style={styles.duration}
            accessibilityLabel={`Durée ${formatDuration(duration)}`}
          >
            {formatDuration(duration)}
          </Text>

          <View style={styles.waveform}>
            <VoiceWaveform progress={waveformProgress} active={isRecording} />
          </View>
        </View>

        {error ? (
          <Text
            style={styles.error}
            numberOfLines={2}
            accessibilityRole="alert"
          >
            {error}
          </Text>
        ) : null}
      </View>

      {isRecording && onCancel ? (
        <Pressable
          onPress={handleCancel}
          disabled={disabled}
          style={({ pressed }) => [
            styles.cancelButton,
            pressed && !disabled && styles.cancelButtonPressed,
            disabled && styles.cancelButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Annuler l'enregistrement"
          accessibilityState={{
            disabled,
          }}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    backgroundColor: "#18181b",
  },

  containerDisabled: {
    opacity: 0.6,
  },

  recordButton: {
    width: 40,
    height: 40,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },

  recordButtonIdle: {
    backgroundColor: "#059669",
  },

  recordButtonRecording: {
    backgroundColor: "#dc2626",
  },

  recordButtonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.95 }],
  },

  recordButtonDisabled: {
    opacity: 0.5,
  },

  recordIcon: {
    fontSize: 16,
    lineHeight: 20,
    color: "#ffffff",
  },

  content: {
    minWidth: 0,
    flex: 1,
  },

  waveformRow: {
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  duration: {
    flexShrink: 0,
    minWidth: 36,
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(255,255,255,0.60)",
  },

  waveform: {
    minWidth: 0,
    flex: 1,
  },

  error: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 17,
    color: "#f87171",
  },

  cancelButton: {
    flexShrink: 0,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },

  cancelButtonPressed: {
    opacity: 0.65,
  },

  cancelButtonDisabled: {
    opacity: 0.5,
  },

  cancelText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.60)",
  },
});

export default VoiceRecorder;

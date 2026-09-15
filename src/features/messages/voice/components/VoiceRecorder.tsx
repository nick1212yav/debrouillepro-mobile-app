import { View, Pressable, Text } from "react-native";
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

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  const remaining = seconds % 60;

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

  const handleCancel = () => {
    cancelRecording();
    onCancel?.();
  };

  return (
    <View className="flex items-center gap-3 rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3"><Pressable disabled={disabled} onPress={isRecording ? stopRecording : startRecording} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${
          isRecording ? "bg-red-600" : "bg-emerald-600"
        } disabled:cursor-not-allowed disabled:opacity-50`} accessibilityLabel={isRecording
            ? "Arrêter l'enregistrement"
            : "Commencer l'enregistrement"}>{isRecording ? "■" : "🎙"}</Pressable><View className="min-w-0 flex-1"><View className="flex items-center gap-3 text-xs text-white/60"><Text>{formatDuration(duration)}</Text><VoiceWaveform progress={duration > 0 ? 0.5 : 0} active={isRecording} /></View>{error && <Text className="mt-1 truncate text-xs text-red-400">{error}</Text>}</View>{isRecording && (
        <Pressable onPress={handleCancel} className="text-xs text-white/60">
          Annuler
        </Pressable>
      )}</View>
  );
}

export default VoiceRecorder;

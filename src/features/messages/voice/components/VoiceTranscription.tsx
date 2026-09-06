import { View } from "react-native";

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
      <View className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/50">
        Transcription en cours...
      </View>
    );
  }

  if (error) {
    return (
      <View className="rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-400">
        {error}
      </View>
    );
  }

  if (!transcription) {
    return null;
  }

  return (
    <View className="rounded-xl bg-white/5 px-3 py-2 text-sm text-white/80">
      {transcription}
    </View>
  );
}

export default VoiceTranscription;

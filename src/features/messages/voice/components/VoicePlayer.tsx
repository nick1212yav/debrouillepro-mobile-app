import { Text, Pressable, View } from "react-native";
import { useMemo } from "react";

import { useVoicePlayer } from "../hooks/useVoicePlayer";

import { VoiceWaveform } from "./VoiceWaveform";

interface VoicePlayerProps {
  src: string;
  duration?: number;
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safeSeconds / 60);

  const remaining = safeSeconds % 60;

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

export function VoicePlayer({
  src,
  duration: initialDuration,
}: VoicePlayerProps) {
  const { isPlaying, currentTime, duration, error, toggle, seek } =
    useVoicePlayer(src);

  const totalDuration = duration || initialDuration || 0;

  const progress = useMemo(
    () => (totalDuration > 0 ? currentTime / totalDuration : 0),
    [currentTime, totalDuration],
  );

  return (
    <View className="flex min-w-0 items-center gap-3">
      <Pressable
        onPress={() => {
          void toggle();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white"
        accessibilityLabel={isPlaying ? "Mettre en pause" : "Lire le message vocal"}
      >
        {isPlaying ? "Ⅱ" : "▶"}
      </Pressable>

      <Pressable
        onPress={() => {
          if (totalDuration <= 0) {
            return;
          }

          const next = progress >= 0.95 ? 0 : currentTime + 5;

          seek(next);
        }}
        className="min-w-0 flex-1 text-left text-white"
        accessibilityLabel="Avancer dans le message vocal"
      >
        <VoiceWaveform progress={progress} active={isPlaying} />
      </Pressable>

      <Text className="shrink-0 text-xs text-white/60">
        {formatTime(currentTime || totalDuration)}
      </Text>

      {error && <Text className="text-xs text-red-400">Erreur</Text>}
    </View>
  );
}

export default VoicePlayer;

// src/features/messages/voice/components/VoicePlayer.tsx

import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import { useVoicePlayer } from "../hooks/useVoicePlayer";
import { VoiceWaveform } from "./VoiceWaveform";

interface VoicePlayerProps {
  src: string;
  duration?: number;
}

function formatTime(seconds: number): string {
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

  const progress = useMemo(() => {
    if (totalDuration <= 0) {
      return 0;
    }

    return Math.min(1, Math.max(0, currentTime / totalDuration));
  }, [currentTime, totalDuration]);

  const displayedTime = currentTime > 0 ? currentTime : totalDuration;

  const handleToggle = () => {
    void toggle();
  };

  const handleSeek = () => {
    if (totalDuration <= 0) {
      return;
    }

    const next =
      progress >= 0.95 ? 0 : Math.min(totalDuration, currentTime + 5);

    seek(next);
  };

  return (
    <View
      style={styles.container}
      accessible
      accessibilityLabel={`Message vocal, durée ${formatTime(totalDuration)}`}
    >
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying ? "Mettre en pause" : "Lire le message vocal"
        }
        accessibilityHint={
          isPlaying
            ? "Met en pause la lecture du message vocal"
            : "Lance la lecture du message vocal"
        }
      >
        <Text style={styles.playIcon}>{isPlaying ? "Ⅱ" : "▶"}</Text>
      </Pressable>

      <Pressable
        onPress={handleSeek}
        style={styles.waveformButton}
        accessibilityRole="button"
        accessibilityLabel="Avancer dans le message vocal"
        accessibilityHint="Avance de cinq secondes, ou revient au début lorsque la lecture est presque terminée"
      >
        <VoiceWaveform progress={progress} active={isPlaying} />
      </Pressable>

      <Text
        style={styles.time}
        accessibilityLabel={`Temps ${formatTime(displayedTime)}`}
      >
        {formatTime(displayedTime)}
      </Text>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          Erreur
        </Text>
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
  },

  playButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  playButtonPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.96,
      },
    ],
  },

  playIcon: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: "700",
    color: "#ffffff",
  },

  waveformButton: {
    minWidth: 0,
    flex: 1,
  },

  time: {
    flexShrink: 0,
    minWidth: 38,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "right",
    color: "rgba(255,255,255,0.60)",
  },

  error: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 16,
    color: "#f87171",
  },
});

export default VoicePlayer;

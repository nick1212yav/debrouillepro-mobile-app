// src/features/messages/media/components/AudioPlayer.tsx

import { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Audio } from "expo-av";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({
  src,
  className: _className = "",
}: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadAudio = async () => {
      try {
        setIsBuffering(true);

        const { sound } = await Audio.Sound.createAsync(
          { uri: src },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 250,
          },
          (status) => {
            if (!mounted || !status.isLoaded) {
              return;
            }

            setIsPlaying(status.isPlaying);
            setIsBuffering(status.isBuffering);

            setDuration(
              typeof status.durationMillis === "number"
                ? status.durationMillis / 1000
                : 0,
            );

            setCurrentTime(
              typeof status.positionMillis === "number"
                ? status.positionMillis / 1000
                : 0,
            );

            if (status.didJustFinish) {
              setIsPlaying(false);
              setCurrentTime(0);
            }
          },
        );

        if (!mounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;
      } catch {
        if (mounted) {
          setIsBuffering(false);
        }
      }
    };

    void loadAudio();

    return () => {
      mounted = false;

      const sound = soundRef.current;
      soundRef.current = null;

      if (sound) {
        void sound.unloadAsync();
      }
    };
  }, [src]);

  const togglePlayback = async () => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        if (
          status.positionMillis >=
          (status.durationMillis ?? Number.MAX_SAFE_INTEGER)
        ) {
          await sound.setPositionAsync(0);
        }

        await sound.playAsync();
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const progress =
    duration > 0 ? Math.min(Math.max(currentTime / duration, 0), 1) : 0;

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => void togglePlayback()}
        disabled={isBuffering}
        accessibilityRole="button"
        accessibilityLabel={
          isPlaying ? "Mettre l'audio en pause" : "Lire l'audio"
        }
        accessibilityState={{
          busy: isBuffering,
          disabled: isBuffering,
        }}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
          isBuffering && styles.playButtonDisabled,
        ]}
      >
        <Text style={styles.playIcon}>{isPlaying ? "Ⅱ" : "▶"}</Text>
      </Pressable>

      <View style={styles.content}>
        <View style={styles.progressTrack}>
          <View style={[styles.progress, { width: `${progress * 100}%` }]} />
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.time}>{formatTime(currentTime)}</Text>

          <Text style={styles.time}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    minWidth: 220,
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  playButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(99,102,241,0.22)",
  },

  playButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },

  playButtonDisabled: {
    opacity: 0.5,
  },

  playIcon: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },

  content: {
    flex: 1,
    gap: 6,
  },

  progressTrack: {
    height: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  progress: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#818cf8",
  },

  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  time: {
    fontSize: 10,
    color: "rgba(255,255,255,0.48)",
  },
});

export default AudioPlayer;

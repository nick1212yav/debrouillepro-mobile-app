// src/features/messages/media/components/AudioPlayer.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Audio } from "expo-av";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({
  src,
  className: _className = "",
}: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const mountedRef = useRef(true);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const resetState = useCallback(() => {
    if (!mountedRef.current) {
      return;
    }

    setIsLoaded(false);
    setIsPlaying(false);
    setIsBuffering(false);
    setDuration(0);
    setCurrentTime(0);
  }, []);

  const unloadSound = useCallback(async () => {
    const sound = soundRef.current;

    soundRef.current = null;

    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
    } catch {
      // Le son peut déjà être arrêté ou déchargé.
    }

    try {
      await sound.unloadAsync();
    } catch {
      // Nettoyage best-effort.
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let createdSound: Audio.Sound | null = null;

    const loadAudio = async () => {
      if (!src.trim()) {
        resetState();
        return;
      }

      await unloadSound();
      resetState();

      try {
        if (mountedRef.current) {
          setIsBuffering(true);
        }

        /*
         * Autorise la lecture audio même lorsque le téléphone
         * est en mode silencieux sur iOS.
         */
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const result = await Audio.Sound.createAsync(
          { uri: src },
          {
            shouldPlay: false,
            isLooping: false,
            progressUpdateIntervalMillis: 100,
          },
          (status) => {
            if (cancelled || !mountedRef.current) {
              return;
            }

            if (!status.isLoaded) {
              setIsLoaded(false);
              setIsPlaying(false);
              setIsBuffering(false);
              return;
            }

            setIsLoaded(true);
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

        createdSound = result.sound;

        if (cancelled || !mountedRef.current) {
          await createdSound.unloadAsync();
          createdSound = null;
          return;
        }

        soundRef.current = createdSound;

        if (result.status.isLoaded) {
          setIsLoaded(true);

          setDuration(
            typeof result.status.durationMillis === "number"
              ? result.status.durationMillis / 1000
              : 0,
          );

          setCurrentTime(
            typeof result.status.positionMillis === "number"
              ? result.status.positionMillis / 1000
              : 0,
          );
        }

        setIsBuffering(false);
      } catch {
        if (createdSound) {
          try {
            await createdSound.unloadAsync();
          } catch {
            // Best effort.
          }
        }

        createdSound = null;

        if (!cancelled && mountedRef.current) {
          setIsLoaded(false);
          setIsPlaying(false);
          setIsBuffering(false);
        }
      }
    };

    void loadAudio();

    return () => {
      cancelled = true;

      const sound = soundRef.current;

      soundRef.current = null;

      if (sound) {
        void sound.unloadAsync();
      }

      if (createdSound && createdSound !== sound) {
        void createdSound.unloadAsync();
      }
    };
  }, [src, resetState, unloadSound]);

  const togglePlayback = useCallback(async () => {
    const sound = soundRef.current;

    if (!sound || !isLoaded || isBuffering) {
      return;
    }

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        if (mountedRef.current) {
          setIsLoaded(false);
          setIsPlaying(false);
        }

        return;
      }

      if (status.isPlaying) {
        await sound.pauseAsync();
        return;
      }

      const durationMillis = status.durationMillis ?? 0;

      /*
       * Si le vocal est arrivé à sa fin, on repart proprement
       * depuis le début.
       */
      if (durationMillis > 0 && status.positionMillis >= durationMillis - 100) {
        await sound.setPositionAsync(0);

        if (mountedRef.current) {
          setCurrentTime(0);
        }
      }

      await sound.playAsync();
    } catch {
      if (mountedRef.current) {
        setIsPlaying(false);
      }
    }
  }, [isLoaded, isBuffering]);

  const progress = useMemo(() => {
    if (!Number.isFinite(duration) || duration <= 0) {
      return 0;
    }

    if (!Number.isFinite(currentTime) || currentTime <= 0) {
      return 0;
    }

    return Math.min(1, currentTime / duration);
  }, [currentTime, duration]);

  const buttonLabel = isBuffering
    ? "Chargement du vocal"
    : isPlaying
      ? "Mettre le vocal en pause"
      : "Lire le vocal";

  return (
    <View
      style={styles.container}
      accessibilityLabel="Lecteur de message vocal"
    >
      <Pressable
        onPress={() => void togglePlayback()}
        disabled={!isLoaded || isBuffering}
        accessibilityRole="button"
        accessibilityLabel={buttonLabel}
        accessibilityState={{
          busy: isBuffering,
          disabled: !isLoaded || isBuffering,
        }}
        style={({ pressed }) => [
          styles.playButton,
          pressed && styles.playButtonPressed,
          (!isLoaded || isBuffering) && styles.playButtonDisabled,
        ]}
      >
        {isBuffering ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.playIcon}>{isPlaying ? "Ⅱ" : "▶"}</Text>
        )}
      </Pressable>

      <View style={styles.content}>
        <View
          style={styles.progressTrack}
          accessibilityLabel={`Progression ${Math.round(
            progress * 100,
          )} pour cent`}
        >
          <View
            style={[
              styles.progress,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
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
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const totalSeconds = Math.floor(seconds);

  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    minWidth: 220,
    maxWidth: 340,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 9,

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    borderRadius: 16,

    backgroundColor: "rgba(255,255,255,0.055)",
  },

  playButton: {
    width: 40,
    height: 40,

    flexGrow: 0,
    flexShrink: 0,

    alignItems: "center",
    justifyContent: "center",

    marginRight: 10,

    borderRadius: 20,

    backgroundColor: "rgba(99,102,241,0.28)",
  },

  playButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.94 }],
  },

  playButtonDisabled: {
    opacity: 0.45,
  },

  playIcon: {
    marginLeft: 2,

    fontSize: 15,
    lineHeight: 18,

    fontWeight: "800",

    color: "#FFFFFF",
  },

  content: {
    flex: 1,
    minWidth: 0,

    gap: 6,
  },

  progressTrack: {
    width: "100%",
    height: 5,

    overflow: "hidden",

    borderRadius: 3,

    backgroundColor: "rgba(255,255,255,0.12)",
  },

  progress: {
    height: "100%",

    borderRadius: 3,

    backgroundColor: "#818CF8",
  },

  timeRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  time: {
    fontSize: 10,
    lineHeight: 14,

    fontWeight: "500",

    color: "rgba(255,255,255,0.48)",
  },
});

export default AudioPlayer;

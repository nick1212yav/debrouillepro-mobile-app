import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

// src/features/messages/voice/hooks/useVoicePlayer.ts
//
// Migration Sprint 3.2-K-D : Web Audio API -> expo-av (natif).
// Contrat public inchangé.

type Sound = Audio.Sound;

export function useVoicePlayer(source?: string | null) {
  const soundRef = useRef<Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const ensureSound = useCallback(async (): Promise<Sound | null> => {
    if (!source) return null;
    if (soundRef.current) return soundRef.current;

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: source },
        { shouldPlay: false },
        (status) => {
          if (!status.isLoaded) return;

          setIsPlaying(status.isPlaying);
          setCurrentTime((status.positionMillis ?? 0) / 1000);
          setDuration((status.durationMillis ?? 0) / 1000);

          if (status.didJustFinish) {
            setIsPlaying(false);
            setCurrentTime(0);
          }
        },
      );

      soundRef.current = sound;
      return sound;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de charger ce message vocal.";
      setError(message);
      return null;
    }
  }, [source]);

  const play = useCallback(async () => {
    const sound = await ensureSound();
    if (!sound) return;

    setError(null);

    try {
      await sound.playAsync();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la lecture.";
      setError(message);
    }
  }, [ensureSound]);

  const pause = useCallback(() => {
    const sound = soundRef.current;
    if (!sound) return;
    void sound.pauseAsync();
  }, []);

  const toggle = useCallback(async () => {
    const sound = await ensureSound();
    if (!sound) return;

    const status = await sound.getStatusAsync();

    if (status.isLoaded && status.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [ensureSound, pause, play]);

  const seek = useCallback((time: number) => {
    const sound = soundRef.current;
    if (!sound) return;

    const ms = Math.max(0, Math.floor(time * 1000));
    void sound.setPositionAsync(ms);
    setCurrentTime(time);
  }, []);

  useEffect(() => {
    if (!source) {
      const existing = soundRef.current;
      if (existing) {
        void existing.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    return () => {
      const sound = soundRef.current;
      if (sound) {
        void sound.unloadAsync();
      }
      soundRef.current = null;
    };
  }, [source]);

  return {
    isPlaying,
    currentTime,
    duration,
    error,
    play,
    pause,
    toggle,
    seek,
  };
}

export default useVoicePlayer;
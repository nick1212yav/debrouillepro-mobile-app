// src/features/messages/voice/hooks/useVoicePlayer.ts

import { Audio } from "expo-av";
import { useCallback, useEffect, useRef, useState } from "react";

type Sound = Audio.Sound;

export function useVoicePlayer(source?: string | null) {
  const soundRef = useRef<Sound | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const unloadSound = useCallback(async () => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    soundRef.current = null;

    try {
      await sound.unloadAsync();
    } catch {
      // Le son peut déjà avoir été déchargé.
    }
  }, []);

  const ensureSound = useCallback(async (): Promise<Sound | null> => {
    if (!source) {
      return null;
    }

    if (soundRef.current) {
      return soundRef.current;
    }

    setError(null);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: source },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 250,
        },
        (status) => {
          if (!status.isLoaded) {
            return;
          }

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

    if (!sound) {
      return;
    }

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

  const pause = useCallback(async () => {
    const sound = soundRef.current;

    if (!sound) {
      return;
    }

    try {
      await sound.pauseAsync();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de mettre la lecture en pause.";

      setError(message);
    }
  }, []);

  const toggle = useCallback(async () => {
    const sound = await ensureSound();

    if (!sound) {
      return;
    }

    try {
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        return;
      }

      if (status.isPlaying) {
        await pause();
      } else {
        await play();
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de contrôler la lecture.";

      setError(message);
    }
  }, [ensureSound, pause, play]);

  const seek = useCallback(
    (time: number) => {
      const sound = soundRef.current;

      if (!sound) {
        return;
      }

      const safeTime = Math.max(
        0,
        Math.min(duration > 0 ? duration : time, time),
      );

      const milliseconds = Math.floor(safeTime * 1000);

      void sound.setPositionAsync(milliseconds).catch((err: unknown) => {
        const message =
          err instanceof Error
            ? err.message
            : "Impossible de modifier la position de lecture.";

        setError(message);
      });

      setCurrentTime(safeTime);
    },
    [duration],
  );

  useEffect(() => {
    let cancelled = false;

    const reset = async () => {
      await unloadSound();

      if (cancelled) {
        return;
      }

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setError(null);
    };

    void reset();

    return () => {
      cancelled = true;
    };
  }, [source, unloadSound]);

  useEffect(() => {
    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

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

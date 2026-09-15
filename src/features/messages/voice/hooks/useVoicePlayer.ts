import { useCallback, useEffect, useRef, useState } from "react";

export function useVoicePlayer(source?: string | null) {
  const audioRef = useRef<unknown | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);

  const [duration, setDuration] = useState(0);

  const [error, setError] = useState<string | null>(null);

  const ensureAudio = useCallback(() => {
    if (!source) {
      return null;
    }

    if (!audioRef.current || audioRef.current.src !== source) {
      const audio = new Audio(source);

      audio.preload = "metadata";

      audio.onloadedmetadata = () => {
        setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      };

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onplay = () => {
        setIsPlaying(true);
      };

      audio.onpause = () => {
        setIsPlaying(false);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setError("Impossible de lire ce message vocal.");
        setIsPlaying(false);
      };

      audioRef.current = audio;
    }

    return audioRef.current;
  }, [source]);

  const play = useCallback(async () => {
    const audio = ensureAudio();

    if (!audio) {
      return;
    }

    setError(null);

    try {
      await audio.play();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de démarrer la lecture.",
      );
    }
  }, [ensureAudio]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(async () => {
    const audio = ensureAudio();

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await play();
    } else {
      pause();
    }
  }, [ensureAudio, pause, play]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    const nextTime = Math.max(
      0,
      Math.min(time, Number.isFinite(audio.duration) ? audio.duration : time),
    );

    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  useEffect(() => {
    if (!source) {
      audioRef.current = null;
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    const audio = ensureAudio();

    return () => {
      audio?.pause();

      if (audio) {
        audio.src = "";
      }

      audioRef.current = null;
    };
  }, [ensureAudio, source]);

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

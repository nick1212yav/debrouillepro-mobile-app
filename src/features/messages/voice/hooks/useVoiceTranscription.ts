import { useCallback, useState } from "react";

export function useVoiceTranscription() {
  const [transcription, setTranscription] = useState<string | null>(null);

  const [isTranscribing, setIsTranscribing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(async (_blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      throw new Error(
        "La transcription vocale n'est pas encore exposée par le backend Convex.",
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Impossible de transcrire le message vocal.";

      setError(message);
      return null;
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTranscription(null);
    setError(null);
    setIsTranscribing(false);
  }, []);

  return {
    transcription,
    isTranscribing,
    error,
    transcribe,
    reset,
  };
}

export default useVoiceTranscription;

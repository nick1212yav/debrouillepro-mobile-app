// src/features/messages/voice/hooks/useVoiceTranscription.ts

import { useCallback, useState } from "react";

export function useVoiceTranscription() {
  const [transcription, setTranscription] = useState<string | null>(null);

  const [isTranscribing, setIsTranscribing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const transcribe = useCallback(async (_blob: Blob) => {
    setIsTranscribing(true);
    setError(null);

    try {
      /*
       * La transcription vocale n'est actuellement pas
       * exposée par le backend Convex fourni.
       *
       * Ne pas simuler une transcription et ne pas retourner
       * un faux résultat tant qu'aucun endpoint backend réel
       * n'est disponible.
       */
      const message = "La transcription vocale n'est pas encore disponible.";

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

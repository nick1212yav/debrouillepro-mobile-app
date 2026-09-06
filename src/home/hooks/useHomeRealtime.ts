import { useCallback, useEffect, useRef, useState } from "react";

/**
 * ============================================================
 * DÉBROUILLEPRO — useHomeRealtime
 * ============================================================
 *
 * Point central pour les événements temps réel de la Home.
 *
 * Les queries Convex sont déjà réactives.
 * Ce hook ne crée donc pas de faux abonnement backend.
 * ============================================================
 */

export type HomeRealtimeEvent =
  | "feed_updated"
  | "recommendations_updated"
  | "module_updated"
  | "notification"
  | "refresh";

export interface HomeRealtimePayload {
  type: HomeRealtimeEvent;

  data?: unknown;
}

export interface UseHomeRealtimeOptions {
  enabled?: boolean;

  onEvent?: (event: HomeRealtimePayload) => void;
}

export function useHomeRealtime(options: UseHomeRealtimeOptions = {}) {
  const { enabled = true, onEvent } = options;

  const [lastEvent, setLastEvent] = useState<HomeRealtimePayload | null>(null);

  const callbackRef = useRef(onEvent);

  useEffect(() => {
    callbackRef.current = onEvent;
  }, [onEvent]);

  const emit = useCallback((event: HomeRealtimePayload) => {
    setLastEvent(event);

    callbackRef.current?.(event);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    /**
     * Convex queries utilisées dans la Home
     * restent réactives automatiquement.
     *
     * Ce hook est volontairement léger afin de
     * ne pas créer de deuxième système realtime.
     */

    return undefined;
  }, [enabled]);

  return {
    enabled,

    lastEvent,

    emit,

    isConnected: enabled,
  };
}

export default useHomeRealtime;

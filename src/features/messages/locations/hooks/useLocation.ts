// src/features/messages/locations/hooks/useLocation.ts

import { useMutation, useQuery } from "convex/react";

import { useCallback, useEffect, useRef, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";
import {
  locationsApi,
  normalizeCoordinates,
  type Coordinates,
  type LocationMessage,
} from "../services/locations.service";

export interface UseLocationOptions {
  autoStart?: boolean;
  enableHighAccuracy?: boolean;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoStart = false, enableHighAccuracy = true } = options;

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null,
  );

  const [isLocating, setIsLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const sendLocationMutation = useMutation(locationsApi.send);

  const startLiveMutation = useMutation(locationsApi.startLive);

  const updateLiveMutation = useMutation(locationsApi.updateLive);

  const stopLiveMutation = useMutation(locationsApi.stopLive);

  const getCurrentPosition = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");

      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentPosition(normalizeCoordinates(position));

        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("L'accès à votre position a été refusé.");
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError("Votre position est momentanément indisponible.");
            break;

          case geoError.TIMEOUT:
            setError("La récupération de votre position a expiré.");
            break;

          default:
            setError("Impossible de récupérer votre position.");
        }
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  }, [enableHighAccuracy]);

  const startWatching = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("La géolocalisation n'est pas disponible.");

      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setError(null);
    setIsLocating(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPosition(normalizeCoordinates(position));

        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("L'accès à votre position a été refusé.");
        } else {
          setError("Impossible de mettre à jour votre position.");
        }
      },
      {
        enableHighAccuracy,
        timeout: 15000,
        maximumAge: 5000,
      },
    );
  }, [enableHighAccuracy]);

  const stopWatching = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    setIsLocating(false);
  }, []);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }

    return () => {
      if (
        watchIdRef.current !== null &&
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoStart, startWatching]);

  /**
   * Partage un emplacement fixe.
   */
  const sendLocation = async ({
    conversationId,
    coordinates,
    label,
    address,
    city,
    country,
  }: {
    conversationId: Id<"conversations">;

    coordinates: Coordinates;

    label?: string;

    address?: string;

    city?: string;

    country?: string;
  }) => {
    return sendLocationMutation({
      conversationId,

      latitude: coordinates.latitude,

      longitude: coordinates.longitude,

      accuracy: coordinates.accuracy,

      altitude: coordinates.altitude,

      heading: coordinates.heading,

      speed: coordinates.speed,

      label,

      address,

      city,

      country,
    });
  };

  /**
   * Démarre une localisation Live.
   */
  const startLiveLocation = async ({
    conversationId,
    durationMinutes = 15,
    label,
  }: {
    conversationId: Id<"conversations">;

    durationMinutes?: number;

    label?: string;
  }) => {
    /**
     * On récupère immédiatement une position
     * avant de créer le message Live.
     */
    if (!currentPosition) {
      getCurrentPosition();
    }

    const position = currentPosition;

    if (!position) {
      throw new Error("Votre position n'est pas encore disponible.");
    }

    startWatching();

    return startLiveMutation({
      conversationId,

      latitude: position.latitude,

      longitude: position.longitude,

      accuracy: position.accuracy,

      altitude: position.altitude,

      heading: position.heading,

      speed: position.speed,

      durationMinutes,

      label,
    });
  };

  /**
   * Met à jour une localisation Live.
   */
  const updateLiveLocation = async ({
    messageId,
    coordinates,
  }: {
    messageId: Id<"messages">;

    coordinates: Coordinates;
  }) => {
    return updateLiveMutation({
      messageId,

      latitude: coordinates.latitude,

      longitude: coordinates.longitude,

      accuracy: coordinates.accuracy,

      altitude: coordinates.altitude,

      heading: coordinates.heading,

      speed: coordinates.speed,
    });
  };

  /**
   * Arrête une localisation Live.
   */
  const stopLiveLocation = async ({
    messageId,
  }: {
    messageId: Id<"messages">;
  }) => {
    stopWatching();

    return stopLiveMutation({
      messageId,
    });
  };

  return {
    currentPosition,

    isLocating,

    error,

    getCurrentPosition,

    startWatching,

    stopWatching,

    sendLocation,

    startLiveLocation,

    updateLiveLocation,

    stopLiveLocation,
  };
}

/**
 * Hook pour suivre une localisation Live
 * existante.
 */
export function useLiveLocation(messageId: Id<"messages"> | undefined) {
  return useQuery(
    locationsApi.getLive,
    messageId
      ? {
          messageId,
        }
      : "skip",
  ) as LocationMessage | null | undefined;
}

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

interface LocationRequestOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoStart = false, enableHighAccuracy = true } = options;

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null,
  );

  const [isLocating, setIsLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const locatingRequestRef = useRef(false);

  const sendLocationMutation = useMutation(locationsApi.send);

  const startLiveMutation = useMutation(locationsApi.startLive);

  const updateLiveMutation = useMutation(locationsApi.updateLive);

  const stopLiveMutation = useMutation(locationsApi.stopLive);

  const getGeolocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return null;
    }

    return navigator.geolocation;
  }, []);

  const getCurrentPosition = useCallback(() => {
    const geolocation = getGeolocation();

    if (!geolocation) {
      setError("La géolocalisation n'est pas disponible sur cet appareil.");

      return;
    }

    if (locatingRequestRef.current) {
      return;
    }

    locatingRequestRef.current = true;
    setIsLocating(true);
    setError(null);

    const options: LocationRequestOptions = {
      enableHighAccuracy,
      timeout: 15000,
      maximumAge: 10000,
    };

    geolocation.getCurrentPosition(
      (position) => {
        locatingRequestRef.current = false;

        const coordinates = normalizeCoordinates(position);

        setCurrentPosition(coordinates);
        setIsLocating(false);
      },
      (geoError) => {
        locatingRequestRef.current = false;
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
      options,
    );
  }, [enableHighAccuracy, getGeolocation]);

  /**
   * Récupère une position ponctuelle sous forme de Promise.
   *
   * Indispensable pour les opérations qui doivent
   * attendre une position fraîche avant de continuer
   * (notamment le démarrage d'une localisation Live).
   */
  const requestCurrentPosition = useCallback(async (): Promise<Coordinates> => {
    const geolocation = getGeolocation();

    if (!geolocation) {
      const message =
        "La géolocalisation n'est pas disponible sur cet appareil.";

      setError(message);
      throw new Error(message);
    }

    setIsLocating(true);
    setError(null);

    const position = await new Promise<GeolocationPosition>(
      (resolve, reject) => {
        geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy,
          timeout: 15000,
          maximumAge: 10000,
        });
      },
    ).catch((geoError: GeolocationPositionError) => {
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

      throw geoError;
    });

    const coordinates = normalizeCoordinates(position);

    setCurrentPosition(coordinates);
    setIsLocating(false);

    return coordinates;
  }, [enableHighAccuracy, getGeolocation]);

  const startWatching = useCallback(() => {
    const geolocation = getGeolocation();

    if (!geolocation) {
      setError("La géolocalisation n'est pas disponible.");

      return;
    }

    if (watchIdRef.current !== null) {
      return;
    }

    setError(null);
    setIsLocating(true);

    watchIdRef.current = geolocation.watchPosition(
      (position) => {
        const coordinates = normalizeCoordinates(position);

        setCurrentPosition(coordinates);
        setIsLocating(false);
      },
      (geoError) => {
        setIsLocating(false);

        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError("L'accès à votre position a été refusé.");
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          setError("Votre position est momentanément indisponible.");
        } else if (geoError.code === geoError.TIMEOUT) {
          setError("La récupération de votre position a expiré.");
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
  }, [enableHighAccuracy, getGeolocation]);

  const stopWatching = useCallback(() => {
    const geolocation = getGeolocation();

    if (watchIdRef.current !== null && geolocation) {
      geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;
    setIsLocating(false);
  }, [getGeolocation]);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }

    return () => {
      const geolocation = getGeolocation();

      if (watchIdRef.current !== null && geolocation) {
        geolocation.clearWatch(watchIdRef.current);
      }

      watchIdRef.current = null;
      locatingRequestRef.current = false;
    };
  }, [autoStart, startWatching, getGeolocation]);

  /**
   * Partage un emplacement fixe.
   */
  const sendLocation = useCallback(
    async ({
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
    },
    [sendLocationMutation],
  );

  /**
   * Démarre une localisation Live.
   *
   * Une position fraîche est obtenue avant la création
   * du message Live lorsque aucune position fiable
   * n'est encore disponible.
   */
  const startLiveLocation = useCallback(
    async ({
      conversationId,
      durationMinutes = 15,
      label,
    }: {
      conversationId: Id<"conversations">;
      durationMinutes?: number;
      label?: string;
    }) => {
      let position = currentPosition;

      if (!position) {
        position = await requestCurrentPosition();
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
    },
    [currentPosition, requestCurrentPosition, startWatching, startLiveMutation],
  );

  /**
   * Met à jour une localisation Live.
   */
  const updateLiveLocation = useCallback(
    async ({
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
    },
    [updateLiveMutation],
  );

  /**
   * Arrête une localisation Live.
   */
  const stopLiveLocation = useCallback(
    async ({ messageId }: { messageId: Id<"messages"> }) => {
      stopWatching();

      return stopLiveMutation({
        messageId,
      });
    },
    [stopWatching, stopLiveMutation],
  );

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
 * Hook pour suivre une localisation Live existante.
 */
export function useLiveLocation(messageId: Id<"messages"> | undefined) {
  const liveLocation = useQuery(
    locationsApi.getLive,
    messageId
      ? {
          messageId,
        }
      : "skip",
  );

  return liveLocation as LocationMessage | null | undefined;
}

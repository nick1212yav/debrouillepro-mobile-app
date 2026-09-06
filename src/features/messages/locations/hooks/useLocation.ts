// src/features/messages/locations/hooks/useLocation.ts

import { useCallback, useEffect, useRef, useState } from "react";

import { useMutation, useQuery } from "convex/react";

import type { Id } from "@/convex/_generated/dataModel";

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

const CURRENT_POSITION_OPTIONS: PositionOptions = {
  timeout: 15_000,
  maximumAge: 10_000,
};

const WATCH_POSITION_OPTIONS: PositionOptions = {
  timeout: 15_000,
  maximumAge: 5_000,
};

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "L'accès à votre position a été refusé.";

    case error.POSITION_UNAVAILABLE:
      return "Votre position est momentanément indisponible.";

    case error.TIMEOUT:
      return "La récupération de votre position a expiré.";

    default:
      return "Impossible de récupérer votre position.";
  }
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoStart = false, enableHighAccuracy = true } = options;

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null,
  );

  const [isLocating, setIsLocating] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const watchIdRef = useRef<number | null>(null);

  const mountedRef = useRef(true);

  const sendLocationMutation = useMutation(locationsApi.send);

  const startLiveMutation = useMutation(locationsApi.startLive);

  const updateLiveMutation = useMutation(locationsApi.updateLive);

  const stopLiveMutation = useMutation(locationsApi.stopLive);

  const isGeolocationSupported = useCallback((): boolean => {
    return (
      typeof navigator !== "undefined" &&
      typeof navigator.geolocation !== "undefined"
    );
  }, []);

  /**
   * Arrête proprement le suivi GPS en cours.
   */
  const stopWatching = useCallback(() => {
    if (
      watchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = null;

    if (mountedRef.current) {
      setIsLocating(false);
    }
  }, []);

  /**
   * Récupère la position actuelle sous forme de Promise.
   *
   * Cette fonction est utilisée notamment par startLiveLocation,
   * car setState est asynchrone et ne permet pas d'utiliser
   * immédiatement currentPosition après getCurrentPosition().
   */
  const getPosition = useCallback(async (): Promise<Coordinates> => {
    if (!isGeolocationSupported()) {
      const message =
        "La géolocalisation n'est pas disponible sur cet appareil.";

      if (mountedRef.current) {
        setError(message);
        setIsLocating(false);
      }

      throw new Error(message);
    }

    if (mountedRef.current) {
      setIsLocating(true);
      setError(null);
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            ...CURRENT_POSITION_OPTIONS,
            enableHighAccuracy,
          });
        },
      );

      const coordinates = normalizeCoordinates(position);

      if (mountedRef.current) {
        setCurrentPosition(coordinates);
        setError(null);
      }

      return coordinates;
    } catch (positionError) {
      const message =
        positionError &&
        typeof positionError === "object" &&
        "code" in positionError
          ? getGeolocationErrorMessage(
              positionError as GeolocationPositionError,
            )
          : "Impossible de récupérer votre position.";

      if (mountedRef.current) {
        setError(message);
      }

      throw new Error(message);
    } finally {
      if (mountedRef.current) {
        setIsLocating(false);
      }
    }
  }, [enableHighAccuracy, isGeolocationSupported]);

  /**
   * Récupère la position actuelle.
   */
  const getCurrentPosition = useCallback(() => {
    void getPosition().catch(() => {
      // L'erreur est déjà exposée dans le state `error`.
    });
  }, [getPosition]);

  /**
   * Démarre le suivi continu de la position.
   */
  const startWatching = useCallback(() => {
    if (!isGeolocationSupported()) {
      const message =
        "La géolocalisation n'est pas disponible sur cet appareil.";

      if (mountedRef.current) {
        setError(message);
      }

      return;
    }

    /*
     * Un seul watcher doit être actif à la fois.
     */
    if (watchIdRef.current !== null) {
      return;
    }

    if (mountedRef.current) {
      setError(null);
      setIsLocating(true);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coordinates = normalizeCoordinates(position);

        if (mountedRef.current) {
          setCurrentPosition(coordinates);
          setError(null);
          setIsLocating(false);
        }
      },
      (geoError) => {
        if (mountedRef.current) {
          setError(getGeolocationErrorMessage(geoError));
          setIsLocating(false);
        }
      },
      {
        ...WATCH_POSITION_OPTIONS,
        enableHighAccuracy,
      },
    );
  }, [enableHighAccuracy, isGeolocationSupported]);

  /**
   * Nettoyage du watcher lors du démontage.
   */
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopWatching();
    };
  }, [stopWatching]);

  /**
   * Démarrage automatique optionnel.
   */
  useEffect(() => {
    if (!autoStart) {
      return;
    }

    startWatching();
  }, [autoStart, startWatching]);

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
   * La position est récupérée et attendue avant la création
   * du message Live.
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
      const position = currentPosition ?? (await getPosition());

      startWatching();

      try {
        return await startLiveMutation({
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
      } catch (mutationError) {
        /*
         * Si la création du partage Live échoue et qu'aucun autre
         * partage n'utilise le watcher, on évite de laisser le GPS
         * tourner inutilement.
         */
        stopWatching();

        throw mutationError;
      }
    },
    [
      currentPosition,
      getPosition,
      startLiveMutation,
      startWatching,
      stopWatching,
    ],
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
      try {
        return await stopLiveMutation({
          messageId,
        });
      } finally {
        stopWatching();
      }
    },
    [stopLiveMutation, stopWatching],
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
 * Hook permettant de suivre une localisation Live existante.
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

export default useLocation;

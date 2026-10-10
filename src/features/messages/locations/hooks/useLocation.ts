// src/features/messages/locations/hooks/useLocation.ts

import * as Location from "expo-location";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Id } from "../../../../../convex/_generated/dataModel";

import {
  locationsApi,
  type Coordinates,
  type LocationMessage,
} from "../services/locations.service";

export interface UseLocationOptions {
  autoStart?: boolean;
  enableHighAccuracy?: boolean;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_AGE_MS = 10000;
const WATCH_TIME_INTERVAL_MS = 5000;

/**
 * Convertit un `Location.LocationObject` d'expo-location
 * vers le type `Coordinates` métier.
 */
function toCoordinates(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracy:
      typeof location.coords.accuracy === "number"
        ? location.coords.accuracy
        : undefined,
    altitude:
      typeof location.coords.altitude === "number"
        ? location.coords.altitude
        : undefined,
    heading:
      typeof location.coords.heading === "number"
        ? location.coords.heading
        : undefined,
    speed:
      typeof location.coords.speed === "number"
        ? location.coords.speed
        : undefined,
  };
}

/**
 * Traduit les erreurs expo-location en messages utilisateur.
 */
function describeLocationError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (/permission/i.test(message)) {
    return "L'accès à votre position a été refusé.";
  }

  if (/timeout|timed out/i.test(message)) {
    return "La récupération de votre position a expiré.";
  }

  if (/unavailable|not available/i.test(message)) {
    return "Votre position est momentanément indisponible.";
  }

  return "Impossible de récupérer votre position.";
}

export function useLocation(options: UseLocationOptions = {}) {
  const { autoStart = false, enableHighAccuracy = true } = options;

  const [currentPosition, setCurrentPosition] = useState<Coordinates | null>(
    null,
  );

  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(
    null,
  );

  const locatingRequestRef = useRef(false);

  const sendLocationMutation = useMutation(locationsApi.send);
  const startLiveMutation = useMutation(locationsApi.startLive);
  const updateLiveMutation = useMutation(locationsApi.updateLive);
  const stopLiveMutation = useMutation(locationsApi.stopLive);

  const accuracyValue = enableHighAccuracy
    ? Location.Accuracy.High
    : Location.Accuracy.Balanced;

  /**
   * Vérifie que le service de localisation est actif au niveau OS.
   * Renvoie true si on peut continuer.
   */
  const ensureServicesEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();

      if (!enabled) {
        setError(
          "Le service de localisation est désactivé. Activez-le dans les paramètres de votre appareil.",
        );

        return false;
      }

      return true;
    } catch {
      return true;
    }
  }, []);

  /**
   * Demande la permission foreground (idempotent).
   * Renvoie true si accordée.
   */
  const ensureForegroundPermission = useCallback(async (): Promise<boolean> => {
    try {
      const existing = await Location.getForegroundPermissionsAsync();

      if (existing.status === "granted") {
        return true;
      }

      const requested = await Location.requestForegroundPermissionsAsync();

      if (requested.status !== "granted") {
        setError("L'accès à votre position a été refusé.");
        return false;
      }

      return true;
    } catch {
      setError("Impossible de vérifier l'autorisation de localisation.");
      return false;
    }
  }, []);

  /**
   * Position ponctuelle — API callback compatible avec l'ancien contrat.
   */
  const getCurrentPosition = useCallback(async () => {
    if (locatingRequestRef.current) {
      return;
    }

    locatingRequestRef.current = true;
    setIsLocating(true);
    setError(null);

    try {
      const servicesOk = await ensureServicesEnabled();

      if (!servicesOk) {
        return;
      }

      const permissionOk = await ensureForegroundPermission();

      if (!permissionOk) {
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: accuracyValue,
        mayShowUserSettingsDialog: true,
      });

      setCurrentPosition(toCoordinates(position));
    } catch (locationError) {
      setError(describeLocationError(locationError));
    } finally {
      locatingRequestRef.current = false;
      setIsLocating(false);
    }
  }, [accuracyValue, ensureForegroundPermission, ensureServicesEnabled]);

  /**
   * Récupère une position ponctuelle sous forme de Promise.
   *
   * Utilisé en interne par le mode Live.
   */
  const requestCurrentPosition = useCallback(async (): Promise<Coordinates> => {
    const servicesOk = await ensureServicesEnabled();

    if (!servicesOk) {
      throw new Error("Location services disabled");
    }

    const permissionOk = await ensureForegroundPermission();

    if (!permissionOk) {
      throw new Error("Location permission denied");
    }

    setIsLocating(true);
    setError(null);

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: accuracyValue,
        mayShowUserSettingsDialog: true,
      });

      const coordinates = toCoordinates(position);

      setCurrentPosition(coordinates);

      return coordinates;
    } catch (locationError) {
      const message = describeLocationError(locationError);

      setError(message);
      throw new Error(message);
    } finally {
      setIsLocating(false);
    }
  }, [accuracyValue, ensureForegroundPermission, ensureServicesEnabled]);

  /**
   * Démarre un suivi continu de la position.
   */
  const startWatching = useCallback(async () => {
    if (watchSubscriptionRef.current) {
      return;
    }

    setError(null);
    setIsLocating(true);

    try {
      const servicesOk = await ensureServicesEnabled();

      if (!servicesOk) {
        setIsLocating(false);
        return;
      }

      const permissionOk = await ensureForegroundPermission();

      if (!permissionOk) {
        setIsLocating(false);
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: accuracyValue,
          timeInterval: WATCH_TIME_INTERVAL_MS,
          distanceInterval: 0,
        },
        (location) => {
          setCurrentPosition(toCoordinates(location));
          setIsLocating(false);
        },
      );

      watchSubscriptionRef.current = subscription;
    } catch (locationError) {
      setError(describeLocationError(locationError));
      setIsLocating(false);
    }
  }, [accuracyValue, ensureForegroundPermission, ensureServicesEnabled]);

  const stopWatching = useCallback(() => {
    const subscription = watchSubscriptionRef.current;

    watchSubscriptionRef.current = null;

    if (subscription) {
      try {
        subscription.remove();
      } catch {
        /* Best effort. */
      }
    }

    setIsLocating(false);
  }, []);

  useEffect(() => {
    if (autoStart) {
      void startWatching();
    }

    return () => {
      const subscription = watchSubscriptionRef.current;

      watchSubscriptionRef.current = null;

      if (subscription) {
        try {
          subscription.remove();
        } catch {
          /* Best effort. */
        }
      }

      locatingRequestRef.current = false;
    };
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

      void startWatching();

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

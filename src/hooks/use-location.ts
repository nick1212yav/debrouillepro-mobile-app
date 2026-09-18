// src/hooks/use-location.ts

import { useEffect, useState } from "react";
import * as Location from "expo-location";

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type LocationStatus =
  | "idle"
  | "loading"
  | "granted"
  | "denied"
  | "unavailable"
  | "error";

export type UseLocationResult = {
  coords: LocationCoords | null;
  status: LocationStatus;
  error: string | null;
};

/**
 * Source unique de vérité pour la position réelle de l'utilisateur.
 *
 * Règles :
 * - aucune coordonnée par défaut ;
 * - aucune coordonnée hardcodée ;
 * - aucune coordonnée de ville utilisée comme fallback ;
 * - permission refusée → coords = null ;
 * - service de localisation désactivé → coords = null ;
 * - coordonnées invalides → coords = null ;
 * - aucune API Web de géolocalisation ;
 * - aucune surveillance continue : une seule résolution au montage.
 *
 * Consommateurs :
 * - HomePage → affiche HomeNearby uniquement lorsque coords !== null.
 */
export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<LocationCoords | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolvePosition = async (): Promise<void> => {
      if (cancelled) {
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();

        if (cancelled) {
          return;
        }

        if (!servicesEnabled) {
          setCoords(null);
          setStatus("unavailable");
          return;
        }

        const permission = await Location.requestForegroundPermissionsAsync();

        if (cancelled) {
          return;
        }

        if (permission.status !== Location.PermissionStatus.GRANTED) {
          setCoords(null);
          setStatus("denied");
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (cancelled) {
          return;
        }

        const { latitude, longitude } = position.coords;

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          setCoords(null);
          setStatus("unavailable");
          return;
        }

        setCoords({
          latitude,
          longitude,
        });

        setStatus("granted");
      } catch (err: unknown) {
        if (cancelled) {
          return;
        }

        setCoords(null);
        setStatus("error");
        setError(err instanceof Error ? err.message : "Location unavailable");
      }
    };

    void resolvePosition();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    coords,
    status,
    error,
  };
}

// convex/explorer/nearby.ts

/**
 * ============================================================
 * DÉBROUILLEPRO — EXPLORER V2
 * NEARBY ENGINE
 * ============================================================
 *
 * Moteur "À proximité".
 *
 * Responsabilités :
 * - calculer les distances GPS
 * - filtrer par rayon
 * - utiliser la ville comme fallback
 * - classer les résultats par proximité
 * - conserver le score Explorer
 *
 * Ce fichier ne connaît pas les tables Convex.
 * Il travaille sur des objets déjà transformés en cartes Explorer.
 * ============================================================
 */

export type NearbyCoordinates = {
  latitude: number;
  longitude: number;
};

export type NearbyItem = {
  id: string;

  latitude?: number;
  longitude?: number;

  city?: string;
  location?: string;
  address?: string;
  neighborhood?: string;

  distanceKm?: number;

  score?: number;

  metadata?: Record<string, unknown>;
};

export type NearbyOptions = {
  latitude?: number;
  longitude?: number;

  city?: string;

  radiusKm?: number;

  limit?: number;
};

export type NearbyResult<T> = T & {
  distanceKm?: number;
  nearbyMatch: "gps" | "city";
};

/**
 * Rayon par défaut.
 */
export const DEFAULT_NEARBY_RADIUS_KM = 25;

/**
 * Rayon maximal autorisé.
 *
 * On évite qu'un appel frontend demande accidentellement
 * plusieurs centaines de kilomètres.
 */
export const MAX_NEARBY_RADIUS_KM = 100;

/**
 * Limite par défaut.
 */
export const DEFAULT_NEARBY_LIMIT = 20;

/**
 * Normalisation texte.
 */
function normalize(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * Conversion sûre en nombre.
 */
function numberOrUndefined(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

/**
 * Vérifie que deux coordonnées GPS sont exploitables.
 *
 * Le type guard porte volontairement sur l'objet complet :
 * TypeScript sait ainsi que latitude ET longitude sont des
 * nombres après le test.
 */
export function hasCoordinates(coordinates: {
  latitude?: number;
  longitude?: number;
}): coordinates is NearbyCoordinates {
  return (
    coordinates.latitude !== undefined &&
    coordinates.longitude !== undefined &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude)
  );
}

/**
 * ------------------------------------------------------------
 * HAVERSINE
 * ------------------------------------------------------------
 *
 * Retourne la distance entre deux coordonnées GPS en kilomètres.
 */
export function distanceKm(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
): number {
  const toRadians = (value: number): number => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(latitude2 - latitude1);

  const deltaLongitude = toRadians(longitude2 - longitude1);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(latitude1)) *
      Math.cos(toRadians(latitude2)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * ------------------------------------------------------------
 * CITY MATCH
 * ------------------------------------------------------------
 *
 * Fallback lorsque GPS n'est pas disponible.
 */
export function matchesCity(item: NearbyItem, city?: string): boolean {
  const target = normalize(city);

  if (!target) {
    return false;
  }

  const values = [item.city, item.location, item.address, item.neighborhood]
    .map(normalize)
    .filter(Boolean);

  return values.some(
    (value) => value.includes(target) || target.includes(value),
  );
}

/**
 * ------------------------------------------------------------
 * NORMALISATION DU RAYON
 * ------------------------------------------------------------
 */
export function normalizeRadius(radiusKm?: number): number {
  if (radiusKm === undefined || !Number.isFinite(radiusKm)) {
    return DEFAULT_NEARBY_RADIUS_KM;
  }

  return Math.max(1, Math.min(radiusKm, MAX_NEARBY_RADIUS_KM));
}

/**
 * ------------------------------------------------------------
 * NORMALISATION DE LA LIMITE
 * ------------------------------------------------------------
 */
export function normalizeLimit(limit?: number): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_NEARBY_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), 100));
}

/**
 * ------------------------------------------------------------
 * ENRICHISSEMENT D'UN ITEM
 * ------------------------------------------------------------
 *
 * Retourne :
 *
 * - distance GPS si les coordonnées existent
 * - match ville si GPS impossible
 * - null si l'élément n'est pas réellement proche
 */
export function enrichNearbyItem<T extends NearbyItem>(
  item: T,
  options: NearbyOptions,
): NearbyResult<T> | null {
  const radiusKm = normalizeRadius(options.radiusKm);

  const userLatitude = numberOrUndefined(options.latitude);

  const userLongitude = numberOrUndefined(options.longitude);

  const itemLatitude = numberOrUndefined(item.latitude);

  const itemLongitude = numberOrUndefined(item.longitude);

  const userCoordinates = {
    latitude: userLatitude,
    longitude: userLongitude,
  };

  const itemCoordinates = {
    latitude: itemLatitude,
    longitude: itemLongitude,
  };

  /**
   * ----------------------------------------------------------
   * PRIORITÉ 1 : GPS
   * ----------------------------------------------------------
   */
  if (hasCoordinates(userCoordinates) && hasCoordinates(itemCoordinates)) {
    const distance = distanceKm(
      userCoordinates.latitude,
      userCoordinates.longitude,
      itemCoordinates.latitude,
      itemCoordinates.longitude,
    );

    if (distance > radiusKm) {
      return null;
    }

    return {
      ...item,
      distanceKm: Number(distance.toFixed(1)),
      nearbyMatch: "gps",
    };
  }

  /**
   * ----------------------------------------------------------
   * PRIORITÉ 2 : VILLE
   * ----------------------------------------------------------
   *
   * Si l'utilisateur n'a pas de coordonnées,
   * ou si l'élément n'en possède pas,
   * on utilise la ville.
   */
  if (matchesCity(item, options.city)) {
    return {
      ...item,
      distanceKm: undefined,
      nearbyMatch: "city",
    };
  }

  /**
   * Pas suffisamment d'information
   * pour considérer l'élément comme proche.
   */
  return null;
}

/**
 * ------------------------------------------------------------
 * FILTRE "À PROXIMITÉ"
 * ------------------------------------------------------------
 */
export function filterNearby<T extends NearbyItem>(
  items: T[],
  options: NearbyOptions,
): NearbyResult<T>[] {
  return items
    .map((item) => enrichNearbyItem(item, options))
    .filter((item): item is NearbyResult<T> => item !== null);
}

/**
 * ------------------------------------------------------------
 * TRI
 * ------------------------------------------------------------
 *
 * GPS :
 *   distance → score
 *
 * Ville :
 *   score
 */
export function sortNearby<T extends NearbyItem>(
  items: NearbyResult<T>[],
): NearbyResult<T>[] {
  return [...items].sort((a, b) => {
    /**
     * Si les deux ont une distance GPS,
     * la distance est prioritaire.
     */
    if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
      return a.distanceKm - b.distanceKm || (b.score ?? 0) - (a.score ?? 0);
    }

    /**
     * Les résultats GPS passent
     * avant les simples correspondances ville.
     */
    if (a.nearbyMatch !== b.nearbyMatch) {
      return a.nearbyMatch === "gps" ? -1 : 1;
    }

    /**
     * Pour les correspondances ville,
     * le score Explorer devient prioritaire.
     */
    return (b.score ?? 0) - (a.score ?? 0);
  });
}

/**
 * ------------------------------------------------------------
 * PIPELINE COMPLET
 * ------------------------------------------------------------
 */
export function getNearbyItems<T extends NearbyItem>(
  items: T[],
  options: NearbyOptions,
): NearbyResult<T>[] {
  const limit = normalizeLimit(options.limit);

  return sortNearby(filterNearby(items, options)).slice(0, limit);
}

/**
 * ------------------------------------------------------------
 * DISTANCE FORMATTER
 * ------------------------------------------------------------
 *
 * Utilisable directement côté backend/frontend
 * pour afficher une distance lisible.
 */
export function formatDistance(distance?: number): string | undefined {
  if (distance === undefined || !Number.isFinite(distance)) {
    return undefined;
  }

  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }

  if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  }

  return `${Math.round(distance)} km`;
}

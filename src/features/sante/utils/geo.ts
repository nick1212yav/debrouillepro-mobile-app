// src/features/sante/utils/geo.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calcule la distance entre deux points en kilomètres (formule de Haversine)
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convertit des degrés en radians
 */
function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Vérifie si une coordonnée est dans un rayon donné (en km)
 */
export function isWithinRadius(
  center: Coordinates,
  point: Coordinates,
  radiusKm: number,
): boolean {
  return (
    calculateDistance(center.lat, center.lng, point.lat, point.lng) <= radiusKm
  );
}

/**
 * Trie des lieux par distance par rapport à une position
 */
export function sortByDistance<T extends { lat: number; lng: number }>(
  items: T[],
  origin: Coordinates,
): T[] {
  return items.sort((a, b) => {
    const distA = calculateDistance(origin.lat, origin.lng, a.lat, a.lng);
    const distB = calculateDistance(origin.lat, origin.lng, b.lat, b.lng);
    return distA - distB;
  });
}

/**
 * Récupère la position de l'utilisateur via l'API Geolocation
 */
export function getCurrentPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!undefined) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    undefined.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => reject(error),
    );
  });
}

/**
 * Génère un lien Google Maps pour une coordonnée
 */
export function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Génère un lien Waze pour une coordonnée
 */
export function getWazeLink(lat: number, lng: number): string {
  return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}

/**
 * Convertit une adresse en coordonnées via Nominatim (OpenStreetMap)
 */
export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Geocoding failed");
    const data = await response.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

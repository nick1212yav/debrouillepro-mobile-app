export interface GeoCoordinates {
  lat: number;
  lng: number;
}

export class DistanceUtils {
  /**
   * Calcule la distance de Haversine (en kilomètres) entre deux points GPS
   */
  public static haversine(
    coord1: GeoCoordinates,
    coord2: GeoCoordinates,
  ): number {
    const R = 6371; // Rayon de la Terre en kilomètres
    const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.lat * Math.PI) / 180) *
        Math.cos((coord2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Convertit une distance en mètres ou kilomètres selon sa valeur pour un affichage lisible
   */
  public static formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  /**
   * Estime un coût de livraison proportionnel à la distance (Tarification kilométrique)
   */
  public static estimateDeliveryFee(
    km: number,
    baseFee: number = 1000,
    perKmFee: number = 250,
  ): number {
    const rawFee = baseFee + km * perKmFee;
    // Arrondi au 50 FCFA supérieur pour correspondre à la monnaie locale
    return Math.ceil(rawFee / 50) * 50;
  }
}

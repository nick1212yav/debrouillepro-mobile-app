// src/features/transport/utils/formatter.ts
import { getCategoryLabel } from "../constants/categories";
import type { VehicleType } from "../types";

export class MobilityFormatter {
  /**
   * Formater une plaque d'immatriculation au standard espacé et lisible (ex: 1234AB01 -> "1234 AB 01")
   */
  static formatLicensePlate(plate: string): string {
    const clean = plate.replace(/\s+/g, "").toUpperCase();
    if (clean.length < 5) return clean;

    // Essayer de découper : 4 chiffres + 2 lettres + 2 chiffres
    const numbers = clean.substring(0, 4);
    const letters = clean.substring(4, 6);
    const region = clean.substring(6);

    if (region) {
      return `${numbers} ${letters} ${region}`;
    }
    return `${numbers} ${letters}`;
  }

  /**
   * Traduire et formater la description de prise en charge d'un véhicule [2]
   */
  static formatVehicleSummary(
    type: VehicleType,
    model?: string,
    capacity?: number,
  ): string {
    const label = getCategoryLabel(type);
    const finalModel = model ? ` (${model})` : "";
    const finalCapacity = capacity ? ` • ${capacity} places` : "";

    return `${label}${finalModel}${finalCapacity} [2]`;
  }

  /**
   * Formater les distances pour l'affichage passager (ex: 4500 -> "4.5 km", 300 -> "300 m")
   */
  static formatDistance(distanceKm: number): string {
    if (distanceKm < 1) {
      const meters = Math.round(distanceKm * 1000);
      return `${meters} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }
}

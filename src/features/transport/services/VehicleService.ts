// src/features/transport/services/VehicleService.ts
import { MobilityValidator } from "../utils/validation";

export class VehicleService {
  /**
   * Valider la conformité d'un véhicule de la flotte [1]
   */
  static registerVehicle(
    model: string,
    plate: string,
    capacity: number,
  ): {
    success: boolean;
    errorReason?: string;
  } {
    if (model.trim().length < 3) {
      return {
        success: false,
        errorReason: "Veuillez spécifier la marque et le modèle exacts [2].",
      };
    }

    if (!MobilityValidator.isValidLicensePlate(plate)) {
      return {
        success: false,
        errorReason:
          "La plaque d'immatriculation ne respecte pas le format réglementaire [2].",
      };
    }

    if (capacity <= 0 || capacity > 80) {
      return {
        success: false,
        errorReason: "La capacité de places assises est incohérente [2].",
      };
    }

    return { success: true };
  }
}

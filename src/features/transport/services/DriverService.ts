// src/features/transport/services/DriverService.ts
import { DriverPolicy } from "../policies/driver.policy";

export class DriverService {
  /**
   * Enregistrer et valider une demande d'habilitation de chauffeur [1]
   */
  static verifyDriverLicense(
    licenseNumber: string,
    licenseType: "A" | "B" | "C" | "D" | "E",
    expirationDate: string,
  ): {
    isValid: boolean;
    errorReason?: string;
  } {
    const today = new Date();
    const expDate = new Date(expirationDate);

    if (expDate <= today) {
      return {
        isValid: false,
        errorReason: "Le permis de conduire est expiré [2].",
      };
    }

    if (licenseNumber.replace(/\s+/g, "").length < 5) {
      return {
        isValid: false,
        errorReason: "Numéro de permis invalide ou incomplet [2].",
      };
    }

    return { isValid: true };
  }
}

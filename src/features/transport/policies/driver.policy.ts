// src/features/transport/policies/driver.policy.ts
import type { VehicleType } from "../types";

export interface DriverEligibilityReport {
  isEligible: boolean;
  reason?: string;
  requiredLicenseType?: string;
}

export class DriverPolicy {
  // Liste des permis requis selon le type de véhicule en vigueur en Afrique centrale/de l'Ouest
  private static LICENSE_REQUIREMENTS: Record<VehicleType, string> = {
    moto: "Permis A (Deux-roues)",
    taxi: "Permis B (Léger)",
    voiture: "Permis B (Léger)",
    minibus: "Permis C1 (Minibus/Transport collectif)",
    bus: "Permis C (Poids lourd / Transport en commun)",
    camion: "Permis E (Fret et remorques lourdes)",
    livraison: "Permis B (Léger)",
  };

  /**
   * Évaluer si un conducteur est éligible pour accepter une course [2]
   */
  static evaluateDriverEligibility(
    licenseType: string,
    vehicleType: VehicleType,
    rating: number,
    isBackgroundChecked: boolean,
    totalTrips: number,
  ): DriverEligibilityReport {
    // 1. Vérification de l'enquête de sécurité DébrouillePro (Background Check) [2]
    if (!isBackgroundChecked) {
      return {
        isEligible: false,
        reason:
          "La vérification d'identité et des antécédents judiciaires est incomplète [2].",
      };
    }

    // 2. Vérification de la notation minimale requise (Seuil de sécurité à 4.2)
    const MINIMUM_RATING = 4.2;
    if (totalTrips >= 5 && rating < MINIMUM_RATING) {
      return {
        isEligible: false,
        reason: `La note moyenne de service (${rating}) est passée sous le seuil de sécurité autorisé de ${MINIMUM_RATING} [2].`,
      };
    }

    // 3. Correspondance du type de permis de conduire
    const requiredLicense = this.LICENSE_REQUIREMENTS[vehicleType];
    const cleanUserLicense = licenseType.trim().toLowerCase();
    const cleanRequiredLicense = requiredLicense.toLowerCase();

    // Vérification simplifiée de l'adéquation du permis
    if (
      !cleanUserLicense.includes(
        cleanRequiredLicense.split(" ")[1].toLowerCase(),
      )
    ) {
      return {
        isEligible: false,
        reason: `Type de permis inadéquat. Le permis requis pour ce véhicule est : ${requiredLicense} [2].`,
        requiredLicenseType: requiredLicense,
      };
    }

    return {
      isEligible: true,
      requiredLicenseType: requiredLicense,
    };
  }
}

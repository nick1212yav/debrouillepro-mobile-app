// src/features/transport/utils/validation.ts

export class MobilityValidator {
  /**
   * Valider si une plaque d'immatriculation africaine respecte la nomenclature standard
   * (ex : 1234AB01 ou d'autres formats à 7 ou 8 caractères)
   */
  static isValidLicensePlate(plate: string): boolean {
    const clean = plate.replace(/\s+/g, "").toUpperCase();
    if (clean.length < 5 || clean.length > 10) return false;

    // Expression régulière standard de plaque minéralogique (chiffres et lettres)
    const plateRegex = /^[A-Z0-9-]{5,10}$/;
    return plateRegex.test(clean);
  }

  /**
   * Valider un numéro de téléphone international
   */
  static isValidPhone(phone: string): boolean {
    const clean = phone.replace(/\s+/g, "");
    return clean.startsWith("+") && clean.length >= 10 && clean.length <= 15;
  }
}

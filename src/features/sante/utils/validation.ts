// src/features/sante/utils/validation.ts

/**
 * Vérifie si un email est valide
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Vérifie si un numéro de téléphone est valide (format international)
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return /^\+?[0-9]{8,15}$/.test(cleaned);
}

/**
 * Vérifie si une date est valide
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Vérifie si une chaîne est non vide
 */
export function isNotEmpty(str: string): boolean {
  return str.trim().length > 0;
}

/**
 * Vérifie si un montant est valide (> 0)
 */
export function isValidAmount(amount: number): boolean {
  return amount > 0 && isFinite(amount);
}

/**
 * Vérifie si une note (rating) est valide (1-5)
 */
export function isValidRating(rating: number): boolean {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

/**
 * Vérifie si un créneau horaire est valide (HH:MM)
 */
export function isValidTimeSlot(slot: string): boolean {
  const re = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
  return re.test(slot);
}

/**
 * Vérifie si une durée en minutes est valide
 */
export function isValidDuration(minutes: number): boolean {
  return minutes > 0 && Number.isInteger(minutes);
}

/**
 * Valide un code postal (format numérique)
 */
export function isValidPostalCode(code: string): boolean {
  return /^[0-9]{5}$/.test(code);
}

/**
 * Valide un IBAN (simplifié)
 */
export function isValidIBAN(iban: string): boolean {
  // Supprime les espaces
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  // Longueur minimale 15, maximale 34
  if (cleaned.length < 15 || cleaned.length > 34) return false;
  // Doit commencer par deux lettres
  return /^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned);
}

/**
 * Valide un numéro de sécurité sociale (exemple français)
 */
export function isValidFrenchSocialSecurityNumber(ssn: string): boolean {
  const cleaned = ssn.replace(/\s/g, "");
  return /^[1-9][0-9]{12}$/.test(cleaned);
}

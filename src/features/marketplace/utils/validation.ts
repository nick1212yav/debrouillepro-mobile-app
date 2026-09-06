// src/features/marketplace/utils/validation.ts

/**
 * Valide un prix
 * @param price - Prix à valider
 * @returns true si valide
 */
export function isValidPriceInput(price: any): boolean {
  if (typeof price === "string") {
    const num = parseFloat(price);
    return !isNaN(num) && num > 0;
  }
  return typeof price === "number" && price > 0 && isFinite(price);
}

/**
 * Valide un titre (non vide, longueur mini)
 * @param title - Titre à valider
 * @param minLength - Longueur minimale
 * @returns true si valide
 */
export function isValidTitle(title: string, minLength: number = 3): boolean {
  return typeof title === "string" && title.trim().length >= minLength;
}

/**
 * Valide une description (non vide, longueur mini)
 * @param description - Description à valider
 * @param minLength - Longueur minimale
 * @returns true si valide
 */
export function isValidDescription(
  description: string,
  minLength: number = 10,
): boolean {
  return (
    typeof description === "string" && description.trim().length >= minLength
  );
}

/**
 * Valide une quantité (entier positif)
 * @param quantity - Quantité à valider
 * @returns true si valide
 */
export function isValidQuantity(quantity: any): boolean {
  const num = typeof quantity === "string" ? parseInt(quantity) : quantity;
  return Number.isInteger(num) && num > 0;
}

/**
 * Valide une catégorie
 * @param category - Catégorie à valider
 * @param allowedCategories - Liste des catégories autorisées
 * @returns true si valide
 */
export function isValidCategory(
  category: string,
  allowedCategories: string[] = [],
): boolean {
  if (!category || category.trim() === "") return false;
  if (allowedCategories.length === 0) return true;
  return allowedCategories.includes(category);
}

/**
 * Valide une URL d'image
 * @param url - URL à valider
 * @returns true si valide
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:image")
  );
}

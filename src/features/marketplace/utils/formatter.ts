// src/features/marketplace/utils/formatter.ts

/**
 * Formate un prix avec la devise
 * @param price - Nombre ou string convertible
 * @param currency - Code devise (ex: "FCFA", "USD")
 * @param locale - Locale pour le formatage (défaut: "fr-FR")
 * @returns Chaîne formatée (ex: "15 000 FCFA")
 */
export function formatPrice(
  price: number | string,
  currency: string = "FCFA",
  locale: string = "fr-FR",
): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  if (isNaN(num)) return `0 ${currency}`;
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(num);
  return `${formatted} ${currency}`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 * @param value - Nombre à formater
 * @param locale - Locale (défaut: "fr-FR")
 * @returns Chaîne formatée
 */
export function formatNumber(value: number, locale: string = "fr-FR"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Abrège un grand nombre (ex: 1500 → 1.5k)
 * @param value - Nombre à abréger
 * @param locale - Locale
 * @returns Chaîne abrégée
 */
export function formatCompactNumber(
  value: number,
  locale: string = "fr-FR",
): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return formatNumber(value, locale);
}

/**
 * Formate une date en format lisible
 * @param timestamp - Timestamp en millisecondes ou chaîne ISO
 * @param locale - Locale (défaut: "fr-FR")
 * @returns Chaîne formatée (ex: "12 mai 2025")
 */
export function formatDate(
  timestamp: number | string,
  locale: string = "fr-FR",
): string {
  const date =
    typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
  if (isNaN(date.getTime())) return "Date invalide";
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une durée en heures/minutes
 * @param minutes - Durée en minutes
 * @returns Chaîne formatée (ex: "2h 30min")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

/**
 * Formate une note en étoiles
 * @param rating - Note (0-5)
 * @param maxStars - Nombre max d'étoiles
 * @returns Chaîne d'étoiles (ex: "★★★★☆")
 */
export function formatStars(rating: number, maxStars: number = 5): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  const empty = maxStars - full - half;
  return "★".repeat(full) + "½".repeat(half) + "☆".repeat(empty);
}

// src/features/sante/utils/formatter.ts

/**
 * Formate un montant en devise locale
 */
export function formatCurrency(
  amount: number,
  currency: string = "FCFA",
  locale: string = "fr-FR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formate une date en chaîne lisible
 */
export function formatDate(
  date: Date | string,
  locale: string = "fr-FR",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formate une date courte (JJ/MM/AAAA)
 */
export function formatDateShort(
  date: Date | string,
  locale: string = "fr-FR",
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale);
}

/**
 * Formate une heure (HH:MM)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formate une durée en minutes en texte lisible
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}

/**
 * Formate un nombre avec séparateur de milliers
 */
export function formatNumber(num: number, locale: string = "fr-FR"): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Formate une distance en km ou m
 */
export function formatDistance(
  meters: number,
  locale: string = "fr-FR",
): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Formate un pourcentage
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhoneNumber(phone: string): string {
  // Supprime les espaces et caractères non numériques
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return cleaned.replace(
      /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5",
    );
  }
  if (cleaned.length === 12) {
    return cleaned.replace(
      /(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/,
      "$1 $2 $3 $4 $5",
    );
  }
  return phone;
}

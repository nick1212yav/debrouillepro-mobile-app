import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatte un prix selon la devise et la locale
 * @param amount - Montant (nombre, undefined ou null)
 * @param currency - Code devise (ex: "USD", "EUR", "CDF")
 * @param locale - Locale pour le formatage (ex: "fr-FR", "en-US")
 * @returns Chaîne formatée du prix ou "Prix sur demande" si amount est null/undefined
 */
export function formatPrice(
  amount: number | undefined | null,
  currency: string = "USD",
  locale: string = "fr-FR",
): string {
  if (amount == null) return "Prix sur demande";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback si la devise ou la locale n'est pas supportée
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

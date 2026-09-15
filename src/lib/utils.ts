// src/lib/utils.ts

/**
 * `cn` — concatène des classes CSS (utilisé avec NativeWind).
 *
 * ⚠️ V8.4 : remplace `clsx` + `tailwind-merge` (web-only) par un simple
 *           join de chaînes. NativeWind n'a pas besoin de "merge" les
 *           conflits de classes : la dernière l'emporte côté CSS.
 *
 * Exemple :
 *   cn("px-4", isActive && "bg-blue-500", undefined)
 *   → "px-4 bg-blue-500"
 */
export function cn(
  ...inputs: Array<string | false | null | undefined>
): string {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Formatte un prix selon la devise et la locale.
 *
 * ⚠️ V8.4 : `Intl.NumberFormat` avec `style: "currency"` n'est pas
 *           pleinement supporté sur Hermes Android. On tente quand même
 *           et on retombe sur un formatage manuel en cas d'échec.
 *
 * @param amount   - Montant (nombre, undefined ou null)
 * @param currency - Code devise (ex: "USD", "EUR", "CDF")
 * @param locale   - Locale (ex: "fr-FR", "en-US")
 * @returns Chaîne formatée ou "Prix sur demande" si amount est null/undefined
 */
export function formatPrice(
  amount: number | undefined | null,
  currency: string = "USD",
  locale: string = "fr-FR",
): string {
  if (amount == null) return "Prix sur demande";

  // Tentative avec Intl (peut échouer sur Hermes Android ancien)
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback : formatage manuel
    return formatPriceFallback(amount, currency, locale);
  }
}

// ── Fallback interne ────────────────────────────────────────────────────
function formatPriceFallback(
  amount: number,
  currency: string,
  locale: string,
): string {
  // Symboles les plus courants (extensible)
  const SYMBOLS: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    CDF: "FC",
    XAF: "FCFA",
    XOF: "FCFA",
    MAD: "DH",
    DZD: "DA",
    TND: "DT",
    CAD: "C$",
    JPY: "¥",
    CNY: "¥",
    NGN: "₦",
    ZAR: "R",
  };

  const symbol = SYMBOLS[currency.toUpperCase()] ?? currency.toUpperCase();
  const formattedNumber = formatNumber(amount, locale);

  // Position du symbole selon la locale (avant pour en-US, après pour fr-FR)
  const isBeforeSymbol =
    locale.startsWith("en-US") ||
    locale.startsWith("en-GB") ||
    locale.startsWith("ja") ||
    locale.startsWith("zh");

  return isBeforeSymbol
    ? `${symbol}${formattedNumber}`
    : `${formattedNumber} ${symbol}`;
}

// ── Formatage de nombre (séparateurs de milliers) ───────────────────────
function formatNumber(amount: number, locale: string): string {
  // Essaie Intl.NumberFormat (décimal)
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback minimal : ajoute un séparateur tous les 3 chiffres
    const isFrench = locale.startsWith("fr");
    const [integerPart, decimalPart] = amount.toFixed(0).split(".");
    const separator = isFrench ? " " : ",";
    const withSeparators = integerPart.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      separator,
    );
    return decimalPart ? `${withSeparators}.${decimalPart}` : withSeparators;
  }
}

export default { cn, formatPrice };

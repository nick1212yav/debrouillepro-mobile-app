// src/features/marketplace/utils/currency.ts
import {
  DEFAULT_CURRENCY,
  CURRENCIES,
  type CurrencyCode,
} from "../constants/currencies";

/**
 * Formate un prix avec la devise
 */
export function formatPrice(
  price: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const symbol =
    CURRENCIES.find((c) => c.code === currency)?.symbol || currency;
  return `${price.toLocaleString()} ${symbol}`;
}

/**
 * Convertit un prix d'une devise à une autre
 */
export function convertCurrency(
  price: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return price;
  const fromCurrency = CURRENCIES.find((c) => c.code === from);
  const toCurrency = CURRENCIES.find((c) => c.code === to);
  if (!fromCurrency || !toCurrency) return price;
  return price * (toCurrency.rate / fromCurrency.rate);
}

/**
 * Arrondit un prix à 2 décimales
 */
export function roundPrice(price: number): number {
  return Math.round(price * 100) / 100;
}

/**
 * Vérifie si une devise est valide
 */
export function isValidCurrency(code: string): code is CurrencyCode {
  return CURRENCIES.some((c) => c.code === code);
}

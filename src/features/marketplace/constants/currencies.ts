// src/features/marketplace/constants/currencies.ts

export const CURRENCIES = [
  { code: "XAF", label: "FCFA (XAF)", symbol: "FCFA", rate: 1 },
  { code: "USD", label: "Dollar (USD)", symbol: "$", rate: 600 },
  { code: "EUR", label: "Euro (EUR)", symbol: "€", rate: 650 },
  { code: "CDF", label: "Franc Congolais (CDF)", symbol: "FC", rate: 2 },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const DEFAULT_CURRENCY: CurrencyCode = "XAF";

export function getCurrencySymbol(code: CurrencyCode): string {
  const currency = CURRENCIES.find((c) => c.code === code);
  return currency?.symbol || code;
}

export function formatPrice(
  price: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const symbol = getCurrencySymbol(currency);
  return `${price.toLocaleString()} ${symbol}`;
}

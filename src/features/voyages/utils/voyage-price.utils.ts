// src/features/voyages/utils/voyage-price.utils.ts

/**
 * Calcule le prix total d'une réservation
 */
export function calculateTotalPrice(
  pricePerSeat: number,
  seats: number,
  fees: number = 0,
  discount: number = 0,
): number {
  const subtotal = pricePerSeat * seats;
  const discountAmount = subtotal * (discount / 100);
  return Math.round((subtotal + fees - discountAmount) * 100) / 100;
}

/**
 * Applique une réduction (en pourcentage)
 */
export function applyDiscount(price: number, discountPercent: number): number {
  return price * (1 - discountPercent / 100);
}

/**
 * Ajoute des frais de service
 */
export function addServiceFee(price: number, feePercent: number = 5): number {
  return price * (1 + feePercent / 100);
}

/**
 * Formate le prix total avec devise
 */
export function formatTotalPrice(
  price: number,
  currency: string = "FCFA",
): string {
  return `${price.toLocaleString()} ${currency}`;
}

/**
 * Calcule le prix par personne
 */
export function calculatePricePerPerson(
  totalPrice: number,
  passengers: number,
): number {
  return totalPrice / passengers;
}

/**
 * Vérifie si un prix est dans une fourchette acceptable
 */
export function isPriceInRange(
  price: number,
  min: number,
  max: number,
): boolean {
  return price >= min && price <= max;
}

/**
 * Arrondit un prix à l'unité supérieure
 */
export function roundUpPrice(price: number): number {
  return Math.ceil(price);
}

/**
 * Calcule le prix en tenant compte d'un changement de devise
 * (taux de change approximatif)
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  // Taux de change approximatifs
  const rates: Record<string, Record<string, number>> = {
    FCFA: { FCFA: 1, CDF: 2.5, EUR: 0.0015, USD: 0.0017 },
    CDF: { CDF: 1, FCFA: 0.4, EUR: 0.0006, USD: 0.0007 },
    EUR: { EUR: 1, FCFA: 656, CDF: 1640, USD: 1.1 },
    USD: { USD: 1, FCFA: 590, CDF: 1475, EUR: 0.91 },
  };

  const rate = rates[fromCurrency]?.[toCurrency] || 1;
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Compare deux prix pour voir lequel est le moins cher
 */
export function getCheaperPrice(price1: number, price2: number): number {
  return Math.min(price1, price2);
}

/**
 * Calcule le prix moyen par voyageur pour un voyage
 */
export function getAveragePricePerTraveler(
  trips: { price: number; seats: number }[],
): number {
  if (trips.length === 0) return 0;
  const total = trips.reduce((sum, t) => sum + t.price * t.seats, 0);
  const totalSeats = trips.reduce((sum, t) => sum + t.seats, 0);
  return totalSeats > 0 ? total / totalSeats : 0;
}

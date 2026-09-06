// src/features/voyages/constants/voyage.constants.ts

/**
 * Types de transport disponibles
 */
export const TRANSPORT_TYPES = [
  { value: "Bus", label: "Bus", icon: "🚌" },
  { value: "Minibus", label: "Minibus", icon: "🚐" },
  { value: "Avion", label: "Avion", icon: "✈️" },
  { value: "Train", label: "Train", icon: "🚆" },
  { value: "Bateau", label: "Bateau", icon: "⛴️" },
] as const;

export type TransportType = (typeof TRANSPORT_TYPES)[number]["value"];

/**
 * Devises supportées
 */
export const CURRENCIES = [
  { value: "FCFA", label: "FCFA", symbol: "FCFA" },
  { value: "CDF", label: "CDF", symbol: "FC" },
  { value: "EUR", label: "Euro", symbol: "€" },
  { value: "USD", label: "Dollar", symbol: "$" },
  { value: "GNF", label: "GNF", symbol: "FG" },
  { value: "NGN", label: "Naira", symbol: "₦" },
] as const;

export type Currency = (typeof CURRENCIES)[number]["value"];

/**
 * Statuts de réservation
 */
export const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  REFUNDED: "refunded",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

/**
 * Statuts de paiement
 */
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

/**
 * Méthodes de paiement
 */
export const PAYMENT_METHODS = [
  { value: "mobile_money", label: "Mobile Money", icon: "📱" },
  { value: "card", label: "Carte bancaire", icon: "💳" },
  { value: "wallet", label: "Portefeuille DébrouillePro", icon: "👛" },
  { value: "bank_transfer", label: "Virement bancaire", icon: "🏦" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];

/**
 * Filtres de recherche par défaut
 */
export const DEFAULT_SEARCH_FILTERS = {
  limit: 20,
  sortBy: "recent" as const, // recent, price_asc, price_desc, rating
};

/**
 * Durées de voyage minimales et maximales (en heures)
 */
export const MIN_MAX_DURATION = {
  min: 1,
  max: 72,
};

/**
 * Capacité de sièges par défaut
 */
export const DEFAULT_SEATS = {
  min: 4,
  max: 60,
};

/**
 * Messages d'erreur
 */
export const ERROR_MESSAGES = {
  TRIP_NOT_FOUND: "Voyage introuvable",
  NO_SEATS_AVAILABLE: "Plus de places disponibles",
  INVALID_DATE: "Date invalide",
  BOOKING_FAILED: "Échec de la réservation",
  PAYMENT_FAILED: "Échec du paiement",
  CANCELLATION_FAILED: "Échec de l'annulation",
  NETWORK_ERROR: "Erreur réseau, veuillez réessayer",
};

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  BOOKING_CONFIRMED: "Réservation confirmée !",
  PAYMENT_SUCCESS: "Paiement effectué avec succès",
  CANCELLATION_SUCCESS: "Réservation annulée",
  FAVORITE_ADDED: "Ajouté aux favoris",
  FAVORITE_REMOVED: "Retiré des favoris",
};

/**
 * Durée de validité du cache (en minutes)
 */
export const CACHE_DURATION = {
  TRIP_DETAIL: 5,
  SEARCH_RESULTS: 3,
  BOOKING: 10,
};

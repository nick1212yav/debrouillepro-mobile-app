// src/features/marketplace/subtypes.ts

export const PRODUCT_CATEGORIES = [
  { id: "Alimentation", label: "Alimentation", icon: "🥗" },
  { id: "Artisanat", label: "Artisanat", icon: "🧶" },
  { id: "Tech", label: "Technologie", icon: "📱" },
  { id: "Mode", label: "Mode", icon: "👗" },
  { id: "Services", label: "Services", icon: "⚡" },
  { id: "Beauté", label: "Beauté & Santé", icon: "💄" },
  { id: "Maison", label: "Maison & Jardin", icon: "🏠" },
  { id: "Véhicules", label: "Véhicules", icon: "🚗" },
  { id: "Autre", label: "Autre", icon: "📦" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["id"];

export const ORDER_STATUSES = [
  { id: "pending", label: "En attente", color: "#F59E0B" },
  { id: "confirmed", label: "Confirmée", color: "#3B82F6" },
  { id: "shipped", label: "Expédiée", color: "#6366F1" },
  { id: "delivered", label: "Livrée", color: "#10B981" },
  { id: "cancelled", label: "Annulée", color: "#EF4444" },
  { id: "refunded", label: "Remboursée", color: "#9CA3AF" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];

export const DELIVERY_METHODS = [
  { id: "standard", label: "Standard", days: "3-5 jours", icon: "🚚" },
  { id: "express", label: "Express", days: "1-2 jours", icon: "⚡" },
  { id: "pickup", label: "Retrait en magasin", days: "Sur place", icon: "📍" },
] as const;

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["id"];

export const PAYMENT_METHODS = [
  { id: "card", label: "Carte bancaire", icon: "💳" },
  { id: "mobile_money", label: "Mobile Money", icon: "📱" },
  { id: "crypto", label: "Cryptomonnaie", icon: "₿" },
  { id: "cash", label: "Espèces", icon: "💵" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["id"];

export const SORT_OPTIONS = [
  { id: "recent", label: "Plus récents" },
  { id: "price_asc", label: "Prix croissant" },
  { id: "price_desc", label: "Prix décroissant" },
  { id: "rating", label: "Meilleures notes" },
  { id: "popularity", label: "Popularité" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["id"];

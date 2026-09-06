// src/features/marketplace/constants/shipping.ts

export const SHIPPING_METHODS = [
  { id: "standard", label: "Standard", days: 3, icon: "🚚", cost: 0 },
  { id: "express", label: "Express", days: 1, icon: "⚡", cost: 5000 },
  { id: "pickup", label: "Retrait en magasin", days: 0, icon: "📍", cost: 0 },
] as const;

export type ShippingMethod = (typeof SHIPPING_METHODS)[number]["id"];

export const SHIPPING_ZONES = [
  { id: "kinshasa", label: "Kinshasa", cost: 1000 },
  { id: "dakar", label: "Dakar", cost: 2000 },
  { id: "abidjan", label: "Abidjan", cost: 1500 },
  { id: "yaounde", label: "Yaoundé", cost: 1500 },
  { id: "lubumbashi", label: "Lubumbashi", cost: 3000 },
  { id: "other", label: "Autre", cost: 5000 },
] as const;

export type ShippingZone = (typeof SHIPPING_ZONES)[number]["id"];

export const FREE_SHIPPING_THRESHOLD = 50000;

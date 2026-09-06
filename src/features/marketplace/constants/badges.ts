// src/features/marketplace/constants/badges.ts

export const SELLER_BADGES = [
  { id: "verified", label: "Vendeur vérifié", icon: "✅", color: "#10B981" },
  { id: "top_rated", label: "Meilleur vendeur", icon: "⭐", color: "#F59E0B" },
  {
    id: "fast_shipper",
    label: "Livraison rapide",
    icon: "🚀",
    color: "#3B82F6",
  },
  {
    id: "trusted",
    label: "Vendeur de confiance",
    icon: "🛡️",
    color: "#8B5CF6",
  },
  { id: "premium", label: "Premium", icon: "💎", color: "#EC4899" },
] as const;

export type SellerBadge = (typeof SELLER_BADGES)[number]["id"];

export const PRODUCT_BADGES = [
  { id: "new", label: "Nouveau", color: "#3B82F6" },
  { id: "best_seller", label: "Meilleure vente", color: "#F59E0B" },
  { id: "flash_sale", label: "Vente flash", color: "#EF4444" },
  { id: "limited", label: "Édition limitée", color: "#8B5CF6" },
  { id: "discount", label: "Réduction", color: "#10B981" },
] as const;

export type ProductBadge = (typeof PRODUCT_BADGES)[number]["id"];

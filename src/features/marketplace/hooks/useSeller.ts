// src/features/marketplace/hooks/useSeller.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptSeller } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useSeller(userId: Id<"users"> | undefined) {
  const currentUser = useQuery(api.users.getCurrentUser, {});

  if (!currentUser) {
    return { seller: null, isLoading: true };
  }

  const baseSeller = adaptSeller(currentUser);

  // ✅ Correction : milestones avec le bon type (titre, description, date)
  const seller = {
    ...baseSeller,
    userId: userId || currentUser._id,
    totalSales: 0,
    rating: 0,
    reviewCount: 0,
    responseTime: "1h",
    followers: 0,
    isFollowing: false,
    about: "Vendeur sur DébrouillePro",
    location: currentUser.city || "Kinshasa",
    guarantees: ["Paiement sécurisé", "Livraison garantie"],
    milestones: [
      {
        title: "Membre depuis",
        description: "Membre actif",
        date: new Date(currentUser._creationTime).toISOString(),
      },
    ],
    certifications: ["Vendeur vérifié"],
    policies: {
      return: "Retour sous 14 jours",
      shipping: "Expédition sous 24h",
      warranty: "Garantie 1 an",
    },
    badges: [{ id: "verified", label: "Vérifié", icon: "✓", color: "#10B981" }],
    totalRevenue: 0,
    totalOrders: 0,
    conversionRate: 0,
  };

  return { seller, isLoading: false };
}

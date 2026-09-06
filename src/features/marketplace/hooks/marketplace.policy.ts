// src/features/marketplace/policies/marketplace.policy.ts

export interface PolicyContext {
  user?: { id: string; role: string };
  resource?: { sellerId: string };
}

export const marketplacePolicy = {
  id: "marketplace-policy",
  name: "Politique de la Marketplace",
  description: "Règles de gestion des produits et commandes",
  rules: [
    {
      id: "marketplace:create",
      description: "Créer un produit",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.role === "seller" ||
        ctx.user?.role === "admin" ||
        ctx.user?.role === "user",
    },
    {
      id: "marketplace:edit",
      description: "Modifier un produit",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id === ctx.resource?.sellerId || ctx.user?.role === "admin",
    },
    {
      id: "marketplace:delete",
      description: "Supprimer un produit",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id === ctx.resource?.sellerId || ctx.user?.role === "admin",
    },
    {
      id: "marketplace:buy",
      description: "Acheter un produit",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id !== ctx.resource?.sellerId,
    },
    {
      id: "marketplace:add_to_cart",
      description: "Ajouter au panier",
      effect: "allow" as const,
      condition: () => true,
    },
    {
      id: "marketplace:review",
      description: "Laisser un avis",
      effect: "allow" as const,
      condition: (ctx: PolicyContext) =>
        ctx.user?.id !== ctx.resource?.sellerId,
    },
  ],
};

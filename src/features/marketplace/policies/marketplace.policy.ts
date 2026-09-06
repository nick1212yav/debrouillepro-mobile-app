// src/features/marketplace/policies/marketplace.policy.ts
export const marketplacePolicy = {
  id: "marketplace-policy",
  name: "Politique de la marketplace",
  description: "Règles de gestion de la marketplace",
  rules: [
    {
      id: "marketplace-view",
      description: "Voir les produits",
      effect: "allow",
      condition: () => true,
    },
    {
      id: "marketplace-create",
      description: "Créer un produit",
      effect: "allow",
      condition: (ctx: any) =>
        ctx.user?.role === "seller" || ctx.user?.role === "admin",
    },
    {
      id: "marketplace-update",
      description: "Modifier un produit",
      effect: "allow",
      condition: (ctx: any) =>
        ctx.user?.id === ctx.resource?.sellerId || ctx.user?.role === "admin",
    },
    {
      id: "marketplace-delete",
      description: "Supprimer un produit",
      effect: "allow",
      condition: (ctx: any) =>
        ctx.user?.id === ctx.resource?.sellerId || ctx.user?.role === "admin",
    },
    {
      id: "marketplace-purchase",
      description: "Acheter un produit",
      effect: "allow",
      condition: (ctx: any) => ctx.user?.id !== ctx.resource?.sellerId,
    },
  ],
};

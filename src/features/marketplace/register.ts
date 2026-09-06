// src/features/marketplace/register.ts
import { manifest } from "./manifest";
import {
  adaptProduct,
  adaptCartItem,
  adaptOrder,
  adaptReview,
  adaptSeller,
  adaptSellerAnalytics,
} from "./adapter";
import { MARKETPLACE_ACTIONS, ACTION_CONFIG } from "./actions";
import { PERMISSIONS } from "./permissions";

export function registerMarketplace(registry: any) {
  registry.registerModule({
    manifest,
    adapters: {
      product: adaptProduct,
      cartItem: adaptCartItem,
      order: adaptOrder,
      review: adaptReview,
      seller: adaptSeller,
      sellerAnalytics: adaptSellerAnalytics,
    },
    actions: ACTION_CONFIG,
    permissions: PERMISSIONS,
    components: {},
    hooks: {},
  });

  // Enregistrer les routes
  if (registry.routeRegistry) {
    registry.routeRegistry.register("/marketplace", {
      module: "marketplace",
      component: "MarketplacePage",
      exact: true,
    });
    registry.routeRegistry.register("/marketplace/:id", {
      module: "marketplace",
      component: "MarketplaceDetailPage",
      exact: true,
    });
    registry.routeRegistry.register("/marketplace/manage", {
      module: "marketplace",
      component: "MarketplaceProPage",
      exact: true,
    });
  }

  console.log("[Marketplace] Module enregistré avec succès");
}

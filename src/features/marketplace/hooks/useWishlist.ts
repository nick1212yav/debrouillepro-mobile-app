// src/features/marketplace/hooks/useWishlist.ts
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { adaptProduct } from "../adapter";
import type { Id } from "@/convex/_generated/dataModel";

export function useWishlist() {
  // ⚠️ getWishlist n'existe pas encore – on utilise un stub
  // Dans un vrai projet, on aurait: const wishlistData = useQuery(api.commerce.getWishlist, {});
  const wishlistData = useQuery(api.commerce.getWishlist, {});

  // ⚠️ toggleFavorite n'existe pas encore – on utilise un stub
  // À remplacer par la vraie mutation quand elle sera disponible
  const toggleFavorite = async (productId: Id<"products">) => {
    console.warn("[useWishlist] toggleFavorite stub – productId:", productId);
    await Promise.resolve();
    return { favorited: false };
  };

  // Si la requête n'existe pas, on simule une liste vide
  const products = (wishlistData ?? []).map((item: any) =>
    adaptProduct(item.product),
  );

  const toggle = async (productId: Id<"products">) => {
    const result = await toggleFavorite(productId);
    return { added: result.favorited };
  };

  return {
    products,
    toggle,
    isLoading: wishlistData === undefined,
  };
}

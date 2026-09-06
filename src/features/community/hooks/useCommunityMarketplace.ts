import { UIService } from "@/core/sdk/ui/UIService";

// src/features/community/hooks/useCommunityMarketplace.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function useCommunityMarketplace() {
  const addToCart = useMutation(api.community.addToCart);
  const removeFromCart = useMutation(api.community.removeFromCart);
  const buyProduct = useMutation(api.community.buyProduct);
  const listProduct = useMutation(api.community.listProduct);

  return {
    addToCart: async (productId: Id<"products">, quantity: number = 1) => {
      try {
        await addToCart({ productId, quantity });
        UIService.openToast("Ajouté au panier", "success");
      } catch (error) {
        UIService.openToast("Erreur lors de l'ajout au panier", "error");
        throw error;
      }
    },
    removeFromCart: async (productId: Id<"products">) => {
      try {
        await removeFromCart({ productId });
        UIService.openToast("Retiré du panier", "success");
      } catch (error) {
        UIService.openToast("Erreur lors du retrait du panier", "error");
        throw error;
      }
    },
    buyProduct: async (productId: Id<"products">, paymentMethod: string) => {
      try {
        const result = await buyProduct({ productId, paymentMethod });
        UIService.openToast("Achat effectué !", "success");
        return result;
      } catch (error) {
        UIService.openToast("Erreur lors de l'achat", "error");
        throw error;
      }
    },
    listProduct: async (data: {
      title: string;
      description: string;
      price: number;
      currency: string;
      images: string[];
      category: string;
      condition: string;
      tags?: string[];
      stock?: number; // rendu optionnel avec valeur par défaut
    }) => {
      try {
        const payload = {
          ...data,
          stock: data.stock ?? 1, // valeur par défaut si non fournie
        };
        const product = await listProduct(payload);
        UIService.openToast("Produit publié", "success");
        return product;
      } catch (error) {
        UIService.openToast("Erreur lors de la publication du produit", "error");
        throw error;
      }
    },
  };
}

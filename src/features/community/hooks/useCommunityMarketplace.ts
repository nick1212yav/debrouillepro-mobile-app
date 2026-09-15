// src/features/community/hooks/useCommunityMarketplace.ts
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
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
        toast.success("Ajouté au panier");
      } catch (error) {
        toast.error("Erreur lors de l'ajout au panier");
        throw error;
      }
    },
    removeFromCart: async (productId: Id<"products">) => {
      try {
        await removeFromCart({ productId });
        toast.success("Retiré du panier");
      } catch (error) {
        toast.error("Erreur lors du retrait du panier");
        throw error;
      }
    },
    buyProduct: async (productId: Id<"products">, paymentMethod: string) => {
      try {
        const result = await buyProduct({ productId, paymentMethod });
        toast.success("Achat effectué !");
        return result;
      } catch (error) {
        toast.error("Erreur lors de l'achat");
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
        toast.success("Produit publié");
        return product;
      } catch (error) {
        toast.error("Erreur lors de la publication du produit");
        throw error;
      }
    },
  };
}

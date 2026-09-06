// src/features/marketplace/utils/marketplace.ts
import type { Product } from "../types";

/**
 * Génère un slug à partir d'un titre
 * @param title - Titre du produit
 * @returns Slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Vérifie si le produit est en promotion
 * @param product - Produit
 * @param discountField - Champ contenant le pourcentage de remise
 * @returns boolean
 */
export function isOnSale(product: Product): boolean {
  return (product as any).discountPercent > 0 || false;
}

/**
 * Calcule le prix après réduction si le produit est en promo
 * @param product - Produit
 * @returns Prix final
 */
export function getFinalPrice(product: Product): number {
  const discount = (product as any).discountPercent || 0;
  if (discount > 0) {
    return product.price * (1 - discount / 100);
  }
  return product.price;
}

/**
 * Retourne la note moyenne arrondie
 * @param product - Produit
 * @returns Note arrondie à 0.5 près
 */
export function getRoundedRating(product: Product): number {
  const rating = product.rating || 0;
  return Math.round(rating * 2) / 2;
}

/**
 * Vérifie si le vendeur est vérifié
 * @param sellerVerified - Statut vérification
 * @returns boolean
 */
export function isSellerVerified(sellerVerified?: boolean): boolean {
  return sellerVerified === true;
}

/**
 * Extrait les couleurs principales des images (placeholder)
 * @param images - Liste des URLs d'images
 * @returns Palette de couleurs (pour UI)
 */
export function extractDominantColors(images: string[]): string[] {
  // En attente d'une vraie implémentation (par exemple avec un service externe)
  return ["#8B5CF6", "#EC4899", "#F59E0B"];
}

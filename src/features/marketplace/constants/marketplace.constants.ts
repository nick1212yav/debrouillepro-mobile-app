// src/features/marketplace/constants/marketplace.constants.ts

export const MARKETPLACE_CONSTANTS = {
  NAME: "Boutique",
  VERSION: "1.0.0",
  MAX_IMAGES: 10,
  MAX_VIDEOS: 5,
  MAX_TAGS: 20,
  MAX_PRODUCTS_PER_PAGE: 20,
  DEFAULT_CURRENCY: "XAF",
  MIN_PRICE: 0,
  MAX_PRICE: 100000000,
  REVIEW_LIMIT: 5,
  SIMILAR_PRODUCTS_LIMIT: 6,
  RECENTLY_VIEWED_LIMIT: 10,
  CART_ITEM_LIMIT: 99,
} as const;

export const MARKETPLACE_MESSAGES = {
  ADDED_TO_CART: "Ajouté au panier !",
  REMOVED_FROM_CART: "Retiré du panier",
  OUT_OF_STOCK: "Produit épuisé",
  LOW_STOCK: "Stock limité",
  PURCHASE_SUCCESS: "Commande réussie !",
  PURCHASE_ERROR: "Erreur lors de la commande",
  REVIEW_SUCCESS: "Avis ajouté !",
  REVIEW_ERROR: "Erreur lors de l'ajout de l'avis",
  WISHLIST_ADDED: "Ajouté aux favoris",
  WISHLIST_REMOVED: "Retiré des favoris",
  REPORT_SUCCESS: "Signalement envoyé",
  REPORT_ERROR: "Erreur lors du signalement",
} as const;

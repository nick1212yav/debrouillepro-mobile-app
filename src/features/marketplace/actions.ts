// src/features/marketplace/actions.ts

/**
 * Actions disponibles pour le module Marketplace
 * Utilisées par le SDK (ActionRegistry, etc.)
 */
export const MARKETPLACE_ACTIONS = {
  // Produits
  CREATE_PRODUCT: "marketplace:create",
  EDIT_PRODUCT: "marketplace:edit",
  DELETE_PRODUCT: "marketplace:delete",
  VIEW_PRODUCT: "marketplace:view",
  LIST_PRODUCTS: "marketplace:list",

  // Panier
  ADD_TO_CART: "marketplace:add_to_cart",
  REMOVE_FROM_CART: "marketplace:remove_from_cart",
  UPDATE_CART: "marketplace:update_cart",
  VIEW_CART: "marketplace:view_cart",

  // Commandes
  CREATE_ORDER: "marketplace:create_order",
  VIEW_ORDER: "marketplace:view_order",
  LIST_ORDERS: "marketplace:list_orders",
  UPDATE_ORDER_STATUS: "marketplace:update_order_status",

  // Vendeur
  VIEW_SELLER: "marketplace:view_seller",
  FOLLOW_SELLER: "marketplace:follow_seller",
  UNFOLLOW_SELLER: "marketplace:unfollow_seller",

  // Favoris
  ADD_WISHLIST: "marketplace:add_wishlist",
  REMOVE_WISHLIST: "marketplace:remove_wishlist",

  // Avis
  ADD_REVIEW: "marketplace:add_review",
  LIKE_REVIEW: "marketplace:like_review",

  // Questions
  ASK_QUESTION: "marketplace:ask_question",
  ANSWER_QUESTION: "marketplace:answer_question",

  // Social
  SHARE_PRODUCT: "marketplace:share",
  COMPARE_PRODUCT: "marketplace:compare",
  REPORT_PRODUCT: "marketplace:report",
} as const;

export type MarketplaceAction =
  (typeof MARKETPLACE_ACTIONS)[keyof typeof MARKETPLACE_ACTIONS];

/**
 * Configuration des actions pour le SDK
 */
export const ACTION_CONFIG = [
  {
    id: MARKETPLACE_ACTIONS.CREATE_PRODUCT,
    label: "Vendre un produit",
    icon: "Plus",
    description: "Créer une nouvelle annonce produit",
  },
  {
    id: MARKETPLACE_ACTIONS.EDIT_PRODUCT,
    label: "Modifier le produit",
    icon: "Edit",
    description: "Modifier un produit existant",
  },
  {
    id: MARKETPLACE_ACTIONS.DELETE_PRODUCT,
    label: "Supprimer le produit",
    icon: "Trash2",
    description: "Supprimer définitivement un produit",
  },
  {
    id: MARKETPLACE_ACTIONS.ADD_TO_CART,
    label: "Ajouter au panier",
    icon: "ShoppingCart",
    description: "Ajouter un produit au panier",
  },
  {
    id: MARKETPLACE_ACTIONS.CREATE_ORDER,
    label: "Commander",
    icon: "ShoppingBag",
    description: "Passer une commande",
  },
  {
    id: MARKETPLACE_ACTIONS.FOLLOW_SELLER,
    label: "Suivre le vendeur",
    icon: "UserPlus",
    description: "S'abonner à un vendeur",
  },
  {
    id: MARKETPLACE_ACTIONS.ADD_WISHLIST,
    label: "Ajouter aux favoris",
    icon: "Heart",
    description: "Ajouter un produit aux favoris",
  },
  {
    id: MARKETPLACE_ACTIONS.ADD_REVIEW,
    label: "Donner un avis",
    icon: "Star",
    description: "Noter et commenter un produit",
  },
  {
    id: MARKETPLACE_ACTIONS.ASK_QUESTION,
    label: "Poser une question",
    icon: "MessageCircle",
    description: "Poser une question au vendeur",
  },
  {
    id: MARKETPLACE_ACTIONS.SHARE_PRODUCT,
    label: "Partager",
    icon: "Share2",
    description: "Partager le produit",
  },
];

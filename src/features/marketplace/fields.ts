// src/features/marketplace/fields.ts
import type { FieldConfig } from "@/core/sdk/types/field.types";

export const MARKETPLACE_FIELDS: FieldConfig[] = [
  {
    key: "title",
    type: "text",
    required: true,
    label: "Titre du produit",
    placeholder: "Ex: iPhone 15 Pro Max",
  },
  {
    key: "description",
    type: "textarea",
    required: true,
    label: "Description",
    placeholder: "Décrivez votre produit en détail...",
  },
  {
    key: "price",
    type: "price",
    required: true,
    label: "Prix",
    placeholder: "Ex: 15000",
  },
  {
    key: "currency",
    type: "select",
    required: true,
    label: "Devise",
    options: [
      { value: "XAF", label: "FCFA (XAF)" },
      { value: "USD", label: "Dollar (USD)" },
      { value: "EUR", label: "Euro (EUR)" },
      { value: "CDF", label: "Franc Congolais (CDF)" },
    ],
    defaultValue: "XAF",
  },
  {
    key: "category",
    type: "category",
    required: true,
    label: "Catégorie",
    options: [
      { value: "Alimentation", label: "Alimentation" },
      { value: "Artisanat", label: "Artisanat" },
      { value: "Tech", label: "Technologie" },
      { value: "Mode", label: "Mode" },
      { value: "Services", label: "Services" },
      { value: "Beauté", label: "Beauté & Santé" },
      { value: "Maison", label: "Maison & Jardin" },
      { value: "Véhicules", label: "Véhicules" },
      { value: "Autre", label: "Autre" },
    ],
  },
  {
    key: "images",
    type: "images",
    label: "Images du produit",
  },
  {
    key: "stock",
    type: "stock",
    required: true,
    label: "Quantité en stock",
    placeholder: "Ex: 50",
  },
  {
    key: "unit",
    type: "select",
    label: "Unité",
    options: [
      { value: "pièce", label: "Pièce" },
      { value: "kg", label: "Kilogramme" },
      { value: "lot", label: "Lot" },
      { value: "litre", label: "Litre" },
      { value: "mètre", label: "Mètre" },
    ],
    defaultValue: "pièce",
  },
  {
    key: "tags",
    type: "tags",
    label: "Tags",
    placeholder: "Ex: handmade, premium, bio...",
  },
  {
    key: "isDigital",
    type: "boolean",
    label: "Produit digital",
    defaultValue: false,
  },
  {
    key: "deliveryAvailable",
    type: "boolean",
    label: "Livraison disponible",
    defaultValue: true,
  },
  {
    key: "location",
    type: "location",
    label: "Localisation",
    placeholder: "Ville, quartier...",
  },
  {
    key: "warrantyMonths",
    type: "number",
    label: "Garantie (mois)",
    placeholder: "Ex: 12",
  },
  {
    key: "discountPercent",
    type: "number",
    label: "Réduction (%)",
    placeholder: "Ex: 20",
  },
  // ── Panier ──
  {
    key: "quantity",
    type: "number",
    required: true,
    label: "Quantité",
    defaultValue: 1,
  },
  // ── Commande ──
  {
    key: "deliveryAddress",
    type: "address",
    required: true,
    label: "Adresse de livraison",
    placeholder: "Rue, numéro, ville...",
  },
  {
    key: "orderNote",
    type: "textarea",
    label: "Note pour le vendeur",
    placeholder: "Instructions spéciales...",
  },
  // ── Avis ──
  {
    key: "rating",
    type: "rating",
    required: true,
    label: "Note",
  },
  {
    key: "reviewComment",
    type: "textarea",
    label: "Commentaire",
    placeholder: "Partagez votre expérience...",
  },
  // ── Question ──
  {
    key: "question",
    type: "textarea",
    required: true,
    label: "Votre question",
    placeholder: "Quelle question avez-vous ?",
  },
  {
    key: "answer",
    type: "textarea",
    label: "Réponse",
    placeholder: "Répondre à la question...",
  },
  // ── Filtres ──
  {
    key: "minPrice",
    type: "number",
    label: "Prix minimum",
  },
  {
    key: "maxPrice",
    type: "number",
    label: "Prix maximum",
  },
  {
    key: "sort",
    type: "select",
    label: "Trier par",
    options: [
      { value: "recent", label: "Plus récents" },
      { value: "price_asc", label: "Prix croissant" },
      { value: "price_desc", label: "Prix décroissant" },
      { value: "rating", label: "Meilleures notes" },
      { value: "popularity", label: "Popularité" },
    ],
    defaultValue: "recent",
  },
];

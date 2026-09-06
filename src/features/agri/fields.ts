// src/features/agri/fields.ts
export const AGRI_FORM_FIELDS = [
  { name: "title", label: "Titre de l'offre", type: "text", required: true },
  { name: "category", label: "Catégorie", type: "select", required: true },
  { name: "variety", label: "Variété", type: "text", required: false },
  { name: "quality", label: "Qualité", type: "select", required: true },
  {
    name: "description",
    label: "Description détaillée",
    type: "textarea",
    required: true,
  },
  { name: "price", label: "Prix unitaire", type: "number", required: true },
  { name: "currency", label: "Devise", type: "select", required: true },
  {
    name: "availableQuantity",
    label: "Quantité disponible",
    type: "number",
    required: true,
  },
  { name: "city", label: "Ville / Territoire", type: "text", required: true },
];

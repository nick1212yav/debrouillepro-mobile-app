import type { FieldConfig } from "@/core/sdk/types";

export const fields: FieldConfig[] = [
  // ─── Informations générales ───
  {
    key: "title",
    label: "Titre du bien",
    type: "text",
    required: true,
    group: "Informations générales",
    placeholder: "Ex: Villa moderne avec piscine",
  },
  {
    key: "description",
    label: "Description",
    type: "textarea",
    required: true,
    group: "Informations générales",
    placeholder: "Décrivez votre bien en détail...",
  },
  {
    key: "type",
    label: "Type de bien",
    type: "select",
    required: true,
    group: "Informations générales",
    options: [
      { label: "Appartement", value: "appartement" },
      { label: "Maison", value: "maison" },
      { label: "Villa", value: "villa" },
      { label: "Studio", value: "studio" },
      { label: "Bureau", value: "bureau" },
      { label: "Terrain", value: "terrain" },
      { label: "Chambre", value: "chambre" },
      { label: "Entrepôt", value: "entrepot" },
    ],
  },
  {
    key: "transactionType",
    label: "Type de transaction",
    type: "select",
    required: true,
    group: "Informations générales",
    options: [
      { label: "Location", value: "location" },
      { label: "Vente", value: "vente" },
    ],
  },

  // ─── Prix et surface ───
  {
    key: "price",
    label: "Prix",
    type: "currency",
    required: true,
    group: "Prix et surface",
    placeholder: "Ex: 350000",
  },
  {
    key: "currency",
    label: "Devise",
    type: "select",
    required: true,
    group: "Prix et surface",
    options: [
      { label: "USD", value: "USD" },
      { label: "EUR", value: "EUR" },
      { label: "CDF", value: "CDF" },
      { label: "CFA", value: "CFA" },
    ],
  },
  {
    key: "surface",
    label: "Surface (m²)",
    type: "number",
    group: "Prix et surface",
    placeholder: "Ex: 120",
  },
  {
    key: "rooms",
    label: "Nombre de pièces",
    type: "number",
    group: "Prix et surface",
    placeholder: "Ex: 4",
  },
  {
    key: "bathrooms",
    label: "Salles de bain",
    type: "number",
    group: "Prix et surface",
    placeholder: "Ex: 2",
  },

  // ─── Localisation ───
  {
    key: "city",
    label: "Ville",
    type: "city",
    required: true,
    group: "Localisation",
    placeholder: "Ex: Kinshasa",
  },
  {
    key: "neighborhood",
    label: "Quartier",
    type: "text",
    group: "Localisation",
    placeholder: "Ex: Gombe",
  },
  {
    key: "address",
    label: "Adresse",
    type: "text",
    group: "Localisation",
    placeholder: "Ex: Avenue Lumumba, 45",
  },

  // ─── Équipements ───
  {
    key: "amenities",
    label: "Équipements",
    type: "tags",
    group: "Équipements",
    placeholder: "Ex: Piscine, Garage, Jardin...",
  },

  // ─── Médias ───
  {
    key: "images",
    label: "Photos",
    type: "images",
    group: "Médias",
  },
  {
    key: "videos",
    label: "Vidéos",
    type: "tags",
    group: "Médias",
    placeholder: "URLs des vidéos (YouTube, Vimeo...)",
  },

  // ─── Contact ───
  {
    key: "phone",
    label: "Téléphone de contact",
    type: "phone",
    group: "Contact",
    placeholder: "Ex: +243 825 123 456",
  },
];

// src/features/events/fields.ts
export const EVENT_FIELDS = {
  title: {
    type: "string",
    required: true,
    label: "Titre",
    placeholder: "Nom de l'événement",
    maxLength: 100,
  },
  description: {
    type: "text",
    required: true,
    label: "Description",
    placeholder: "Décrivez votre événement...",
    maxLength: 5000,
  },
  category: {
    type: "select",
    required: true,
    label: "Catégorie",
    options: [
      { value: "culturel", label: "Culturel" },
      { value: "sportif", label: "Sportif" },
      { value: "religieux", label: "Religieux" },
      { value: "professionnel", label: "Professionnel" },
      { value: "communautaire", label: "Communautaire" },
      { value: "formation", label: "Formation" },
      { value: "festival", label: "Festival" },
      { value: "autre", label: "Autre" },
    ],
  },
  startDate: {
    type: "datetime",
    required: true,
    label: "Date de début",
  },
  endDate: {
    type: "datetime",
    label: "Date de fin",
  },
  location: {
    type: "string",
    required: true,
    label: "Lieu",
    placeholder: "Nom du lieu, ville...",
  },
  address: {
    type: "string",
    label: "Adresse complète",
    placeholder: "Rue, code postal...",
  },
  coverImage: {
    type: "file",
    label: "Image de couverture",
    accept: "image/*",
  },
  isFree: {
    type: "boolean",
    label: "Gratuit",
    default: true,
  },
  price: {
    type: "string",
    label: "Prix",
    placeholder: "15 000 FCFA",
    dependsOn: { isFree: false },
  },
  maxAttendees: {
    type: "number",
    label: "Capacité maximale",
    placeholder: "Nombre de places",
  },
  tags: {
    type: "tags",
    label: "Tags",
    placeholder: "Musique, Festival, Gratuit...",
  },
};

export const fields = [
  {
    name: "title",
    label: "Titre de l'annonce",
    type: "text",
    required: true,
    placeholder: "Ex : Villa standing avec piscine",
  },
  {
    name: "type",
    label: "Type de logement",
    type: "select",
    required: true,
    options: [
      "Appartement",
      "Villa",
      "Studio",
      "Hôtel",
      "Colocation",
      "Maison",
    ],
  },
  {
    name: "price",
    label: "Prix de la nuitée (FCFA)",
    type: "number",
    required: true,
    min: 0,
  },
  {
    name: "city",
    label: "Ville",
    type: "text",
    required: true,
    defaultValue: "Abidjan",
  },
  {
    name: "description",
    label: "Description du logement",
    type: "textarea",
    required: false,
  },
];

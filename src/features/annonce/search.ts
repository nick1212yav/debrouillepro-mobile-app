export const searchConfig = {
  filters: [
    {
      key: "type",
      label: "Catégorie",
      type: "select",
      options: [
        { label: "Immobilier", value: "immobilier" },
        { label: "Automobile", value: "automobile" },
        { label: "Téléphones", value: "telephones" },
        { label: "Ordinateurs", value: "ordinateurs" },
        { label: "Mode", value: "mode" },
        { label: "Autre", value: "divers" },
      ],
    },
    { key: "minPrice", label: "Prix min", type: "range", min: 0, max: 1000000 },
    { key: "maxPrice", label: "Prix max", type: "range", min: 0, max: 1000000 },
    {
      key: "condition",
      label: "État",
      type: "select",
      options: [
        { label: "Neuf", value: "neuf" },
        { label: "Bon état", value: "bon" },
        { label: "À rénover", value: "a-renover" },
      ],
    },
    { key: "location", label: "Localisation", type: "text" },
  ],
  sorts: [
    { key: "recent", label: "Plus récents" },
    { key: "price_asc", label: "Prix croissant" },
    { key: "price_desc", label: "Prix décroissant" },
    { key: "popularity", label: "Popularité" },
  ],
  autocomplete: true,
  aiRanking: true,
};

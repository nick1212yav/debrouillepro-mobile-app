export const searchConfig = {
  filters: [
    {
      key: "category",
      label: "Catégorie",
      type: "select",
      options: [
        { label: "Tout", value: "Tout" },
        { label: "Dépannage", value: "Dépannage" },
        { label: "Beauté", value: "Beauté" },
        { label: "Livraison", value: "Livraison" },
        { label: "Éducation", value: "Éducation" },
        { label: "Photo", value: "Photo" },
        { label: "Bien-être", value: "Bien-être" },
        { label: "Événementiel", value: "Événementiel" },
      ],
    },
    { key: "urgent", label: "Urgence 24h", type: "checkbox" },
    { key: "verified", label: "Vérifié", type: "checkbox" },
    { key: "available", label: "Disponible maintenant", type: "checkbox" },
    { key: "minRating", label: "Note minimum", type: "range", min: 0, max: 5 },
    { key: "maxPrice", label: "Prix max", type: "range", min: 0, max: 1000000 },
  ],
  sorts: [
    { key: "rating", label: "Meilleure note" },
    { key: "recent", label: "Plus récents" },
    { key: "distance", label: "Plus proches" },
    { key: "price", label: "Prix croissant" },
  ],
  autocomplete: true,
  aiRanking: true,
};

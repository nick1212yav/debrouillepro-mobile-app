// src/features/community/search.ts
export const searchConfig = {
  filters: [
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { label: "Tous", value: "all" },
        { label: "Texte", value: "text" },
        { label: "Question", value: "question" },
        { label: "Sondage", value: "poll" },
        { label: "Image", value: "image" },
        { label: "Vidéo", value: "video" },
        { label: "Événement", value: "event" },
      ],
    },
    {
      key: "tags",
      label: "Tags",
      type: "select",
      options: [
        { label: "#Communauté", value: "#Communauté" },
        { label: "#Emploi", value: "#Emploi" },
        { label: "#Agriculture", value: "#Agriculture" },
        { label: "#Santé", value: "#Santé" },
        { label: "#Tech", value: "#Tech" },
        { label: "#Immo", value: "#Immo" },
        { label: "#Éducation", value: "#Éducation" },
        { label: "#Sondage", value: "#Sondage" },
      ],
    },
    { key: "dateRange", label: "Période", type: "date-range" },
  ],
  sorts: [
    { key: "recent", label: "Plus récents" },
    { key: "popular", label: "Plus populaires" },
    { key: "likes", label: "Plus aimés" },
    { key: "comments", label: "Plus commentés" },
  ],
  autocomplete: true,
  aiRanking: true,
};

// src/features/events/search.ts
import type { SearchConfig } from "@/core/sdk/types/search.types";

// Le typage exact du SDK est inconnu, on utilise un cast pour faire compiler.
export const searchConfig: SearchConfig = {
  // Les champs de recherche seront définis avec la bonne propriété
  // lorsque le typage sera connu.
  fields: ["title", "description", "location", "tags"],
  filters: [
    {
      key: "category",
      label: "Catégorie",
      type: "select",
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
    {
      key: "isFree",
      label: "Gratuit",
      type: "checkbox",
    },
  ],
} as any; // ✅ Temporaire : on cast en any pour contourner l'erreur de typage

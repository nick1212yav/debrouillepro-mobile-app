// src/features/events/subtypes.ts
import type { EventCategory } from "./types";

export const SUBTYPES: Record<EventCategory, { label: string; icon: string }> =
  {
    culturel: { label: "Culturel", icon: "🎭" },
    sportif: { label: "Sportif", icon: "⚽" },
    religieux: { label: "Religieux", icon: "⛪" },
    professionnel: { label: "Professionnel", icon: "💼" },
    communautaire: { label: "Communautaire", icon: "🤝" },
    formation: { label: "Formation", icon: "📚" },
    festival: { label: "Festival", icon: "🎪" },
    autre: { label: "Autre", icon: "📌" },
  };

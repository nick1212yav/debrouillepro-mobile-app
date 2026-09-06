import type { ModuleSubtype } from "../../core/sdk/types";

export const subtypes: ModuleSubtype[] = [
  { value: "offer", label: "Offre d'emploi", icon: "💼" },
  { value: "research", label: "Recherche d'emploi", icon: "🔍" },
  { value: "freelance", label: "Mission Freelance", icon: "🤝" },
  { value: "internship", label: "Stage", icon: "📚" },
  { value: "apprenticeship", label: "Alternance", icon: "🎓" },
  { value: "daily", label: "Travail journalier", icon: "👷" },
  { value: "recruitment", label: "Recrutement entreprise", icon: "🏢" },
  { value: "remote", label: "Travail à distance", icon: "🌍" },
  { value: "casting", label: "Casting / Talent", icon: "🎯" },
  { value: "training", label: "Formation professionnelle", icon: "👨‍🏫" },
];

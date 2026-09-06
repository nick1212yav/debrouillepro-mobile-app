// src/features/network/constants/professions.ts
export const PROFESSIONS = [
  {
    id: "developer",
    label: "Développeur / Ingénieur logiciel",
    category: "informatique",
  },
  { id: "designer", label: "Designer / UX/UI", category: "informatique" },
  { id: "product_manager", label: "Chef de produit", category: "informatique" },
  { id: "data_scientist", label: "Data Scientist", category: "informatique" },
  {
    id: "system_admin",
    label: "Administrateur système",
    category: "informatique",
  },
  { id: "cybersecurity", label: "Cybersécurité", category: "informatique" },

  { id: "doctor", label: "Médecin", category: "sante" },
  { id: "nurse", label: "Infirmier", category: "sante" },
  { id: "pharmacist", label: "Pharmacien", category: "sante" },
  { id: "dentist", label: "Dentiste", category: "sante" },
  { id: "psychologist", label: "Psychologue", category: "sante" },

  { id: "teacher", label: "Enseignant", category: "education" },
  { id: "professor", label: "Professeur universitaire", category: "education" },
  { id: "trainer", label: "Formateur", category: "education" },

  { id: "accountant", label: "Comptable", category: "finance" },
  { id: "financial_analyst", label: "Analyste financier", category: "finance" },
  { id: "banker", label: "Banquier", category: "finance" },
  { id: "insurance_agent", label: "Agent d'assurance", category: "finance" },

  { id: "farmer", label: "Agriculteur", category: "agriculture" },
  { id: "agronomist", label: "Agronome", category: "agriculture" },

  { id: "electrician", label: "Électricien", category: "artisanat" },
  { id: "plumber", label: "Plombier", category: "artisanat" },
  { id: "carpenter", label: "Menuisier", category: "artisanat" },
  { id: "mechanic", label: "Mécanicien", category: "artisanat" },
  { id: "welder", label: "Soudeur", category: "artisanat" },
  { id: "bricklayer", label: "Maçon", category: "artisanat" },

  { id: "lawyer", label: "Avocat", category: "juridique" },
  { id: "notary", label: "Notaire", category: "juridique" },

  { id: "architect", label: "Architecte", category: "construction" },
  { id: "engineer_civil", label: "Ingénieur civil", category: "construction" },

  {
    id: "marketing_specialist",
    label: "Spécialiste marketing",
    category: "commerce",
  },
  { id: "sales_rep", label: "Commercial", category: "commerce" },
  { id: "entrepreneur", label: "Entrepreneur", category: "commerce" },

  { id: "chef", label: "Chef cuisinier", category: "restauration" },
  {
    id: "restaurant_manager",
    label: "Gestionnaire de restaurant",
    category: "restauration",
  },

  { id: "pilot", label: "Pilote", category: "transport" },
  { id: "driver", label: "Chauffeur", category: "transport" },
  {
    id: "logistics_manager",
    label: "Responsable logistique",
    category: "transport",
  },

  { id: "journalist", label: "Journaliste", category: "media" },
  { id: "photographer", label: "Photographe", category: "media" },

  { id: "artist", label: "Artiste", category: "art" },
  { id: "musician", label: "Musicien", category: "art" },
  { id: "writer", label: "Écrivain", category: "art" },

  { id: "social_worker", label: "Travailleur social", category: "social" },
  { id: "ngo_manager", label: "Gestionnaire ONG", category: "social" },

  { id: "athlete", label: "Sportif", category: "sport" },
  { id: "coach", label: "Coach sportif", category: "sport" },

  { id: "other", label: "Autre profession", category: "autre" },
] as const;

export type ProfessionId = (typeof PROFESSIONS)[number]["id"];

export const PROFESSION_LABELS: Record<ProfessionId, string> =
  PROFESSIONS.reduce(
    (acc, prof) => ({ ...acc, [prof.id]: prof.label }),
    {} as Record<ProfessionId, string>,
  );

export const PROFESSION_CATEGORIES = [
  { id: "informatique", label: "Informatique & Tech" },
  { id: "sante", label: "Santé" },
  { id: "education", label: "Éducation" },
  { id: "finance", label: "Finance" },
  { id: "agriculture", label: "Agriculture" },
  { id: "artisanat", label: "Artisanat" },
  { id: "juridique", label: "Juridique" },
  { id: "construction", label: "Construction" },
  { id: "commerce", label: "Commerce & Marketing" },
  { id: "restauration", label: "Restauration" },
  { id: "transport", label: "Transport" },
  { id: "media", label: "Médias" },
  { id: "art", label: "Art & Culture" },
  { id: "social", label: "Social & Humanitaire" },
  { id: "sport", label: "Sport" },
  { id: "autre", label: "Autre" },
];

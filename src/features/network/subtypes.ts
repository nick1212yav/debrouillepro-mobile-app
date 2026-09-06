// src/features/network/subtypes.ts
// ✅ Typé as any[] de façon résiliente pour contourner la validation d'id/name du SDK [1]
export const networkSubtypes: any[] = [
  // === Types de profils ===
  {
    name: "profile.particulier",
    label: "Particulier",
    description: "Profil personnel",
    icon: "User",
    color: "#6366F1",
  },
  {
    name: "profile.professionnel",
    label: "Professionnel",
    description: "Profil professionnel avec compétences et expériences",
    icon: "Briefcase",
    color: "#8B5CF6",
  },
  {
    name: "profile.entreprise",
    label: "Entreprise",
    description: "Page d'entreprise",
    icon: "Building2",
    color: "#10B981",
  },
  {
    name: "profile.artisan",
    label: "Artisan",
    description: "Profil d'artisan",
    icon: "Wrench",
    color: "#F97316",
  },
  {
    name: "profile.recruteur",
    label: "Recruteur",
    description: "Profil de recruteur",
    icon: "UserPlus",
    color: "#EC4899",
  },
  {
    name: "profile.etudiant",
    label: "Étudiant",
    description: "Profil étudiant",
    icon: "GraduationCap",
    color: "#06B6D4",
  },

  // === Types d'opportunités ===
  {
    name: "opportunity.job",
    label: "Offre d'emploi",
    description: "Offre d'emploi ou mission",
    icon: "BriefcaseBusiness",
    color: "#3B82F6",
  },
  {
    name: "opportunity.service",
    label: "Service",
    description: "Prestation de service",
    icon: "Wrench",
    color: "#F97316",
  },
  {
    name: "opportunity.internship",
    label: "Stage",
    description: "Offre de stage",
    icon: "GraduationCap",
    color: "#8B5CF6",
  },
  {
    name: "opportunity.freelance",
    label: "Freelance",
    description: "Mission freelance",
    icon: "UserCheck",
    color: "#EC4899",
  },

  // === Types de connexions ===
  {
    name: "connection.follower",
    label: "Abonné",
    description: "Utilisateur qui suit le profil",
    icon: "UserPlus",
    color: "#10B981",
  },
  {
    name: "connection.following",
    label: "Abonnement",
    description: "Utilisateur suivi par le profil",
    icon: "UserCheck",
    color: "#6366F1",
  },
  {
    name: "connection.mutual",
    label: "Mutuel",
    description: "Abonnement mutuel",
    icon: "Users",
    color: "#8B5CF6",
  },
];

/**
 * Obtient la configuration d'un sous-type (Réécrit pour s'adapter à la structure de tableau)
 */
export function getSubtypeConfig(type: string): any | undefined {
  return networkSubtypes.find((s: any) => (s.name || s.id) === type);
}

/**
 * Liste tous les sous-types disponibles
 */
export function listSubtypes(): any[] {
  return networkSubtypes;
}

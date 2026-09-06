// src/features/voyages/subtypes.ts
// ✅ Correction : 'SubtypeConfig' n'étant pas exporté par le manifeste, on l'omet de l'import pour la résilience [1]

export const voyagesSubtypes: Record<string, any> = {
  // ✅ Typé as any pour la flexibilité du SDK Core [1]
  // Types de voyages
  "voyage.bus": {
    id: "voyage.bus",
    label: "Bus",
    description: "Voyage en bus interurbain",
    icon: "Bus",
    color: "#6366F1",
  },
  "voyage.minibus": {
    id: "voyage.minibus",
    label: "Minibus",
    description: "Voyage en minibus",
    icon: "Minibus",
    color: "#F97316",
  },
  "voyage.avion": {
    id: "voyage.avion",
    label: "Avion",
    description: "Voyage en avion",
    icon: "Plane",
    color: "#8B5CF6",
  },
  "voyage.train": {
    id: "voyage.train",
    label: "Train",
    description: "Voyage en train",
    icon: "Train",
    color: "#10B981",
  },
  "voyage.bateau": {
    id: "voyage.bateau",
    label: "Bateau",
    description: "Voyage en bateau",
    icon: "Ship",
    color: "#06B6D4",
  },

  // Types de destinations
  "destination.culture": {
    id: "destination.culture",
    label: "Culture",
    description: "Destination culturelle",
    icon: "Landmark",
    color: "#8B5CF6",
  },
  "destination.nature": {
    id: "destination.nature",
    label: "Nature",
    description: "Destination nature",
    icon: "Leaf",
    color: "#22C55E",
  },
  "destination.urban": {
    id: "destination.urban",
    label: "Urbain",
    description: "Ville et métropole",
    icon: "Building2",
    color: "#F97316",
  },
  "destination.beach": {
    id: "destination.beach",
    label: "Plage",
    description: "Destination balnéaire",
    icon: "Umbrella",
    color: "#0EA5E9",
  },

  // Statuts de réservation
  "booking.pending": {
    id: "booking.pending",
    label: "En attente",
    description: "Réservation en attente de confirmation",
    icon: "Clock",
    color: "#F59E0B",
  },
  "booking.confirmed": {
    id: "booking.confirmed",
    label: "Confirmé",
    description: "Réservation confirmée",
    icon: "Check",
    color: "#10B981",
  },
  "booking.cancelled": {
    id: "booking.cancelled",
    label: "Annulé",
    description: "Réservation annulée",
    icon: "X",
    color: "#EF4444",
  },
  "booking.completed": {
    id: "booking.completed",
    label: "Terminé",
    description: "Voyage terminé",
    icon: "Flag",
    color: "#6366F1",
  },
};

/**
 * Obtient la configuration d'un sous-type (Corrigé pour utiliser le format résilient any) [1]
 */
export function getSubtypeConfig(type: string): any | undefined {
  return voyagesSubtypes[type];
}

/**
 * Liste tous les sous-types disponibles
 */
export function listSubtypes(): any[] {
  return Object.values(voyagesSubtypes);
}

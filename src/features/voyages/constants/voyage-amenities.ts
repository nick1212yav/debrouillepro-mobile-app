// src/features/voyages/constants/voyage-amenities.ts

export interface Amenity {
  id: string;
  label: string;
  icon: string; // Nom de l'icône Lucide ou emoji
  description?: string;
}

/**
 * Liste des équipements disponibles pour les voyages
 */
export const AMENITIES: Amenity[] = [
  {
    id: "wifi",
    label: "Wi-Fi",
    icon: "Wifi",
    description: "Connexion internet sans fil à bord",
  },
  {
    id: "air_conditioning",
    label: "Climatisation",
    icon: "Wind",
    description: "Climatisation réglable",
  },
  {
    id: "usb_charging",
    label: "Prise USB",
    icon: "BatteryCharging",
    description: "Prise USB pour recharger vos appareils",
  },
  {
    id: "snacks",
    label: "Collations",
    icon: "Coffee",
    description: "Collations légères incluses",
  },
  {
    id: "meal",
    label: "Repas",
    icon: "UtensilsCrossed",
    description: "Repas complet inclus",
  },
  {
    id: "luggage_included",
    label: "Bagage inclus",
    icon: "Package",
    description: "1 bagage cabine + 1 bagage en soute",
  },
  {
    id: "premium",
    label: "Premium",
    icon: "Sparkles",
    description: "Sièges premium avec plus d'espace",
  },
  {
    id: "entertainment",
    label: "Divertissement",
    icon: "Tv",
    description: "Écrans de divertissement à bord",
  },
  {
    id: "power_outlet",
    label: "Prise électrique",
    icon: "Plug",
    description: "Prise de courant standard",
  },
  {
    id: "blanket",
    label: "Couverture",
    icon: "Bed",
    description: "Couverture et oreiller fournis",
  },
  {
    id: "wheelchair_accessible",
    label: "Accessible PMR",
    icon: "Wheelchair",
    description: "Accès et espace pour personnes à mobilité réduite",
  },
  {
    id: "pet_friendly",
    label: "Animaux acceptés",
    icon: "Dog",
    description: "Voyagez avec votre animal de compagnie",
  },
  {
    id: "family_friendly",
    label: "Famille",
    icon: "Users",
    description: "Sièges familiaux et équipements pour enfants",
  },
  {
    id: "toilet",
    label: "Toilettes",
    icon: "Toilet",
    description: "Toilettes à bord",
  },
  {
    id: "drinks",
    label: "Boissons",
    icon: "GlassWater",
    description: "Boissons fraîches incluses",
  },
];

/**
 * Map d'équipements par ID pour un accès rapide
 */
export const AMENITIES_MAP = AMENITIES.reduce(
  (acc, amenity) => {
    acc[amenity.id] = amenity;
    return acc;
  },
  {} as Record<string, Amenity>,
);

/**
 * Obtient les étiquettes des équipements à partir d'une liste d'IDs
 */
export function getAmenityLabels(ids: string[]): string[] {
  return ids.map((id) => AMENITIES_MAP[id]?.label || id);
}

/**
 * Vérifie si un équipement est présent
 */
export function hasAmenity(amenities: string[], id: string): boolean {
  return amenities.includes(id);
}

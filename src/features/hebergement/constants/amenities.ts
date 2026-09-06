export interface AmenityConstant {
  id: string;
  label: string;
  category: "comfort" | "media" | "facility" | "safety";
}

export const AMENITIES: AmenityConstant[] = [
  { id: "wifi", label: "WiFi Haut Débit", category: "media" },
  { id: "parking", label: "Parking gratuit sur place", category: "facility" },
  { id: "cuisine", label: "Cuisine équipée", category: "facility" },
  { id: "piscine", label: "Piscine privée ou partagée", category: "comfort" },
  { id: "climatisation", label: "Climatisation", category: "comfort" },
  { id: "tv", label: "Télévision connectée", category: "media" },
  { id: "gym", label: "Salle de sport", category: "facility" },
  { id: "animaux", label: "Animaux admis", category: "facility" },
  { id: "spa", label: "Espace bien-être / Spa", category: "comfort" },
];

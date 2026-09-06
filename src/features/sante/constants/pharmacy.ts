// src/features/sante/constants/pharmacy.ts
import type { PharmacyService } from "../types/pharmacy.types";

export const PHARMACY_SERVICES: {
  value: PharmacyService;
  label: string;
  icon: string;
}[] = [
  { value: "vente", label: "Vente de médicaments", icon: "💊" },
  { value: "ordonnances", label: "Préparation d'ordonnances", icon: "📋" },
  { value: "livraison", label: "Livraison à domicile", icon: "🚚" },
  { value: "conseil", label: "Conseil pharmaceutique", icon: "🗣️" },
  { value: "tension", label: "Prise de tension", icon: "🩺" },
  { value: "glycemie", label: "Glycémie", icon: "🩸" },
  { value: "pansements", label: "Pansements", icon: "🩹" },
  { value: "hygiene", label: "Hygiène", icon: "🧼" },
  { value: "parapharmacie", label: "Parapharmacie", icon: "🧴" },
  { value: "orthopedie", label: "Orthopédie", icon: "🦴" },
  { value: "dietetique", label: "Diététique", icon: "🥗" },
  { value: "telemedecine", label: "Télémédecine", icon: "📹" },
  { value: "vaccination", label: "Vaccination", icon: "💉" },
  { value: "depistage", label: "Dépistage", icon: "🧪" },
  {
    value: "location-materiel",
    label: "Location de matériel médical",
    icon: "🛏️",
  },
];

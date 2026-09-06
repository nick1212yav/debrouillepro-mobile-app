import type { AccommodationType } from "../types/accommodation.types";

export interface AccommodationTypeConstant {
  id: AccommodationType | string;
  label: string;
  description: string;
}

export const ACCOMMODATION_TYPES: AccommodationTypeConstant[] = [
  {
    id: "Appartement",
    label: "Appartement",
    description: "Logement entier dans un immeuble résidentiel.",
  },
  {
    id: "Villa",
    label: "Villa",
    description: "Maison individuelle de standing avec piscine ou jardin.",
  },
  {
    id: "Studio",
    label: "Studio",
    description: "Logement d'une seule pièce principale, entièrement meublé.",
  },
  {
    id: "Hôtel",
    label: "Chambre d'hôtel",
    description: "Chambre ou suite privée dans un établissement hôtelier.",
  },
  {
    id: "Colocation",
    label: "Colocation",
    description: "Chambre privée dans un logement partagé à plusieurs.",
  },
  {
    id: "Maison",
    label: "Maison",
    description: "Maison individuelle classique avec commodités.",
  },
];

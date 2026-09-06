// src/features/transport/constants/categories.ts
import {
  Car,
  Bus,
  Bike,
  Truck,
  Package,
  Users,
  Ship,
  Plane,
  Train,
  Wrench,
  Hospital,
  MapPin,
} from "lucide-react-native"; // ✅ Remplacement par Bike
import type { VehicleType } from "../types";

export interface TransportCategory {
  id:
    | VehicleType
    | "parcel"
    | "cargo"
    | "rental"
    | "private_driver"
    | "tow_truck"
    | "ambulance"
    | "boat"
    | "ferry"
    | "train"
    | "plane"
    | "helicopter"
    | "bike"
    | "scooter"
    | "water_taxi"
    | "shuttle_corporate"
    | "shuttle_school";
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  isOfferable: boolean;
  isBookable: boolean;
}

export const TRANSPORT_CATEGORIES: TransportCategory[] = [
  {
    id: "taxi",
    label: "Taxi",
    icon: Car,
    description: "Transport individuel urbain rapide.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "bus",
    label: "Bus Public",
    icon: Bus,
    description: "Transport en commun inter-villes ou long trajet.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "moto",
    label: "Moto-Taxi",
    icon: Bike,
    description: "Transport individuel agile en ville (Wewa/Zémidjan).",
    isOfferable: true,
    isBookable: true,
  }, // ✅ Utilisation de Bike
  {
    id: "minibus",
    label: "Minibus",
    icon: Bus,
    description:
      "Transport collectif pour petits groupes (Kombi/Esprit de vie).",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "voiture",
    label: "Covoiturage",
    icon: Users,
    description: "Partage de frais pour trajets réguliers ou occasionnels.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "camion",
    label: "Transport Marchandises",
    icon: Truck,
    description: "Transport de fret et marchandises lourdes.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "livraison",
    label: "Livraison Express",
    icon: Package,
    description: "Envoi rapide de colis et documents.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "parcel",
    label: "Colis",
    icon: Package,
    description: "Envoi de colis par le réseau DébrouillePro.",
    isOfferable: false,
    isBookable: true,
  },
  {
    id: "rental",
    label: "Location de Voiture",
    icon: Car,
    description: "Louez une voiture avec ou sans chauffeur.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "private_driver",
    label: "Chauffeur Privé",
    icon: Car,
    description: "Services de chauffeur personnel et VIP.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "boat",
    label: "Bateau / Pirogue",
    icon: Ship,
    description: "Transport fluvial et lacustre (ex: fleuve Congo).",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "ferry",
    label: "Ferry",
    icon: Ship,
    description:
      "Traversées maritimes ou lacustres (ex: Kinshasa-Brazzaville).",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "train",
    label: "Train",
    icon: Train,
    description: "Voyages longue distance par voie ferrée.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "plane",
    label: "Avion (Charters)",
    icon: Plane,
    description: "Vols charters et privés pour l'Afrique.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "tow_truck",
    label: "Dépannage / Remorquage",
    icon: Wrench,
    description: "Assistance routière et remorquage de véhicules.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "ambulance",
    label: "Ambulance",
    icon: Hospital,
    description: "Transport médicalisé d'urgence.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "bike",
    label: "Vélo",
    icon: Bike,
    description: "Location de vélos et services de cyclisme.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "scooter",
    label: "Trottinette Électrique",
    icon: Bike,
    description: "Location de trottinettes électriques (urbain).",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "water_taxi",
    label: "Taxi Fluvial",
    icon: Ship,
    description: "Transport rapide sur les voies navigables urbaines.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "shuttle_corporate",
    label: "Navette Entreprise",
    icon: Bus,
    description: "Transport régulier pour les employés d'entreprise.",
    isOfferable: true,
    isBookable: true,
  },
  {
    id: "shuttle_school",
    label: "Navette Scolaire",
    icon: Bus,
    description: "Transport sécurisé pour les écoliers.",
    isOfferable: true,
    isBookable: true,
  },
];

export function getCategoryLabel(id: TransportCategory["id"]): string {
  return TRANSPORT_CATEGORIES.find((cat) => cat.id === id)?.label || "Inconnu";
}

export function getCategoryIcon(
  id: TransportCategory["id"],
): React.ComponentType<{ size?: number; className?: string }> {
  return TRANSPORT_CATEGORIES.find((cat) => cat.id === id)?.icon || MapPin;
}

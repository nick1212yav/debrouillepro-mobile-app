// src/features/sante/subtypes.ts
import type { ModuleSubtype } from "@/core/sdk/types/manifest.types";

// Extension pour permettre fields en string[]
export interface SanteSubtype extends Omit<ModuleSubtype, "fields"> {
  fields?: string[]; // on remplace par string[]
  color?: string;
  detailComponent?: string;
  listComponent?: string;
  cardComponent?: string;
  searchEntity?: string | null;
  defaultSort?: string;
}

export const SANTE_SUBTYPES: SanteSubtype[] = [
  {
    value: "doctor",
    label: "Médecin",
    icon: "👨‍⚕️",
    color: "#EF4444",
    fields: ["name", "specialty", "fees", "rating", "online", "verified"],
    detailComponent: "SanteDetailPage",
    listComponent: "DoctorList",
    cardComponent: "DoctorCard",
    searchEntity: "doctor",
    defaultSort: "rating",
  },
  {
    value: "hospital",
    label: "Hôpital",
    icon: "🏥",
    color: "#3B82F6",
    fields: ["name", "type", "beds", "services", "emergency", "rating"],
    detailComponent: "HospitalDetailPage",
    listComponent: "HospitalList",
    cardComponent: "HospitalCard",
    searchEntity: "hospital",
    defaultSort: "rating",
  },
  {
    value: "pharmacy",
    label: "Pharmacie",
    icon: "💊",
    color: "#10B981",
    fields: ["name", "services", "delivery", "rating"],
    detailComponent: "PharmacyDetailPage",
    listComponent: "PharmacyList",
    cardComponent: "PharmacyCard",
    searchEntity: "pharmacy",
    defaultSort: "rating",
  },
  {
    value: "laboratory",
    label: "Laboratoire",
    icon: "🧪",
    color: "#8B5CF6",
    fields: ["name", "tests", "equipment", "rating"],
    detailComponent: "LaboratoryDetailPage",
    listComponent: "LaboratoryList",
    cardComponent: "LaboratoryCard",
    searchEntity: "laboratory",
    defaultSort: "rating",
  },
  {
    value: "emergency",
    label: "Urgence",
    icon: "🚑",
    color: "#EF4444",
    fields: ["name", "address", "phone", "distance"],
    detailComponent: "EmergencyPage",
    listComponent: "EmergencyList",
    cardComponent: "EmergencyCard",
    searchEntity: null,
  },
];

// src/features/sante/constants/hospitals.ts
import type { HospitalType, HospitalService } from "../types/hospital.types";

export const HOSPITAL_TYPES: { value: HospitalType; label: string }[] = [
  { value: "public", label: "Public" },
  { value: "private", label: "Privé" },
  { value: "university", label: "Universitaire" },
  { value: "military", label: "Militaire" },
  { value: "specialized", label: "Spécialisé" },
];

export const HOSPITAL_SERVICES: {
  value: HospitalService;
  label: string;
  icon: string;
}[] = [
  { value: "urgences", label: "Urgences", icon: "🚑" },
  { value: "cardiologie", label: "Cardiologie", icon: "❤️" },
  { value: "neurologie", label: "Neurologie", icon: "🧠" },
  { value: "pediatrie", label: "Pédiatrie", icon: "👶" },
  { value: "maternite", label: "Maternité", icon: "🤱" },
  { value: "gynecologie", label: "Gynécologie", icon: "👩" },
  { value: "orthopedie", label: "Orthopédie", icon: "🦴" },
  { value: "chirurgie-generale", label: "Chirurgie générale", icon: "🔪" },
  { value: "ophtalmologie", label: "Ophtalmologie", icon: "👁️" },
  { value: "dermatologie", label: "Dermatologie", icon: "🧴" },
  { value: "psychiatrie", label: "Psychiatrie", icon: "🧠" },
  { value: "reanimation", label: "Réanimation", icon: "🫀" },
  { value: "radiologie", label: "Radiologie", icon: "📸" },
  { value: "imagerie", label: "Imagerie médicale", icon: "📷" },
  { value: "laboratoire", label: "Laboratoire d'analyses", icon: "🧪" },
  { value: "bloc-operatoire", label: "Bloc opératoire", icon: "🏥" },
  { value: "endoscopie", label: "Endoscopie", icon: "🔬" },
  { value: "physiotherapie", label: "Physiothérapie", icon: "💪" },
  { value: "nutrition", label: "Nutrition", icon: "🥗" },
  { value: "oncologie", label: "Oncologie", icon: "🎗️" },
  { value: "hematologie", label: "Hématologie", icon: "🩸" },
  { value: "nephrologie", label: "Néphrologie", icon: "🫘" },
  { value: "pneumologie", label: "Pneumologie", icon: "🫁" },
  { value: "rhumatologie", label: "Rhumatologie", icon: "🦵" },
  { value: "medecine-interne", label: "Médecine interne", icon: "👨‍⚕️" },
];

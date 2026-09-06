// src/features/sante/constants/specialties.ts
import type { DoctorSpecialty } from "../types/doctor.types";

export const DOCTOR_SPECIALTIES: {
  value: DoctorSpecialty;
  label: string;
  icon: string;
  description: string;
}[] = [
  {
    value: "generaliste",
    label: "Médecin Généraliste",
    icon: "👨‍⚕️",
    description: "Soins primaires, suivi médical général",
  },
  {
    value: "cardiologue",
    label: "Cardiologue",
    icon: "❤️",
    description: "Maladies du cœur et des vaisseaux",
  },
  {
    value: "pediatre",
    label: "Pédiatre",
    icon: "👶",
    description: "Médecine des enfants et des adolescents",
  },
  {
    value: "gynecologue",
    label: "Gynécologue",
    icon: "👩",
    description: "Santé de la femme, grossesse",
  },
  {
    value: "dentiste",
    label: "Dentiste",
    icon: "🦷",
    description: "Soins dentaires, chirurgie buccale",
  },
  {
    value: "ophtalmologue",
    label: "Ophtalmologue",
    icon: "👁️",
    description: "Maladies des yeux, vision",
  },
  {
    value: "dermatologue",
    label: "Dermatologue",
    icon: "🧴",
    description: "Maladies de la peau, cheveux, ongles",
  },
  {
    value: "psychiatre",
    label: "Psychiatre",
    icon: "🧠",
    description: "Troubles mentaux, psychiatrie",
  },
  {
    value: "neurologue",
    label: "Neurologue",
    icon: "🧬",
    description: "Maladies du système nerveux",
  },
  {
    value: "chirurgien",
    label: "Chirurgien",
    icon: "🔪",
    description: "Chirurgie générale et spécialisée",
  },
  {
    value: "orthopediste",
    label: "Orthopédiste",
    icon: "🦴",
    description: "Troubles de l'appareil locomoteur",
  },
  {
    value: "orl",
    label: "ORL",
    icon: "👂",
    description: "Oreille, nez, gorge",
  },
  {
    value: "urologue",
    label: "Urologue",
    icon: "🧻",
    description: "Appareil urinaire, reins, prostate",
  },
  {
    value: "endocrinologue",
    label: "Endocrinologue",
    icon: "🧪",
    description: "Hormones, diabète, thyroïde",
  },
  {
    value: "gastro-enterologue",
    label: "Gastro-entérologue",
    icon: "🍽️",
    description: "Appareil digestif, foie",
  },
  {
    value: "pneumologue",
    label: "Pneumologue",
    icon: "🫁",
    description: "Maladies respiratoires",
  },
  {
    value: "rhumatologue",
    label: "Rhumatologue",
    icon: "🦵",
    description: "Arthrite, maladies inflammatoires",
  },
  {
    value: "allergologue",
    label: "Allergologue",
    icon: "🤧",
    description: "Allergies, asthme",
  },
  {
    value: "nutritionniste",
    label: "Nutritionniste",
    icon: "🥗",
    description: "Conseil en nutrition, régimes",
  },
  {
    value: "psychologue",
    label: "Psychologue",
    icon: "🗣️",
    description: "Psychothérapie, accompagnement",
  },
];

export const SPECIALTY_LABELS: Record<DoctorSpecialty, string> = {
  generaliste: "Médecin Généraliste",
  cardiologue: "Cardiologue",
  pediatre: "Pédiatre",
  gynecologue: "Gynécologue",
  dentiste: "Dentiste",
  ophtalmologue: "Ophtalmologue",
  dermatologue: "Dermatologue",
  psychiatre: "Psychiatre",
  neurologue: "Neurologue",
  chirurgien: "Chirurgien",
  orthopediste: "Orthopédiste",
  orl: "ORL",
  urologue: "Urologue",
  endocrinologue: "Endocrinologue",
  "gastro-enterologue": "Gastro-entérologue",
  pneumologue: "Pneumologue",
  rhumatologue: "Rhumatologue",
  allergologue: "Allergologue",
  nutritionniste: "Nutritionniste",
  psychologue: "Psychologue",
};

// src/features/sante/constants/emergency.ts
import type { EmergencyType } from "../types/emergency.types";

export interface EmergencyNumber {
  label: string;
  number: string;
  emoji: string;
  color: string;
  description: string;
}

export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  {
    label: "SAMU",
    number: "15",
    emoji: "🚑",
    color: "#EF4444",
    description: "Urgences médicales",
  },
  {
    label: "Pompiers",
    number: "18",
    emoji: "🔥",
    color: "#F97316",
    description: "Secours & incendie",
  },
  {
    label: "Police",
    number: "17",
    emoji: "🚔",
    color: "#3B82F6",
    description: "Sécurité publique",
  },
  {
    label: "Croix-Rouge",
    number: "1515",
    emoji: "❤️",
    color: "#EF4444",
    description: "Aide humanitaire",
  },
];

export const EMERGENCY_TYPES: {
  value: EmergencyType;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { value: "medical", label: "Médical", emoji: "🚑", color: "#EF4444" },
  { value: "fire", label: "Incendie", emoji: "🔥", color: "#F97316" },
  { value: "police", label: "Police", emoji: "🚔", color: "#3B82F6" },
  { value: "accident", label: "Accident", emoji: "🚗", color: "#F59E0B" },
  {
    value: "natural-disaster",
    label: "Catastrophe naturelle",
    emoji: "🌊",
    color: "#8B5CF6",
  },
];

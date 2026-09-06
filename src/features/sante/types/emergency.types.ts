// src/features/sante/types/emergency.types.ts
export type EmergencyType =
  | "medical"
  | "fire"
  | "police"
  | "accident"
  | "natural-disaster";
export type EmergencySeverity = "low" | "moderate" | "high" | "critical";

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relation: string;
  isPrimary: boolean;
  notificationsEnabled: boolean;
}

export interface EmergencyCenter {
  _id: string;
  name: string;
  address: string;
  phone: string;
  type: "hospital" | "clinic" | "ambulance" | "fire-station" | "police-station";
  distance: number;
  eta: number;
  open: boolean;
  latitude: number;
  longitude: number;
  services?: string[];
  rating?: number;
}

export interface EmergencyNumber {
  label: string;
  number: string;
  emoji: string;
  color: string;
  description: string;
}

export interface EmergencyAdvice {
  situation: string;
  immediateActions: string[];
  doNot: string[];
  whenToCall: string;
  resources: string[];
}

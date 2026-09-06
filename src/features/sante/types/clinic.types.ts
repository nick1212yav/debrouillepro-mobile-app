// src/features/sante/types/clinic.types.ts

import type { Address, Contact, Rating, AuditFields } from "./common.types";

export interface Clinic extends AuditFields, Address, Contact {
  name: string;
  emergency: boolean;
  open: boolean;
  hours?: string;
  specialties?: string[];
  description?: string;
  rating?: Rating;
  // Affichage
  displayName?: string;
  fullAddress?: string;
}

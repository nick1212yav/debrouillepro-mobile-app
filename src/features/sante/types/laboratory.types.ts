// src/features/sante/types/laboratory.types.ts

import type { Address, Contact, Rating, AuditFields } from "./common.types";

export interface Laboratory extends AuditFields, Address, Contact {
  name: string;
  open: boolean;
  hours?: string;
  tests: number;
  equipment?: number;
  testsList?: string[];
  rating?: Rating;
  // Affichage
  displayName?: string;
  fullAddress?: string;
}

// src/features/sante/validators/emergency.validator.ts

import { z } from "zod";

// ─── Enums ────────────────────────────────────────────────

export const emergencyTypeEnum = z.enum([
  "ambulance",
  "fire",
  "police",
  "poison",
  "general",
]);

// ─── Schémas ──────────────────────────────────────────────

export const emergencyNumberSchema = z.object({
  label: z.string().min(1),
  number: z.string().min(1),
  type: emergencyTypeEnum,
});

export const emergencyAdviceSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  steps: z.array(z.string().min(1)),
});

export const emergencyContactSchema = z.object({
  name: z.string().min(1),
  relation: z.string().min(1),
  phone: z.string().min(1),
  isPrimary: z.boolean().optional(),
});

export const emergencyCenterSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  type: z.string().min(1),
  distance: z.number().min(0),
  eta: z.number().min(0),
  open: z.boolean().default(true),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ─── Types inférés ────────────────────────────────────────

export type EmergencyNumber = z.infer<typeof emergencyNumberSchema>;
export type EmergencyType = z.infer<typeof emergencyTypeEnum>;
export type EmergencyAdvice = z.infer<typeof emergencyAdviceSchema>;
export type EmergencyContact = z.infer<typeof emergencyContactSchema>;
export type EmergencyCenter = z.infer<typeof emergencyCenterSchema>;

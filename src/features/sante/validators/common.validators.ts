// src/features/sante/validators/common.validators.ts

import { z } from "zod";

// ─── Objets partagés ─────────────────────────────────────

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const addressSchema = z.object({
  street: z.string().min(1, "La rue est requise"),
  city: z.string().min(1, "La ville est requise"),
  state: z.string().optional(),
  country: z.string().min(1, "Le pays est requis"),
  zipCode: z.string().optional(),
  coordinates: coordinatesSchema.optional(),
});

export const contactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email("Email invalide").optional(),
  website: z.string().url("URL invalide").optional(),
});

export const ratingSchema = z.object({
  average: z.number().min(0).max(5),
  count: z.number().int().min(0),
  distribution: z.record(z.number().int()).optional(),
});

export const badgeSchema = z.object({
  label: z.string().min(1),
  icon: z.enum(["verified", "emergency", "top", "expert", "recommended"]),
  color: z.string().optional(),
});

export const openingHoursSchema = z.object({
  day: z.string().min(1),
  open: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM attendu"),
  close: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format HH:MM attendu"),
  closed: z.boolean().optional(),
});

export const auditFieldsSchema = z.object({
  _id: z.string().optional(),
  _creationTime: z.number().optional(),
});

// ─── Types inférés ────────────────────────────────────────

export type Address = z.infer<typeof addressSchema>;
export type Contact = z.infer<typeof contactSchema>;
export type Rating = z.infer<typeof ratingSchema>;
export type Badge = z.infer<typeof badgeSchema>;
export type OpeningHours = z.infer<typeof openingHoursSchema>;
export type AuditFields = z.infer<typeof auditFieldsSchema>;

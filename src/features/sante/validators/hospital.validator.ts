import { z } from "zod";

export const hospitalSchema = z.object({
  phone: z.string().min(1, "Téléphone requis"),
  name: z.string().min(2, "Nom requis"),
  type: z.string().min(1, "Type requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  address: z.string().min(1, "Adresse requise"),
  open: z.boolean().default(true),
  hours: z.string().default("24h/24"),
  priceRange: z.string().default("$$"),
  beds: z.number().positive("Nombre de lits requis"),
  doctors: z.number().positive().default(0),
  specialties: z.number().positive().default(0),
  emergency: z.boolean().default(true),
  parking: z.boolean().default(true),
  pharmacy: z.boolean().default(false),
  cafeteria: z.boolean().default(false),
  wifi: z.boolean().default(true),
  email: z.string().email("Email invalide").optional(),
  website: z.string().url("URL invalide").optional(),
  description: z.string().optional(),
  services: z.string().optional(),
});

export type HospitalFormValues = z.infer<typeof hospitalSchema>;

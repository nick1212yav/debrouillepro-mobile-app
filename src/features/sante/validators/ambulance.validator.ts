import { z } from "zod";

export const ambulanceSchema = z.object({
  name: z.string().min(2, "Nom requis"),
  phone: z.string().min(1, "Téléphone requis"),
  address: z.string().min(1, "Adresse requise"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  hours: z.string().default("24h/24"),
  emergencyPhone: z.string().default("15"),
  available: z.boolean().default(true),
  vehicles: z.number().positive().default(1),
  paramedics: z.number().positive().default(0),
});

export type AmbulanceFormValues = z.infer<typeof ambulanceSchema>;

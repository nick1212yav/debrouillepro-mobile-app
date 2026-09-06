import { z } from "zod";

export const laboratorySchema = z.object({
  phone: z.string().min(1, "Téléphone requis"),
  name: z.string().min(2, "Nom requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  address: z.string().min(1, "Adresse requise"),
  open: z.boolean().default(true),
  hours: z.string().default("Lun-Ven 07:00 - 18:00"),
  tests: z.number().positive().default(0),
  equipment: z.number().positive().default(0),
  email: z.string().email("Email invalide").optional(),
  testsList: z.string().optional(),
});

export type LaboratoryFormValues = z.infer<typeof laboratorySchema>;

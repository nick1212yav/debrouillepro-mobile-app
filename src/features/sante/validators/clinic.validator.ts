import { z } from "zod";

export const clinicSchema = z.object({
  phone: z.string().min(1, "Téléphone requis"),
  name: z.string().min(2, "Nom requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  address: z.string().min(1, "Adresse requise"),
  open: z.boolean().default(true),
  hours: z.string().default("Lun-Ven 08:00 - 19:00"),
  emergency: z.boolean().default(false),
  email: z.string().email("Email invalide").optional(),
  description: z.string().optional(),
  specialties: z.string().optional(),
});

export type ClinicFormValues = z.infer<typeof clinicSchema>;

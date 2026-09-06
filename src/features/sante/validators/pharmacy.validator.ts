import { z } from "zod";

export const pharmacySchema = z.object({
  phone: z.string().min(1, "Téléphone requis"),
  name: z.string().min(2, "Nom requis"),
  city: z.string().min(1, "Ville requise"),
  country: z.string().min(1, "Pays requis"),
  address: z.string().min(1, "Adresse requise"),
  delivery: z.boolean().default(false),
  open: z.boolean().default(true),
  hours: z.string().default("Lun-Ven 08:00 - 20:00"),
  onlineOrders: z.boolean().default(true),
  acceptsInsurance: z.boolean().default(false),
  email: z.string().email("Email invalide").optional(),
  services: z.string().optional(),
  deliveryRadius: z.number().optional(),
  deliveryFee: z.number().optional(),
});

export type PharmacyFormValues = z.infer<typeof pharmacySchema>;

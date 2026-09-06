// src/features/transport/validators/moto.validator.ts
import { z } from "zod";

export const motoFormSchema = z.object({
  driverName: z
    .string()
    .min(2, "Nom du conducteur requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  motoModel: z
    .string()
    .min(2, "Modèle de moto requis (ex: Senke, TVS, Haojin)"),
  licensePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  pricePerKm: z.coerce.number().min(0, "Le prix par km doit être positif"),
  currency: z.string(),
  helmetProvided: z.boolean(),
  insuranceActive: z.boolean(),
  operatingZone: z.string().min(2, "Zone d'activité requise"),
});

export type MotoFormValues = z.infer<typeof motoFormSchema>;

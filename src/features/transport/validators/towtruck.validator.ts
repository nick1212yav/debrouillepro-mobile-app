// src/features/transport/validators/towtruck.validator.ts
import { z } from "zod";

export const towtruckFormSchema = z.object({
  providerName: z.string().min(2, "Nom du service d'assistance requis"),
  phone: z.string().min(8, "Numéro de téléphone d'urgence requis"),
  vehicleModel: z
    .string()
    .min(2, "Modèle du camion-grue requis (ex: Iveco, Renault Midlum)"),
  licensePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  basePrice: z.coerce
    .number()
    .min(0, "Le prix d'intervention de base doit être positif"),
  pricePerKm: z.coerce
    .number()
    .min(0, "Le tarif de remorquage au km doit être positif"),
  currency: z.string(),
  maxTonnage: z.coerce
    .number()
    .min(1, "Capacité de levage minimale de 1 tonne"),
  operatingZone: z.string().min(2, "Zone de service d'assistance requise"),
});

export type TowTruckFormValues = z.infer<typeof towtruckFormSchema>;

// src/features/transport/validators/truck.validator.ts
import { z } from "zod";

export const truckFormSchema = z.object({
  companyName: z.string().min(2, "Nom de la société requis"),
  phone: z.string().min(8, "Téléphone requis"),
  truckModel: z
    .string()
    .min(2, "Modèle du camion requis (ex: Volvo FMX, Mercedes Actros)"),
  capacityTons: z.coerce
    .number()
    .min(1, "La capacité doit être d'au moins 1 tonne"),
  licensePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  basePrice: z.coerce
    .number()
    .min(0, "Le tarif de prise en charge doit être positif"),
  pricePerKm: z.coerce.number().min(0, "Le tarif par km doit être positif"),
  currency: z.string(),
  cargoType: z.enum([
    "general",
    "refrigerated",
    "liquid",
    "oversized",
    "moving",
  ] as const),
  operatingArea: z
    .string()
    .min(2, "Zone de service requise (ex: Inter-urbain, National)"),
});

export type TruckFormValues = z.infer<typeof truckFormSchema>;

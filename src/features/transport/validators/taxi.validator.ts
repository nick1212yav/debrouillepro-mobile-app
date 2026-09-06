// src/features/transport/validators/taxi.validator.ts
import { z } from "zod";

export const taxiFormSchema = z.object({
  driverName: z
    .string()
    .min(2, "Nom du chauffeur requis (minimum 2 caractères)"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  vehicleModel: z
    .string()
    .min(2, "Modèle du véhicule requis (ex: Toyota Corolla)"),
  vehiclePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  basePrice: z.coerce
    .number()
    .min(0, "Le prix de prise en charge doit être positif"),
  pricePerKm: z.coerce
    .number()
    .min(0, "Le prix par kilomètre doit être positif"),
  currency: z.string(),
  city: z.string().min(2, "Ville de service requise"),
  availability: z.string(),
});

export type TaxiFormValues = z.infer<typeof taxiFormSchema>;

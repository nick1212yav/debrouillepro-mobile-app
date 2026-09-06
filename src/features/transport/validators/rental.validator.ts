// src/features/transport/validators/rental.validator.ts
import { z } from "zod";

export const rentalFormSchema = z.object({
  agencyName: z.string().min(2, "Nom de l'agence ou du propriétaire requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  vehicleModel: z.string().min(2, "Marque et modèle requis"),
  vehiclePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  dailyPrice: z.coerce.number().min(0, "Le prix journalier doit être positif"),
  currency: z.string(),
  hasDriver: z.boolean(), // Location avec chauffeur inclus
  fuelPolicy: z.enum(["full_to_full", "same_to_same", "included"] as const),
  securityDeposit: z.coerce
    .number()
    .min(0, "La caution de garantie doit être supérieure ou égale à 0"),
  description: z.string().optional().or(z.literal("")),
});

export type RentalFormValues = z.infer<typeof rentalFormSchema>;

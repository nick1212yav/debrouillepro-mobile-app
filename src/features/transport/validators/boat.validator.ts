// src/features/transport/validators/boat.validator.ts
import { z } from "zod";

export const boatFormSchema = z.object({
  operatorName: z
    .string()
    .min(2, "Nom de l'opérateur ou de la compagnie requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  boatName: z
    .string()
    .min(2, "Nom du bateau ou de la pirogue motorisée requis"),
  boatType: z.enum([
    "ferry",
    "water_taxi",
    "speedboat",
    "pirogue_motorized",
  ] as const),
  capacity: z.coerce
    .number()
    .min(1, "La capacité doit être d'au moins 1 passager"),
  pricePerSeat: z.coerce.number().min(0, "Le prix par place doit être positif"),
  currency: z.string(),
  lifeJacketsProvided: z.boolean(), // Gilets de sauvetage obligatoires
  originPort: z.string().min(2, "Port de départ requis"),
  destinationPort: z.string().min(2, "Port d'arrivée requis"),
  departureTime: z.string().min(1, "Heure de départ requise"),
  description: z.string().optional().or(z.literal("")),
});

export type BoatFormValues = z.infer<typeof boatFormSchema>;

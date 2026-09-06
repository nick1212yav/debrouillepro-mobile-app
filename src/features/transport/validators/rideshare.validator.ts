// src/features/transport/validators/rideshare.validator.ts
import { z } from "zod";

export const rideshareFormSchema = z.object({
  origin: z.string().min(2, "Lieu de départ requis"),
  destination: z.string().min(2, "Lieu d'arrivée requis"),
  departureDate: z.string().min(1, "Veuillez sélectionner une date"),
  departureTime: z.string().min(1, "Veuillez spécifier l'heure de départ"),
  seats: z.coerce.number().min(1, "Au moins 1 place disponible requise"),
  pricePerSeat: z.coerce.number().min(0, "Le prix par place doit être positif"),
  currency: z.string(),
  description: z.string().optional().or(z.literal("")),
});

export type RideShareFormValues = z.infer<typeof rideshareFormSchema>;

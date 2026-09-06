// src/features/transport/validators/train.validator.ts
import { z } from "zod";

export const trainFormSchema = z.object({
  operatorName: z
    .string()
    .min(2, "Nom de la compagnie ou de la régie ferroviaire requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  trainNumber: z.string().min(1, "Numéro du train requis (ex: Express 502)"),
  originStation: z.string().min(2, "Gare de départ requise"),
  destinationStation: z.string().min(2, "Gare d'arrivée requise"),
  departureTime: z.string().min(1, "Heure de départ requise"),
  priceFirstClass: z.coerce
    .number()
    .min(0, "Le prix 1ère classe doit être positif"),
  priceSecondClass: z.coerce
    .number()
    .min(0, "Le prix 2ème classe doit être positif"),
  currency: z.string(),
  totalSeats: z.coerce
    .number()
    .min(50, "La capacité minimale d'un train est de 50 places"),
  description: z.string().optional().or(z.literal("")),
});

export type TrainFormValues = z.infer<typeof trainFormSchema>;

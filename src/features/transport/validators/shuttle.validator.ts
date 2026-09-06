// src/features/transport/validators/shuttle.validator.ts
import { z } from "zod";

export const shuttleFormSchema = z.object({
  serviceName: z.string().min(2, "Nom du service de navette requis"),
  phone: z.string().min(8, "Numéro de téléphone requis"),
  vehicleModel: z.string().min(2, "Modèle du minibus requis"),
  licensePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  shuttleType: z.enum(["corporate", "school", "community"] as const),
  capacity: z.coerce
    .number()
    .min(5, "Capacité minimale de 5 places pour une navette"),
  pricePerMonth: z.coerce
    .number()
    .min(0, "Le tarif mensuel d'abonnement doit être positif"),
  currency: z.string(),
  operatingRoute: z
    .string()
    .min(2, "Veuillez décrire le trajet (ex: Kasa-Vubu - Gombe)"),
});

export type ShuttleFormValues = z.infer<typeof shuttleFormSchema>;

// src/features/transport/validators/ambulance.validator.ts
import { z } from "zod";

export const ambulanceFormSchema = z.object({
  hospitalName: z.string().min(2, "Nom de l'hôpital ou du service requis"),
  phone: z.string().min(8, "Numéro de téléphone d'urgence requis"),
  vehicleModel: z
    .string()
    .min(2, "Modèle d'ambulance requis (ex: Mercedes Sprinter, Fiat Ducato)"),
  licensePlate: z.string().min(3, "Plaque d'immatriculation requise"),
  operatingZone: z.string().min(2, "Zone de couverture active requise"),
  hasParamedics: z.boolean(), // Personnel médical qualifié à bord
  equipmentList: z
    .string()
    .min(
      2,
      "Veuillez spécifier l'équipement médical à bord (Oxygène, Défibrillateur...)",
    ),
});

export type AmbulanceFormValues = z.infer<typeof ambulanceFormSchema>;

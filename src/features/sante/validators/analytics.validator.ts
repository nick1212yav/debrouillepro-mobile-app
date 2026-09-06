// src/features/sante/validators/analytics.validator.ts
import { z } from "zod";
// ✅ On importe depuis le fichier d'analyse, mais on ne le réexporte pas depuis celui-ci.
// Le schéma est déjà défini dans appointment.validator, on l'utilise ici.
// On exporte nos propres schémas.

// Schéma pour les statistiques des médecins
export const doctorStatisticsSchema = z.object({
  patients: z.number(),
  appointments: z.number(),
  yearsExperience: z.number(),
  satisfactionScore: z.number(),
  responseRate: z.number(),
  averageResponseTime: z.number(),
  completedConsultations: z.number(),
  cancellationRate: z.number(),
});

export const revenueStatsSchema = z.object({
  totalRevenue: z.number(),
  averageRevenuePerConsultation: z.number(),
  totalTransactions: z.number(),
  paymentMethodBreakdown: z.array(
    z.object({
      method: z.string(),
      amount: z.number(),
      count: z.number(),
    }),
  ),
  refunds: z.number(),
  netRevenue: z.number(),
});

// ✅ Si nécessaire, on peut réexporter le schéma depuis appointment.validator
// mais ce n'est pas obligatoire si on l'exporte déjà ailleurs.
// On peut ajouter une exportation conditionnelle si besoin.

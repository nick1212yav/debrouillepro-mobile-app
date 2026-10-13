// convex/crons.ts
//
// Cron jobs Convex. Ne duplique aucune logique métier :
// chaque cron appelle une internalMutation définie dans son module d'origine.

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Nettoyage périodique des stories expirées.
 *
 * - Supprime uniquement les stories expirées ET non-highlight
 * - Nettoie les storyViews associées
 * - Batché à 100 stories par exécution (voir stories.cleanupExpiredStories)
 *
 * Fréquence horaire : la fonction est idempotente et bornée.
 */
crons.interval(
  "cleanup expired stories",
  { hours: 1 },
  internal.stories.cleanupExpiredStories,
);

/**
 * Génération automatique des réservations récurrentes Services.
 *
 * - Cherche les récurrences actives dont `nextOccurrence <= now`
 * - Génère un `serviceBooking` réel (status: "pending") pour chacune
 * - Politique de rattrapage : skip silencieux au-delà de 48h de retard
 * - Batché à 50 par exécution
 *
 * Fréquence 15 min : idempotent par construction (chaque appel avance
 * `nextOccurrence` ou désactive la récurrence).
 */
crons.interval(
  "process due recurring bookings",
  { minutes: 15 },
  internal.services.recurring.processDueRecurringsInternal,
  { maxBatch: 50 },
);

export default crons;

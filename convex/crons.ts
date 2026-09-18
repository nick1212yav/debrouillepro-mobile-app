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

export default crons;

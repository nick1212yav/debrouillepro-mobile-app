// convex/migrations/backfillShortVideoCity.ts

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Débrouille Pro — Backfill shortVideos.city
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Objectif :
 *   Remplir `shortVideos.city` pour les vidéos historiques qui n'ont pas
 *   encore de ville.
 *
 * Source de vérité :
 *   shortVideos.authorId → users._id → users.city
 *
 * Principes :
 *   - idempotent
 *   - aucun écrasement d'une city déjà présente
 *   - aucune ville inventée
 *   - aucune coordonnée utilisée
 *   - pagination native Convex
 *   - traitement par lots
 *   - auto-planification jusqu'à la fin
 *   - aucun `any`
 *   - aucun cast
 * ─────────────────────────────────────────────────────────────────────────────
 */

const BATCH_SIZE = 50;

export const run = internalMutation({
  args: {
    cursor: v.optional(v.union(v.string(), v.null())),
  },

  handler: async (ctx, args) => {
    const result = await ctx.db.query("shortVideos").paginate({
      cursor: args.cursor ?? null,
      numItems: BATCH_SIZE,
    });

    let patched = 0;
    let skipped = 0;

    for (const video of result.page) {
      /**
       * Une vidéo déjà migrée ne doit jamais être écrasée.
       */
      if (video.city !== undefined) {
        skipped += 1;
        continue;
      }

      /**
       * `shortVideos.authorId` est une référence native vers `users`.
       * Aucun cast n'est nécessaire.
       */
      const author = await ctx.db.get(video.authorId);

      /**
       * Une absence de ville sur le profil signifie simplement :
       * cette vidéo reste sans city et continuera d'être disponible
       * dans le feed global.
       */
      const city = author?.city?.trim();

      if (!city) {
        skipped += 1;
        continue;
      }

      await ctx.db.patch(video._id, {
        city,
      });

      patched += 1;
    }

    /**
     * Si des documents restent à traiter, on programme automatiquement
     * le lot suivant.
     */
    if (!result.isDone) {
      await ctx.scheduler.runAfter(
        0,
        internal.migrations.backfillShortVideoCity.run,
        {
          cursor: result.continueCursor,
        },
      );
    }

    return {
      processed: result.page.length,
      patched,
      skipped,
      isDone: result.isDone,
    };
  },
});

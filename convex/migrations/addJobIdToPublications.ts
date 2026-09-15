import { mutation } from "../_generated/server";

export const addJobIdToPublications = mutation({
  args: {},
  handler: async (ctx) => {
    // Récupérer toutes les publications de type "job"
    const publications = await ctx.db
      .query("publications")
      .withIndex("by_type", (q) => q.eq("type", "job"))
      .collect();

    let migratedCount = 0;

    for (const pub of publications) {
      // Parser `meta` (qui peut être une string JSON ou un objet)
      let meta: Record<string, any> = {};
      if (typeof pub.meta === "string") {
        try {
          meta = JSON.parse(pub.meta);
        } catch {
          // Si le parsing échoue, on laisse meta vide
        }
      } else if (pub.meta && typeof pub.meta === "object") {
        meta = pub.meta as Record<string, any>;
      }

      // Si meta contient déjà un jobId, on passe
      if (meta.jobId) {
        continue;
      }

      // Recherche d'un jobListing correspondant (par auteur et titre)
      const jobs = await ctx.db
        .query("jobListings")
        .withIndex("by_employer", (q) => q.eq("employerId", pub.authorId))
        .collect();

      const matchedJob = jobs.find((j) => j.title === pub.title);

      if (matchedJob) {
        meta.jobId = matchedJob._id;
        await ctx.db.patch(pub._id, { meta: JSON.stringify(meta) });
        console.log(`✅ Migration: ${pub._id} → jobId ${matchedJob._id}`);
        migratedCount++;
      } else {
        console.log(
          `⚠️ Aucun job trouvé pour la publication ${pub._id} (${pub.title})`,
        );
      }
    }

    return { migrated: migratedCount };
  },
});

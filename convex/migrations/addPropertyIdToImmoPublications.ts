// convex/migrations/addPropertyIdToImmoPublications.ts
import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const addPropertyIdToImmoPublications = mutation({
  args: {},
  handler: async (ctx) => {
    // Récupérer toutes les publications de type "immo"
    const publications = await ctx.db
      .query("publications")
      .withIndex("by_type", (q) => q.eq("type", "immo"))
      .collect();

    let migrated = 0;

    for (const pub of publications) {
      // Si meta est déjà une chaîne contenant "propertyId", on saute
      if (
        pub.meta &&
        typeof pub.meta === "string" &&
        pub.meta.includes("propertyId")
      ) {
        continue;
      }

      // Chercher la propriété correspondante (par titre et auteur)
      const properties = await ctx.db
        .query("properties")
        .withIndex("by_owner", (q) => q.eq("ownerId", pub.authorId))
        .collect();

      const matchedProperty = properties.find((p) => p.title === pub.title);

      if (matchedProperty) {
        // Parser le meta existant
        let meta: any = {};
        if (pub.meta) {
          try {
            meta =
              typeof pub.meta === "string" ? JSON.parse(pub.meta) : pub.meta;
          } catch {
            meta = {};
          }
        }

        // Ajouter propertyId
        meta.propertyId = matchedProperty._id;

        // Mettre à jour la publication
        await ctx.db.patch(pub._id, {
          meta: JSON.stringify(meta),
        });

        migrated++;
      }
    }

    return { migrated };
  },
});

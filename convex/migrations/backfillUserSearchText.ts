// convex/migrations/backfillUserSearchText.ts

import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { buildUserSearchText } from "../lib/userSearch";

const DEFAULT_BATCH_SIZE = 100;
const MAX_BATCH_SIZE = 250;

export const backfillUserSearchText = mutation({
  args: {
    cursor: v.optional(v.string()),
    batchSize: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Authentification requise");
    }

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!currentUser?.isAdmin) {
      throw new Error("Accès administrateur requis");
    }

    const batchSize = Math.min(
      Math.max(args.batchSize ?? DEFAULT_BATCH_SIZE, 1),
      MAX_BATCH_SIZE,
    );

    const cursor = args.cursor ?? null;

    const page = await ctx.db.query("users").order("asc").paginate({
      cursor,
      numItems: batchSize,
    });

    let updated = 0;
    let unchanged = 0;

    for (const user of page.page) {
      const searchText = buildUserSearchText({
        name: user.name,
        bio: user.bio,
        city: user.city,
        country: user.country,
        profession: user.profession,
        interests: user.interests,
        roles: user.roles,
      });

      if (user.searchText === searchText) {
        unchanged += 1;
        continue;
      }

      await ctx.db.patch(user._id, {
        searchText,
      });

      updated += 1;
    }

    return {
      updated,
      unchanged,
      processed: page.page.length,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
    };
  },
});

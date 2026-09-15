import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc } from "./_generated/dataModel.d.ts";

// Default preferences applied to every new user
const DEFAULTS: Omit<Doc<"userPreferences">, "_id" | "_creationTime" | "userId"> = {
  theme: "dark",
  language: "fr",
  notifMessages: true,
  notifPublications: true,
  notifSystem: true,
  notifSounds: true,
  feedCategories: [],          // empty = show all
  favoriteModules: [],
  profilePublic: true,
  showEmail: false,
  reducedMotion: false,
  compactMode: false,
};

// Returns the current user's preferences, creating defaults if none exist.
export const get = query({
  args: {},
  handler: async (ctx): Promise<Doc<"userPreferences"> | null> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) return null;

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    return existing;
  },
});

// Upserts the current user's preferences.
export const upsert = mutation({
  args: {
    theme: v.optional(v.union(v.literal("dark"), v.literal("light"), v.literal("system"))),
    language: v.optional(v.union(v.literal("fr"), v.literal("en"), v.literal("ar"))),
    notifMessages: v.optional(v.boolean()),
    notifPublications: v.optional(v.boolean()),
    notifSystem: v.optional(v.boolean()),
    notifSounds: v.optional(v.boolean()),
    feedCategories: v.optional(v.array(v.string())),
    favoriteModules: v.optional(v.array(v.string())),
    profilePublic: v.optional(v.boolean()),
    showEmail: v.optional(v.boolean()),
    reducedMotion: v.optional(v.boolean()),
    compactMode: v.optional(v.boolean()),
    accentColor: v.optional(v.union(
      v.literal("violet"), v.literal("bleu"), v.literal("vert"),
      v.literal("orange"), v.literal("rose"), v.literal("dore"),
    )),
    textSize: v.optional(v.union(v.literal("petit"), v.literal("normal"), v.literal("grand"))),
    density: v.optional(v.union(v.literal("compact"), v.literal("confortable"))),
    colorBlindMode: v.optional(v.union(
      v.literal("none"), v.literal("deuteranopia"), v.literal("protanopia"),
      v.literal("tritanopia"), v.literal("achromatopsia"),
    )),
    highContrast: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    // Build patch — only include explicitly passed keys
    const patch: Partial<Omit<Doc<"userPreferences">, "_id" | "_creationTime">> = {};
    if (args.theme !== undefined) patch.theme = args.theme;
    if (args.language !== undefined) patch.language = args.language;
    if (args.notifMessages !== undefined) patch.notifMessages = args.notifMessages;
    if (args.notifPublications !== undefined) patch.notifPublications = args.notifPublications;
    if (args.notifSystem !== undefined) patch.notifSystem = args.notifSystem;
    if (args.notifSounds !== undefined) patch.notifSounds = args.notifSounds;
    if (args.feedCategories !== undefined) patch.feedCategories = args.feedCategories;
    if (args.favoriteModules !== undefined) patch.favoriteModules = args.favoriteModules;
    if (args.profilePublic !== undefined) patch.profilePublic = args.profilePublic;
    if (args.showEmail !== undefined) patch.showEmail = args.showEmail;
    if (args.reducedMotion !== undefined) patch.reducedMotion = args.reducedMotion;
    if (args.compactMode !== undefined) patch.compactMode = args.compactMode;
    if (args.accentColor !== undefined) patch.accentColor = args.accentColor;
    if (args.textSize !== undefined) patch.textSize = args.textSize;
    if (args.density !== undefined) patch.density = args.density;
    if (args.colorBlindMode !== undefined) patch.colorBlindMode = args.colorBlindMode;
    if (args.highContrast !== undefined) patch.highContrast = args.highContrast;

    if (existing) {
      await ctx.db.patch(existing._id, patch);
    } else {
      await ctx.db.insert("userPreferences", {
        userId: user._id,
        ...DEFAULTS,
        ...patch,
      });
    }
  },
});

// Toggle a single module as favourite
export const toggleFavoriteModule = mutation({
  args: { moduleId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Not logged in" });

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .unique();
    if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "User not found" });

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    const current = existing?.favoriteModules ?? [];
    const updated = current.includes(args.moduleId)
      ? current.filter((m) => m !== args.moduleId)
      : [...current, args.moduleId];

    if (existing) {
      await ctx.db.patch(existing._id, { favoriteModules: updated });
    } else {
      await ctx.db.insert("userPreferences", { userId: user._id, ...DEFAULTS, favoriteModules: updated });
    }
    return updated;
  },
});

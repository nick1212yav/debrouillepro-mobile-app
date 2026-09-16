import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  }

  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGAL CASES (Juridique / Justice)
// ─────────────────────────────────────────────────────────────────────────────

export const getMyCases = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return ctx.db
      .query("legalCases")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
  },
});

export const createLegalCase = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("civil"),
      v.literal("penal"),
      v.literal("administratif"),
      v.literal("commercial"),
      v.literal("travail"),
      v.literal("famille"),
    ),
    documents: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db.insert("legalCases", {
      ...args,
      userId: user._id,
      status: "draft",
      createdAt: new Date().toISOString(),
    });
  },
});

export const updateLegalCaseStatus = mutation({
  args: {
    id: v.id("legalCases"),
    status: v.union(
      v.literal("filed"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    resolvedAt: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const legalCase = await ctx.db.get(args.id);

    if (!legalCase || legalCase.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    const { id, ...updates } = args;

    await ctx.db.patch(id, updates);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// EMERGENCY ALERTS (SOS)
// ─────────────────────────────────────────────────────────────────────────────

export const createEmergencyAlert = mutation({
  args: {
    type: v.union(
      v.literal("medical"),
      v.literal("security"),
      v.literal("fire"),
      v.literal("natural_disaster"),
      v.literal("accident"),
      v.literal("other"),
    ),
    description: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    address: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const now = Date.now();

    // Le schéma impose une date d'expiration.
    // La durée de vie du SOS est de 15 minutes.
    const expiresAt = now + 15 * 60 * 1000;

    return ctx.db.insert("emergencyAlerts", {
      userId: user._id,

      // Le schéma canonique utilise "message" et ne possède
      // pas de champs séparés "type", "description" ou "address".
      // On conserve donc l'information fonctionnelle dans le message.
      message: `[${args.type}] ${args.description}${
        args.address ? ` — ${args.address}` : ""
      }`,

      latitude: args.latitude,
      longitude: args.longitude,

      createdAt: now,
      updatedAt: now,
      expiresAt,

      status: "active",
    });
  },
});

export const getActiveAlerts = query({
  args: {},

  handler: async (ctx) => {
    const now = Date.now();

    return ctx.db
      .query("emergencyAlerts")
      .withIndex("by_status_expiresAt", (q) =>
        q.eq("status", "active").gt("expiresAt", now),
      )
      .order("desc")
      .take(50);
  },
});

export const resolveAlert = mutation({
  args: {
    id: v.id("emergencyAlerts"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const alert = await ctx.db.get(args.id);

    if (!alert) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Alerte introuvable",
      });
    }

    if (alert.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Vous ne pouvez pas résoudre cette alerte",
      });
    }

    if (alert.status !== "active") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Cette alerte n'est plus active",
      });
    }

    const now = Date.now();

    await ctx.db.patch(args.id, {
      status: "resolved",
      resolvedAt: now,
      updatedAt: now,
    });
  },
});

export const getMyAlerts = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return ctx.db
      .query("emergencyAlerts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// URBAN PROJECTS (Urbanisme / Aménagement)
// ─────────────────────────────────────────────────────────────────────────────

export const listUrbanProjects = query({
  args: {
    city: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },

  handler: async (ctx, args) => {
    if (args.city) {
      return ctx.db
        .query("urbanProjects")
        .withIndex("by_city", (q) => q.eq("city", args.city!))
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("urbanProjects")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const createUrbanProject = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    type: v.union(
      v.literal("route"),
      v.literal("ecole"),
      v.literal("hopital"),
      v.literal("marche"),
      v.literal("parc"),
      v.literal("infrastructure"),
      v.literal("autre"),
    ),
    city: v.string(),
    address: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    images: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db.insert("urbanProjects", {
      ...args,
      authorId: user._id,
      status: "proposed",
      likeCount: 0,
      commentCount: 0,
    });
  },
});

export const voteUrbanProject = mutation({
  args: {
    id: v.id("urbanProjects"),
  },

  handler: async (ctx, args) => {
    await requireUser(ctx);

    const project = await ctx.db.get(args.id);

    if (project) {
      await ctx.db.patch(args.id, {
        likeCount: project.likeCount + 1,
      });
    }
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// WALLET & TRANSACTIONS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyTransactions = query({
  args: {
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 30);
  },
});

export const createTransaction = mutation({
  args: {
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("transfer"),
      v.literal("payment"),
      v.literal("refund"),
      v.literal("reward"),
    ),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    referenceId: v.optional(v.string()),
    counterpartId: v.optional(v.id("users")),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db.insert("walletTransactions", {
      ...args,
      userId: user._id,
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  },
});

export const getWalletSummary = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return null;
    }

    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const completed = txns.filter(
      (transaction) => transaction.status === "completed",
    );

    const income = completed
      .filter((transaction) =>
        ["deposit", "refund", "reward"].includes(transaction.type),
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const expenses = completed
      .filter((transaction) =>
        ["withdrawal", "payment", "transfer"].includes(transaction.type),
      )
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
      transactionCount: completed.length,
    };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// BUDGETS & EXPENSES
// ─────────────────────────────────────────────────────────────────────────────

export const getMyBudgets = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    return ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const createBudget = mutation({
  args: {
    name: v.string(),
    period: v.union(
      v.literal("monthly"),
      v.literal("yearly"),
      v.literal("custom"),
    ),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    categories: v.array(
      v.object({
        name: v.string(),
        allocated: v.number(),
        spent: v.number(),
      }),
    ),
    currency: v.string(),
    totalAllocated: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db.insert("budgets", {
      ...args,
      userId: user._id,
    });
  },
});

export const addExpense = mutation({
  args: {
    budgetId: v.optional(v.id("budgets")),
    category: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    date: v.string(),
    receiptUrl: v.optional(v.string()),
    tags: v.array(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    if (args.amount <= 0) {
      throw new ConvexError({
        code: "INVALID_AMOUNT",
        message: "Le montant doit être supérieur à zéro",
      });
    }

    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);

      if (!budget) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Budget introuvable",
        });
      }

      if (budget.userId !== user._id) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Budget non autorisé",
        });
      }
    }

    const expenseId = await ctx.db.insert("expenses", {
      ...args,
      userId: user._id,
    });

    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);

      if (budget) {
        const updatedCategories = budget.categories.map((category) =>
          category.name === args.category
            ? {
                ...category,
                spent: category.spent + args.amount,
              }
            : category,
        );

        await ctx.db.patch(args.budgetId, {
          categories: updatedCategories,
        });
      }
    }

    return expenseId;
  },
});

export const getMyExpenses = query({
  args: {
    budgetId: v.optional(v.id("budgets")),
    limit: v.optional(v.number()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);

    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);

      if (!budget || budget.userId !== user._id) {
        throw new ConvexError({
          code: "FORBIDDEN",
          message: "Budget non autorisé",
        });
      }

      return ctx.db
        .query("expenses")
        .withIndex("by_budget", (q) => q.eq("budgetId", args.budgetId))
        .order("desc")
        .take(limit);
    }

    return ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// USER DOCUMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const getMyDocuments = query({
  args: {
    category: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return [];
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return [];
    }

    if (args.category) {
      return ctx.db
        .query("userDocuments")
        .withIndex("by_category", (q) =>
          q.eq(
            "category",
            args.category as
              | "identite"
              | "contrat"
              | "facture"
              | "medical"
              | "juridique"
              | "education"
              | "autre",
          ),
        )
        .filter((q) => q.eq(q.field("userId"), user._id))
        .collect();
    }

    return ctx.db
      .query("userDocuments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

export const addDocument = mutation({
  args: {
    title: v.string(),
    category: v.union(
      v.literal("identite"),
      v.literal("contrat"),
      v.literal("facture"),
      v.literal("medical"),
      v.literal("juridique"),
      v.literal("education"),
      v.literal("autre"),
    ),
    fileUrl: v.string(),
    fileType: v.string(),
    fileSizeKb: v.optional(v.number()),
    tags: v.array(v.string()),
    isPrivate: v.boolean(),
    expiresAt: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    return ctx.db.insert("userDocuments", {
      ...args,
      userId: user._id,
    });
  },
});

export const deleteDocument = mutation({
  args: {
    id: v.id("userDocuments"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.id);

    if (!doc || doc.userId !== user._id) {
      throw new ConvexError({
        code: "FORBIDDEN",
        message: "Non autorisé",
      });
    }

    await ctx.db.delete(args.id);
  },
});

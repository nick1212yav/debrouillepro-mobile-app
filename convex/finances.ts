import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Connexion requise" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
  return user;
}

// ─── Wallet Transactions ──────────────────────────────────────────────────────

export const getWalletTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const txns = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);
    // Enrich with counterpart name
    return Promise.all(
      txns.map(async (tx) => {
        const counterpart = tx.counterpartId ? await ctx.db.get(tx.counterpartId) : null;
        return { ...tx, counterpartName: counterpart?.name };
      })
    );
  },
});

export const getWalletBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { balance: 0, monthIn: 0, monthOut: 0 };
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return { balance: 0, monthIn: 0, monthOut: 0 };
    const txns = await ctx.db.query("walletTransactions").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let balance = 0;
    let monthIn = 0;
    let monthOut = 0;
    for (const tx of txns) {
      if (tx.status !== "completed") continue;
      if (tx.type === "deposit" || tx.type === "refund" || tx.type === "reward") {
        balance += tx.amount;
        if (tx.completedAt && tx.completedAt >= monthStart) monthIn += tx.amount;
      } else {
        balance -= tx.amount;
        if (tx.completedAt && tx.completedAt >= monthStart) monthOut += tx.amount;
      }
    }
    return { balance, monthIn, monthOut };
  },
});

export const addWalletTransaction = mutation({
  args: {
    type: v.union(
      v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"),
      v.literal("payment"), v.literal("refund"), v.literal("reward"),
    ),
    amount: v.number(),
    currency: v.string(),
    description: v.string(),
    counterpartId: v.optional(v.id("users")),
    referenceId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("walletTransactions", {
      userId: user._id,
      ...args,
      status: "completed",
      completedAt: new Date().toISOString(),
    });
  },
});

// ─── Budget ───────────────────────────────────────────────────────────────────

export const getMyBudget = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    // Return the most recent monthly budget
    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);
    return budgets[0] ?? null;
  },
});

export const upsertBudget = mutation({
  args: {
    budgetId: v.optional(v.id("budgets")),
    name: v.string(),
    categories: v.array(v.object({
      name: v.string(),
      allocated: v.number(),
      spent: v.number(),
    })),
    currency: v.string(),
    totalAllocated: v.number(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { budgetId, ...data } = args;
    if (budgetId) {
      const b = await ctx.db.get(budgetId);
      if (!b || b.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(budgetId, data);
      return budgetId;
    }
    return ctx.db.insert("budgets", { userId: user._id, period: "monthly", ...data });
  },
});

export const updateBudgetCategory = mutation({
  args: {
    budgetId: v.id("budgets"),
    categoryName: v.string(),
    allocated: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    const categories = budget.categories.map((c) =>
      c.name === args.categoryName ? { ...c, allocated: args.allocated } : c
    );
    const totalAllocated = categories.reduce((s, c) => s + c.allocated, 0);
    await ctx.db.patch(args.budgetId, { categories, totalAllocated });
  },
});

export const getMyExpenses = query({
  args: { fromDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
    if (!args.fromDate) return expenses;
    return expenses.filter((e) => e.date >= (args.fromDate ?? ""));
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
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const id = await ctx.db.insert("expenses", { userId: user._id, ...args });
    // Update spent in budget category if linked
    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);
      if (budget && budget.userId === user._id) {
        const categories = budget.categories.map((c) =>
          c.name.toLowerCase() === args.category.toLowerCase()
            ? { ...c, spent: c.spent + args.amount }
            : c
        );
        await ctx.db.patch(args.budgetId, { categories });
      }
    }
    return id;
  },
});

// ─── Investments & Savings ────────────────────────────────────────────────────

export const getMyInvestmentAssets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("investmentAssets").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const upsertInvestmentAsset = mutation({
  args: {
    assetId: v.optional(v.id("investmentAssets")),
    symbol: v.string(),
    name: v.string(),
    sector: v.string(),
    quantity: v.number(),
    buyPrice: v.number(),
    currentPrice: v.number(),
    currency: v.string(),
    changePercent: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { assetId, ...data } = args;
    if (assetId) {
      const a = await ctx.db.get(assetId);
      if (!a || a.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(assetId, data);
      return assetId;
    }
    return ctx.db.insert("investmentAssets", { userId: user._id, ...data });
  },
});

export const deleteInvestmentAsset = mutation({
  args: { assetId: v.id("investmentAssets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const a = await ctx.db.get(args.assetId);
    if (!a || a.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.assetId);
  },
});

export const getMySavingsGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("savingsGoals").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const upsertSavingsGoal = mutation({
  args: {
    goalId: v.optional(v.id("savingsGoals")),
    name: v.string(),
    targetAmount: v.number(),
    currentAmount: v.number(),
    monthlyContribution: v.number(),
    currency: v.string(),
    color: v.optional(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { goalId, ...data } = args;
    if (goalId) {
      const g = await ctx.db.get(goalId);
      if (!g || g.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(goalId, data);
      return goalId;
    }
    return ctx.db.insert("savingsGoals", { userId: user._id, ...data });
  },
});

export const deleteSavingsGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const g = await ctx.db.get(args.goalId);
    if (!g || g.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.goalId);
  },
});

export const contributeSavingsGoal = mutation({
  args: { goalId: v.id("savingsGoals"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const g = await ctx.db.get(args.goalId);
    if (!g || g.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.patch(args.goalId, { currentAmount: g.currentAmount + args.amount });
  },
});

// ─── Revenue Entries (for creator dashboard) ──────────────────────────────────

export const getCreatorStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const entries = await ctx.db.query("revenueEntries").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(50);
    const streams = await ctx.db.query("revenueStreams").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const totalBalance = entries.filter((e) => e.amount > 0).reduce((s, e) => s + e.amount, 0)
      - entries.filter((e) => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0);
    return { entries, streams, totalBalance };
  },
});

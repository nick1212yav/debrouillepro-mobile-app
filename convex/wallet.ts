import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ code: "UNAUTHENTICATED", message: "Connexion requise" });
  const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
  return user;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export const getMyTransactions = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    const txs = await ctx.db.query("walletTransactions").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(args.limit ?? 50);
    return Promise.all(txs.map(async (tx) => {
      const counterpart = tx.counterpartId ? await ctx.db.get(tx.counterpartId) : null;
      return { ...tx, counterpartName: counterpart?.name, counterpartAvatar: counterpart?.avatar };
    }));
  },
});

export const createTransaction = mutation({
  args: {
    type: v.union(v.literal("deposit"), v.literal("withdrawal"), v.literal("transfer"), v.literal("payment"), v.literal("refund"), v.literal("reward")),
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
      type: args.type,
      amount: args.amount,
      currency: args.currency,
      description: args.description,
      status: "completed",
      counterpartId: args.counterpartId,
      referenceId: args.referenceId,
      completedAt: new Date().toISOString(),
    });
  },
});

export const getWalletSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const txs = await ctx.db.query("walletTransactions").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
    const completed = txs.filter((t) => t.status === "completed");
    const totalIn = completed.filter((t) => ["deposit", "refund", "reward"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
    const totalOut = completed.filter((t) => ["withdrawal", "transfer", "payment"].includes(t.type)).reduce((s, t) => s + t.amount, 0);
    return { balance: totalIn - totalOut, totalIn, totalOut, transactionCount: txs.length };
  },
});

// ─── Budget ───────────────────────────────────────────────────────────────────

export const getMyBudgets = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("budgets").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(20);
  },
});

export const createBudget = mutation({
  args: {
    name: v.string(),
    period: v.union(v.literal("monthly"), v.literal("yearly"), v.literal("custom")),
    startDate: v.string(),
    endDate: v.optional(v.string()),
    categories: v.array(v.object({ name: v.string(), allocated: v.number(), spent: v.number() })),
    currency: v.string(),
    totalAllocated: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("budgets", { userId: user._id, ...args });
  },
});

export const updateBudgetSpent = mutation({
  args: { budgetId: v.id("budgets"), categoryName: v.string(), spent: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const budget = await ctx.db.get(args.budgetId);
    if (!budget || budget.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    const updatedCats = budget.categories.map((c) => c.name === args.categoryName ? { ...c, spent: args.spent } : c);
    await ctx.db.patch(args.budgetId, { categories: updatedCats });
  },
});

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const getMyExpenses = query({
  args: { fromDate: v.optional(v.string()), toDate: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("expenses").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(100);
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
    return ctx.db.insert("expenses", { userId: user._id, ...args });
  },
});

export const deleteExpense = mutation({
  args: { expenseId: v.id("expenses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const expense = await ctx.db.get(args.expenseId);
    if (!expense || expense.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.expenseId);
  },
});

// ─── Investments ──────────────────────────────────────────────────────────────

export const getMyInvestments = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("investmentAssets").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const upsertInvestment = mutation({
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
      const asset = await ctx.db.get(assetId);
      if (!asset || asset.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(assetId, data);
      return assetId;
    }
    return ctx.db.insert("investmentAssets", { userId: user._id, ...data });
  },
});

export const deleteInvestment = mutation({
  args: { assetId: v.id("investmentAssets") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const asset = await ctx.db.get(args.assetId);
    if (!asset || asset.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.assetId);
  },
});

// ─── Savings Goals ────────────────────────────────────────────────────────────

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
      const goal = await ctx.db.get(goalId);
      if (!goal || goal.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
      await ctx.db.patch(goalId, data);
      return goalId;
    }
    return ctx.db.insert("savingsGoals", { userId: user._id, ...data });
  },
});

export const contributeToGoal = mutation({
  args: { goalId: v.id("savingsGoals"), amount: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.patch(args.goalId, { currentAmount: goal.currentAmount + args.amount });
  },
});

export const deleteSavingsGoal = mutation({
  args: { goalId: v.id("savingsGoals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.goalId);
  },
});

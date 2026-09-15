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

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const getMyTasks = query({
  args: { status: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    if (args.status) {
      return ctx.db.query("plannerTasks")
        .withIndex("by_status", (q) => q.eq("status", args.status as "todo" | "in_progress" | "done" | "cancelled"))
        .filter((q) => q.eq(q.field("userId"), user._id))
        .order("desc")
        .take(100);
    }
    return ctx.db.query("plannerTasks").withIndex("by_user", (q) => q.eq("userId", user._id)).order("desc").take(100);
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    tags: v.array(v.string()),
    reminderAt: v.optional(v.string()),
    repeat: v.optional(v.union(v.literal("none"), v.literal("daily"), v.literal("weekly"), v.literal("monthly"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("plannerTasks", { userId: user._id, status: "todo", ...args });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("plannerTasks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    dueTime: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"))),
    status: v.optional(v.union(v.literal("todo"), v.literal("in_progress"), v.literal("done"), v.literal("cancelled"))),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { taskId, ...updates } = args;
    const task = await ctx.db.get(taskId);
    if (!task || task.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
    await ctx.db.patch(taskId, filtered);
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("plannerTasks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.taskId);
  },
});

// ─── Goals ────────────────────────────────────────────────────────────────────

export const getMyGoals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return [];
    return ctx.db.query("plannerGoals").withIndex("by_user", (q) => q.eq("userId", user._id)).collect();
  },
});

export const createGoal = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    targetDate: v.optional(v.string()),
    milestones: v.array(v.object({ label: v.string(), done: v.boolean() })),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("plannerGoals", { userId: user._id, progressPct: 0, status: "active", ...args });
  },
});

export const updateGoal = mutation({
  args: {
    goalId: v.id("plannerGoals"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    progressPct: v.optional(v.number()),
    milestones: v.optional(v.array(v.object({ label: v.string(), done: v.boolean() }))),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const { goalId, ...updates } = args;
    const goal = await ctx.db.get(goalId);
    if (!goal || goal.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    // Auto-compute progress from milestones if provided
    let progressPct = updates.progressPct;
    if (updates.milestones && progressPct === undefined) {
      const done = updates.milestones.filter((m) => m.done).length;
      progressPct = updates.milestones.length > 0 ? Math.round((done / updates.milestones.length) * 100) : 0;
    }
    const filtered = Object.fromEntries(Object.entries({ ...updates, progressPct }).filter(([, v]) => v !== undefined));
    await ctx.db.patch(goalId, filtered);
  },
});

export const deleteGoal = mutation({
  args: { goalId: v.id("plannerGoals") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) throw new ConvexError({ code: "FORBIDDEN", message: "Accès refusé" });
    await ctx.db.delete(args.goalId);
  },
});

// ─── Summary ──────────────────────────────────────────────────────────────────

export const getPlannerSummary = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db.query("users").withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier)).unique();
    if (!user) return null;
    const [tasks, goals] = await Promise.all([
      ctx.db.query("plannerTasks").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
      ctx.db.query("plannerGoals").withIndex("by_user", (q) => q.eq("userId", user._id)).collect(),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    return {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === "todo").length,
      inProgress: tasks.filter((t) => t.status === "in_progress").length,
      done: tasks.filter((t) => t.status === "done").length,
      overdue: tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done" && t.status !== "cancelled").length,
      dueToday: tasks.filter((t) => t.dueDate === today && t.status !== "done" && t.status !== "cancelled").length,
      activeGoals: goals.filter((g) => g.status === "active").length,
      completedGoals: goals.filter((g) => g.status === "completed").length,
    };
  },
});

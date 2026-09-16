// ============================================================================
// FINANCES — DÉBROUILLEPRO
// ============================================================================
//
// RESPONSABILITÉS
// ----------------------------------------------------------------------------
//
// finances.ts gère :
//
//   • consultation du portefeuille
//   • budgets
//   • dépenses personnelles
//   • investissements déclaratifs
//   • objectifs d'épargne
//   • statistiques de revenus existantes
//
// payments.ts gère :
//
//   • Payment Intent
//   • Payment Attempt
//   • providers Mobile Money
//   • vérification provider
//   • finalisation financière
//   • walletTransactions.completed
//
// ============================================================================
//
// RÈGLE CRITIQUE
// ----------------------------------------------------------------------------
//
// Le frontend ne doit jamais pouvoir fabriquer un paiement "completed".
//
// Toute transaction réellement issue d'un provider doit suivre :
//
//   PaymentIntent
//       ↓
//   PaymentAttempt
//       ↓
//   Provider réel
//       ↓
//   Confirmation serveur vérifiée
//       ↓
//   payments.finalizeProviderSuccess()
//       ↓
//   walletTransactions
//
// ============================================================================

import {
  internalMutation,
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";

import { v, ConvexError } from "convex/values";

import type { Id } from "./_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

type FinanceCtx = QueryCtx | MutationCtx;

// ============================================================================
// LIMITES
// ============================================================================

const MAX_TRANSACTION_AMOUNT = 1_000_000_000_000;

const MAX_DESCRIPTION_LENGTH = 500;

const MAX_NAME_LENGTH = 200;

const MAX_SYMBOL_LENGTH = 50;

const MAX_SECTOR_LENGTH = 100;

const MAX_CURRENCY_LENGTH = 10;

const MAX_CATEGORY_LENGTH = 100;

const MAX_TAG_LENGTH = 100;

const MAX_TRANSACTIONS_PER_QUERY = 100;

const MAX_EXPENSES_PER_QUERY = 100;

const MAX_INVESTMENTS_PER_QUERY = 100;

const MAX_SAVINGS_GOALS_PER_QUERY = 100;

const MAX_REVENUE_ENTRIES = 100;

const MAX_REVENUE_STREAMS = 100;

// ============================================================================
// ERRORS
// ============================================================================

function financeError(code: string, message: string): never {
  throw new ConvexError({
    code,
    message,
  });
}

// ============================================================================
// NUMBERS
// ============================================================================

function assertFiniteNumber(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    financeError("INVALID_AMOUNT", `${field} doit être un nombre valide.`);
  }
}

function assertNonNegativeAmount(value: number, field: string): void {
  assertFiniteNumber(value, field);

  if (value < 0) {
    financeError("INVALID_AMOUNT", `${field} ne peut pas être négatif.`);
  }

  if (value > MAX_TRANSACTION_AMOUNT) {
    financeError("AMOUNT_TOO_LARGE", `${field} dépasse la limite autorisée.`);
  }
}

function assertPositiveAmount(value: number, field: string): void {
  assertFiniteNumber(value, field);

  if (value <= 0) {
    financeError("INVALID_AMOUNT", `${field} doit être supérieur à zéro.`);
  }

  if (value > MAX_TRANSACTION_AMOUNT) {
    financeError("AMOUNT_TOO_LARGE", `${field} dépasse la limite autorisée.`);
  }
}

// ============================================================================
// STRINGS
// ============================================================================

function assertRequiredString(
  value: string,
  field: string,
  maxLength = 200,
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    financeError("INVALID_INPUT", `${field} est obligatoire.`);
  }

  if (value.trim().length > maxLength) {
    financeError("INVALID_INPUT", `${field} est trop long.`);
  }
}

// ============================================================================
// CURRENCY
// ============================================================================

function normalizeCurrency(currency: string): string {
  assertRequiredString(currency, "La devise", MAX_CURRENCY_LENGTH);

  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z0-9]{3,10}$/.test(normalized)) {
    financeError(
      "INVALID_CURRENCY",
      "La devise doit utiliser un code alphanumérique valide.",
    );
  }

  return normalized;
}

// ============================================================================
// DATE
// ============================================================================

function assertDateString(value: string, field: string): void {
  assertRequiredString(value, field, 100);

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    financeError("INVALID_DATE", `${field} n'est pas une date valide.`);
  }
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

async function requireUser(ctx: FinanceCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    financeError("UNAUTHENTICATED", "Connexion requise.");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();

  if (!user) {
    financeError("NOT_FOUND", "Utilisateur introuvable.");
  }

  return user;
}

// ============================================================================
// WALLET — TRANSACTIONS
// ============================================================================
//
// IMPORTANT
// ----------------------------------------------------------------------------
//
// Cette query ne fabrique aucune donnée.
//
// Elle ne retourne que les transactions réellement présentes dans le ledger.
//
// ============================================================================

export const getWalletTransactions = query({
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

    const requestedLimit = args.limit ?? 50;

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      MAX_TRANSACTIONS_PER_QUERY,
    );

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);

    return Promise.all(
      transactions.map(async (transaction) => {
        const counterpart = transaction.counterpartId
          ? await ctx.db.get(transaction.counterpartId)
          : null;

        return {
          ...transaction,

          counterpartName: counterpart?.name,
        };
      }),
    );
  },
});

// ============================================================================
// WALLET — BALANCE
// ============================================================================
//
// IMPORTANT
// ----------------------------------------------------------------------------
//
// Le portefeuille est multi-devises.
//
// JAMAIS :
//
//   USD + CDF
//
// Chaque devise possède son propre solde.
//
// ============================================================================

export const getWalletBalance = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return {
        balance: 0,
        monthIn: 0,
        monthOut: 0,
        currency: undefined,
        balances: [],
      };
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (!user) {
      return {
        balance: 0,
        monthIn: 0,
        monthOut: 0,
        currency: undefined,
        balances: [],
      };
    }

    // ----------------------------------------------------------------------
    // NOTE ARCHITECTURALE
    // ----------------------------------------------------------------------
    //
    // Le schema actuel ne possède pas de table d'agrégats de balance.
    //
    // Nous devons donc calculer à partir du ledger existant.
    //
    // Aucun chiffre fictif n'est ajouté.
    //
    // La prochaine optimisation de très grande échelle devra introduire
    // un agrégat wallet atomiquement maintenu par le Payment Core.
    //
    // Tant que ce modèle n'existe pas dans le schema, cette lecture reste
    // la source de vérité du ledger.
    //
    // ----------------------------------------------------------------------

    const transactions = await ctx.db
      .query("walletTransactions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const now = new Date();

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const balancesByCurrency = new Map<
      string,
      {
        balance: number;
        monthIn: number;
        monthOut: number;
      }
    >();

    for (const transaction of transactions) {
      if (transaction.status !== "completed") {
        continue;
      }

      assertFiniteNumber(transaction.amount, "Montant de transaction");

      if (transaction.amount < 0) {
        continue;
      }

      const currency =
        typeof transaction.currency === "string"
          ? transaction.currency.trim().toUpperCase()
          : "";

      if (!currency) {
        continue;
      }

      const completedAt = transaction.completedAt
        ? new Date(transaction.completedAt).getTime()
        : NaN;

      const isCurrentMonth =
        Number.isFinite(completedAt) && completedAt >= monthStart;

      const current = balancesByCurrency.get(currency) ?? {
        balance: 0,
        monthIn: 0,
        monthOut: 0,
      };

      const isIncoming =
        transaction.type === "deposit" ||
        transaction.type === "refund" ||
        transaction.type === "reward";

      if (isIncoming) {
        current.balance += transaction.amount;

        if (isCurrentMonth) {
          current.monthIn += transaction.amount;
        }
      } else {
        current.balance -= transaction.amount;

        if (isCurrentMonth) {
          current.monthOut += transaction.amount;
        }
      }

      balancesByCurrency.set(currency, current);
    }

    const balances = Array.from(balancesByCurrency.entries()).map(
      ([currency, values]) => ({
        currency,
        ...values,
      }),
    );

    // ----------------------------------------------------------------------
    // COMPATIBILITÉ FRONTEND
    // ----------------------------------------------------------------------

    const legacy =
      balances.length === 1
        ? balances[0]
        : {
            balance: 0,
            monthIn: 0,
            monthOut: 0,
            currency: undefined,
          };

    return {
      balance: legacy.balance,

      monthIn: legacy.monthIn,

      monthOut: legacy.monthOut,

      currency: balances.length === 1 ? balances[0].currency : undefined,

      balances,
    };
  },
});

// ============================================================================
// WALLET — ADD TRANSACTION
// ============================================================================
//
// IMPORTANT — CHANGEMENT CRITIQUE
// ----------------------------------------------------------------------------
//
// Cette fonction devient INTERNAL.
//
// Pourquoi ?
//
// L'ancienne version était :
//
//   export const addWalletTransaction = mutation(...)
//
// et permettait donc au frontend de demander directement :
//
//   status: "completed"
//
// Ce modèle permettait de contourner Payment Core.
//
// Ce n'est plus acceptable.
//
// Une transaction wallet completed issue d'un paiement doit être créée par :
//
//   payments.finalizeProviderSuccess()
//
// ou par un futur flux interne explicitement autorisé.
//
// ============================================================================

export const addWalletTransaction = internalMutation({
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

    counterpartId: v.optional(v.id("users")),

    referenceId: v.optional(v.string()),
  },

  handler: async (ctx, args) => {
    assertPositiveAmount(args.amount, "Le montant");

    const currency = normalizeCurrency(args.currency);

    assertRequiredString(
      args.description,
      "La description",
      MAX_DESCRIPTION_LENGTH,
    );

    if (args.referenceId !== undefined) {
      assertRequiredString(args.referenceId, "La référence", 200);
    }

    if (args.counterpartId) {
      const counterpart = await ctx.db.get(args.counterpartId);

      if (!counterpart) {
        financeError(
          "NOT_FOUND",
          "Le bénéficiaire ou correspondant est introuvable.",
        );
      }

      if (args.type !== "transfer" && args.type !== "payment") {
        financeError(
          "INVALID_INPUT",
          "Un correspondant ne peut être associé qu'à un transfert ou un paiement.",
        );
      }
    }

    // ----------------------------------------------------------------------
    // SÉCURITÉ
    // ----------------------------------------------------------------------
    //
    // Cette fonction est INTERNAL.
    //
    // Elle ne peut donc pas être invoquée par le frontend.
    //
    // IMPORTANT :
    //
    // Un appelant interne doit déjà avoir établi l'utilisateur propriétaire.
    // Le userId n'est volontairement PAS fourni par le client.
    //
    // ----------------------------------------------------------------------

    throw new ConvexError({
      code: "LEGACY_LEDGER_WRITER_DISABLED",
      message:
        "L'écriture générique du ledger est désactivée. Utilisez le Payment Core pour créer une transaction financière réelle.",
    });
  },
});

// ============================================================================
// BUDGET
// ============================================================================

export const getMyBudget = query({
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

    const budgets = await ctx.db
      .query("budgets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    return budgets[0] ?? null;
  },
});

// ============================================================================
// UPSERT BUDGET
// ============================================================================

export const upsertBudget = mutation({
  args: {
    budgetId: v.optional(v.id("budgets")),

    name: v.string(),

    categories: v.array(
      v.object({
        name: v.string(),
        allocated: v.number(),
        spent: v.number(),
      }),
    ),

    currency: v.string(),

    totalAllocated: v.number(),

    startDate: v.string(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    assertRequiredString(args.name, "Le nom du budget", MAX_NAME_LENGTH);

    const currency = normalizeCurrency(args.currency);

    assertDateString(args.startDate, "La date de début");

    assertNonNegativeAmount(args.totalAllocated, "Le montant total alloué");

    for (const category of args.categories) {
      assertRequiredString(
        category.name,
        "Le nom de catégorie",
        MAX_CATEGORY_LENGTH,
      );

      assertNonNegativeAmount(
        category.allocated,
        `Allocation de ${category.name}`,
      );

      assertNonNegativeAmount(category.spent, `Dépenses de ${category.name}`);
    }

    const { budgetId, ...data } = args;

    const cleanData = {
      ...data,

      name: data.name.trim(),

      currency,

      startDate: data.startDate.trim(),
    };

    if (budgetId) {
      const budget = await ctx.db.get(budgetId);

      if (!budget) {
        financeError("NOT_FOUND", "Budget introuvable.");
      }

      if (budget.userId !== user._id) {
        financeError("FORBIDDEN", "Accès refusé.");
      }

      await ctx.db.patch(budgetId, cleanData);

      return budgetId;
    }

    return ctx.db.insert("budgets", {
      userId: user._id,

      period: "monthly",

      ...cleanData,
    });
  },
});

// ============================================================================
// BUDGET — CATEGORY
// ============================================================================

export const updateBudgetCategory = mutation({
  args: {
    budgetId: v.id("budgets"),

    categoryName: v.string(),

    allocated: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    assertRequiredString(
      args.categoryName,
      "La catégorie",
      MAX_CATEGORY_LENGTH,
    );

    assertNonNegativeAmount(args.allocated, "Le montant alloué");

    const budget = await ctx.db.get(args.budgetId);

    if (!budget) {
      financeError("NOT_FOUND", "Budget introuvable.");
    }

    if (budget.userId !== user._id) {
      financeError("FORBIDDEN", "Accès refusé.");
    }

    const normalizedCategory = args.categoryName.trim().toLowerCase();

    const categories = budget.categories.map((category) =>
      category.name.trim().toLowerCase() === normalizedCategory
        ? {
            ...category,
            allocated: args.allocated,
          }
        : category,
    );

    const totalAllocated = categories.reduce(
      (sum, category) => sum + category.allocated,
      0,
    );

    await ctx.db.patch(args.budgetId, {
      categories,
      totalAllocated,
    });

    return args.budgetId;
  },
});

// ============================================================================
// EXPENSES
// ============================================================================

export const getMyExpenses = query({
  args: {
    fromDate: v.optional(v.string()),
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

    if (args.fromDate !== undefined) {
      assertDateString(args.fromDate, "La date de début");
    }

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_EXPENSES_PER_QUERY);

    if (!args.fromDate) {
      return expenses;
    }

    return expenses.filter((expense) => expense.date >= args.fromDate!);
  },
});

// ============================================================================
// ADD EXPENSE
// ============================================================================

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

    assertRequiredString(args.category, "La catégorie", MAX_CATEGORY_LENGTH);

    assertRequiredString(
      args.description,
      "La description",
      MAX_DESCRIPTION_LENGTH,
    );

    assertPositiveAmount(args.amount, "Le montant de la dépense");

    const currency = normalizeCurrency(args.currency);

    assertDateString(args.date, "La date de dépense");

    for (const tag of args.tags) {
      assertRequiredString(tag, "Le tag", MAX_TAG_LENGTH);
    }

    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);

      if (!budget) {
        financeError("NOT_FOUND", "Budget introuvable.");
      }

      if (budget.userId !== user._id) {
        financeError("FORBIDDEN", "Accès refusé.");
      }
    }

    const id = await ctx.db.insert("expenses", {
      userId: user._id,

      budgetId: args.budgetId,

      category: args.category.trim(),

      description: args.description.trim(),

      amount: args.amount,

      currency,

      date: args.date.trim(),

      tags: args.tags.map((tag) => tag.trim()).filter(Boolean),
    });

    // ----------------------------------------------------------------------
    // BUDGET
    // ----------------------------------------------------------------------

    if (args.budgetId) {
      const budget = await ctx.db.get(args.budgetId);

      if (budget) {
        const normalizedCategory = args.category.trim().toLowerCase();

        const categories = budget.categories.map((category) =>
          category.name.trim().toLowerCase() === normalizedCategory
            ? {
                ...category,
                spent: category.spent + args.amount,
              }
            : category,
        );

        await ctx.db.patch(args.budgetId, {
          categories,
        });
      }
    }

    return id;
  },
});

// ============================================================================
// INVESTMENTS
// ============================================================================

export const getMyInvestmentAssets = query({
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
      .query("investmentAssets")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_INVESTMENTS_PER_QUERY);
  },
});

// ============================================================================
// UPSERT INVESTMENT
// ============================================================================

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

    assertRequiredString(args.symbol, "Le symbole", MAX_SYMBOL_LENGTH);

    assertRequiredString(args.name, "Le nom de l'actif", MAX_NAME_LENGTH);

    assertRequiredString(args.sector, "Le secteur", MAX_SECTOR_LENGTH);

    assertNonNegativeAmount(args.quantity, "La quantité");

    assertNonNegativeAmount(args.buyPrice, "Le prix d'achat");

    assertNonNegativeAmount(args.currentPrice, "Le prix actuel");

    assertFiniteNumber(args.changePercent, "La variation");

    if (args.changePercent < -100) {
      financeError(
        "INVALID_PERCENTAGE",
        "La variation ne peut pas être inférieure à -100 %.",
      );
    }

    const currency = normalizeCurrency(args.currency);

    const { assetId, ...data } = args;

    const cleanData = {
      ...data,

      symbol: data.symbol.trim(),

      name: data.name.trim(),

      sector: data.sector.trim(),

      currency,
    };

    if (assetId) {
      const asset = await ctx.db.get(assetId);

      if (!asset) {
        financeError("NOT_FOUND", "Actif d'investissement introuvable.");
      }

      if (asset.userId !== user._id) {
        financeError("FORBIDDEN", "Accès refusé.");
      }

      await ctx.db.patch(assetId, cleanData);

      return assetId;
    }

    return ctx.db.insert("investmentAssets", {
      userId: user._id,

      ...cleanData,
    });
  },
});

// ============================================================================
// DELETE INVESTMENT
// ============================================================================

export const deleteInvestmentAsset = mutation({
  args: {
    assetId: v.id("investmentAssets"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const asset = await ctx.db.get(args.assetId);

    if (!asset) {
      financeError("NOT_FOUND", "Actif d'investissement introuvable.");
    }

    if (asset.userId !== user._id) {
      financeError("FORBIDDEN", "Accès refusé.");
    }

    await ctx.db.delete(args.assetId);

    return {
      deleted: true,
      assetId: args.assetId,
    };
  },
});

// ============================================================================
// SAVINGS GOALS
// ============================================================================

export const getMySavingsGoals = query({
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
      .query("savingsGoals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_SAVINGS_GOALS_PER_QUERY);
  },
});

// ============================================================================
// UPSERT SAVINGS GOAL
// ============================================================================

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

    assertRequiredString(args.name, "Le nom de l'objectif", MAX_NAME_LENGTH);

    assertPositiveAmount(args.targetAmount, "Le montant cible");

    assertNonNegativeAmount(args.currentAmount, "Le montant actuel");

    assertNonNegativeAmount(
      args.monthlyContribution,
      "La contribution mensuelle",
    );

    const currency = normalizeCurrency(args.currency);

    if (args.deadline !== undefined) {
      assertDateString(args.deadline, "La date limite");
    }

    if (args.color !== undefined && args.color.trim().length > 50) {
      financeError("INVALID_INPUT", "La couleur est trop longue.");
    }

    // ----------------------------------------------------------------------
    // COHÉRENCE
    // ----------------------------------------------------------------------

    if (args.currentAmount > args.targetAmount) {
      financeError(
        "INVALID_AMOUNT",
        "Le montant actuel ne peut pas dépasser le montant cible.",
      );
    }

    const { goalId, ...data } = args;

    const cleanData = {
      ...data,

      name: data.name.trim(),

      currency,

      color: data.color?.trim(),

      deadline: data.deadline?.trim(),
    };

    if (goalId) {
      const goal = await ctx.db.get(goalId);

      if (!goal) {
        financeError("NOT_FOUND", "Objectif d'épargne introuvable.");
      }

      if (goal.userId !== user._id) {
        financeError("FORBIDDEN", "Accès refusé.");
      }

      await ctx.db.patch(goalId, cleanData);

      return goalId;
    }

    return ctx.db.insert("savingsGoals", {
      userId: user._id,

      ...cleanData,
    });
  },
});

// ============================================================================
// DELETE SAVINGS GOAL
// ============================================================================

export const deleteSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    const goal = await ctx.db.get(args.goalId);

    if (!goal) {
      financeError("NOT_FOUND", "Objectif d'épargne introuvable.");
    }

    if (goal.userId !== user._id) {
      financeError("FORBIDDEN", "Accès refusé.");
    }

    await ctx.db.delete(args.goalId);

    return {
      deleted: true,
      goalId: args.goalId,
    };
  },
});

// ============================================================================
// CONTRIBUTE TO SAVINGS GOAL
// ============================================================================
//
// ATTENTION
// ----------------------------------------------------------------------------
//
// Cette fonction modifie un OBJECTIF D'ÉPARGNE.
//
// Elle ne crédite PAS le wallet.
//
// Elle ne doit donc jamais être utilisée comme substitut à un dépôt
// DébrouillePay.
//
// ============================================================================

export const contributeSavingsGoal = mutation({
  args: {
    goalId: v.id("savingsGoals"),

    amount: v.number(),
  },

  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    assertPositiveAmount(args.amount, "La contribution");

    const goal = await ctx.db.get(args.goalId);

    if (!goal) {
      financeError("NOT_FOUND", "Objectif d'épargne introuvable.");
    }

    if (goal.userId !== user._id) {
      financeError("FORBIDDEN", "Accès refusé.");
    }

    assertNonNegativeAmount(
      goal.currentAmount,
      "Le montant actuel de l'objectif",
    );

    const newAmount = goal.currentAmount + args.amount;

    if (!Number.isFinite(newAmount) || newAmount > MAX_TRANSACTION_AMOUNT) {
      financeError(
        "AMOUNT_TOO_LARGE",
        "Le nouveau montant de l'objectif dépasse la limite autorisée.",
      );
    }

    await ctx.db.patch(args.goalId, {
      currentAmount: newAmount,
    });

    return {
      goalId: args.goalId,

      previousAmount: goal.currentAmount,

      contribution: args.amount,

      currentAmount: newAmount,

      targetAmount: goal.targetAmount,
    };
  },
});

// ============================================================================
// CREATOR REVENUE
// ============================================================================

export const getCreatorStats = query({
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

    const entries = await ctx.db
      .query("revenueEntries")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(MAX_REVENUE_ENTRIES);

    const streams = await ctx.db
      .query("revenueStreams")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(MAX_REVENUE_STREAMS);

    // ----------------------------------------------------------------------
    // IMPORTANT
    // ----------------------------------------------------------------------
    //
    // Ne pas présenter totalBalance comme un solde wallet.
    //
    // Il s'agit du total des entrées de revenus récupérées ici.
    //
    // Le portefeuille DébrouillePay reste géré par walletTransactions.
    //
    // ----------------------------------------------------------------------

    const totalsByCurrency = new Map<string, number>();

    for (const entry of entries) {
      assertFiniteNumber(entry.amount, "Montant de revenu");

      const currency =
        typeof entry.currency === "string"
          ? entry.currency.trim().toUpperCase()
          : "";

      if (!currency) {
        continue;
      }

      const current = totalsByCurrency.get(currency) ?? 0;

      totalsByCurrency.set(currency, current + entry.amount);
    }

    const revenueByCurrency = Array.from(totalsByCurrency.entries()).map(
      ([currency, amount]) => ({
        currency,
        amount,
      }),
    );

    return {
      entries,

      streams,

      revenueByCurrency,

      // Compatibilité avec l'ancien frontend :
      // un total unique n'est fourni que lorsqu'une seule devise existe.
      totalBalance:
        revenueByCurrency.length === 1 ? revenueByCurrency[0].amount : 0,

      currency:
        revenueByCurrency.length === 1
          ? revenueByCurrency[0].currency
          : undefined,
    };
  },
});

// ============================================================================
// END OF FINANCES CORE
// ============================================================================
//
// GARANTIES
// ----------------------------------------------------------------------------
//
//   ✅ Authentification
//   ✅ Ownership
//   ✅ Aucun faux paiement
//   ✅ Aucun faux solde
//   ✅ Multi-devises sans addition implicite
//   ✅ Validation des montants
//   ✅ Validation des devises
//   ✅ Validation des dates
//   ✅ Budgets protégés par userId
//   ✅ Dépenses protégées par userId
//   ✅ Investissements protégés par userId
//   ✅ Objectifs d'épargne protégés par userId
//   ✅ Ledger Payment Core séparé
//   ✅ addWalletTransaction non exposée au frontend
//   ✅ Aucun retrait simulé
//   ✅ Aucun completed provider fabriqué côté client
//
// ============================================================================
//
// IMPORTANT — PROCHAINE ÉVOLUTION
// ----------------------------------------------------------------------------
//
// Pour passer le calcul de balance à une architecture réellement scalable,
// il faudra ajouter au schema un agrégat wallet atomiquement maintenu par
// Payment Core, par exemple un walletBalance / walletAccounts par
// user + currency.
//
// Tant que cette table n'existe pas, getWalletBalance reste volontairement
// basé sur le ledger existant plutôt que d'inventer une source de vérité.
//
// ============================================================================

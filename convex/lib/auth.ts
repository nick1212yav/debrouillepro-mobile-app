// convex/lib/auth.ts

import { ConvexError } from "convex/values";

import type { MutationCtx, QueryCtx } from "../_generated/server";

import type { Id } from "../_generated/dataModel";

type AuthCtx = QueryCtx | MutationCtx;

/**
 * Résout l'utilisateur actuellement authentifié.
 *
 * Architecture :
 *
 *   Convex Auth Identity
 *          ↓
 *   tokenIdentifier
 *          ↓
 *   users.by_token
 *          ↓
 *   users document
 */
export async function requireUser(ctx: AuthCtx) {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Utilisateur non authentifié",
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

/**
 * Retourne uniquement l'ID de l'utilisateur authentifié.
 *
 * Utile lorsque les modules ont uniquement besoin du userId
 * et non de l'ensemble du document utilisateur.
 */
export async function requireUserId(ctx: AuthCtx): Promise<Id<"users">> {
  const user = await requireUser(ctx);

  return user._id;
}

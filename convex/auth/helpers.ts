import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

type AuthCtx = QueryCtx | MutationCtx;

export async function getAuthenticatedUser(
  ctx: AuthCtx,
): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;

  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .first();

  return user ?? null;
}

export async function requireAuthenticatedUser(
  ctx: AuthCtx,
): Promise<Doc<"users">> {
  const user = await getAuthenticatedUser(ctx);

  if (!user) {
    throw new Error("Non authentifié");
  }

  return user;
}

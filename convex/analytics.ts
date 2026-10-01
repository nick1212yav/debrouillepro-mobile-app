import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// ANALYTICS — PROFILE / CREATOR
// ============================================================================
//
// Sources de vérité :
// - profileViews  → vues réelles du profil
// - follows       → abonnements réels
// - publications  → publications + compteurs agrégés réels
//
// IMPORTANT :
// Nous ne reconstruisons jamais artificiellement un historique quotidien
// de vues/likes à partir de _creationTime d'une publication.
// ============================================================================

type DayMetric = {
  date: string;
  views: number;
};

type LikeMetric = {
  date: string;
  likes: number;
};

type FollowerMetric = {
  date: string;
  count: number;
};

type TopPublication = {
  _id: string;
  title: string;
  type: string;
  views: number;
  likes: number;
  comments: number;
};

type AnalyticsResult = {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalFollowers: number;
  totalPublications: number;
  engagementRate: number;
  weekSummary: {
    label: string;
    views: number;
    likes: number;
  };
  viewsByDay: DayMetric[];
  likesByDay: LikeMetric[];
  followersByDay: FollowerMetric[];
  profileViewsByDay: DayMetric[];
  topPublications: TopPublication[];
};

// ============================================================================
// DATE HELPERS
// ============================================================================

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getLastDays(count: number): string[] {
  const days: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - offset);
    days.push(isoDate(date));
  }

  return days;
}

// ============================================================================
// RECORD PROFILE VIEW
// ============================================================================
//
// Règles :
// - le profil doit exister ;
// - le propriétaire ne compte pas comme visiteur ;
// - un utilisateur authentifié ne génère qu'une vue par jour/profil ;
// - les visiteurs anonymes peuvent être comptabilisés ;
// - aucune donnée sensible n'est enregistrée.
// ============================================================================

export const recordProfileView = mutation({
  args: {
    profileId: v.id("users"),
  },

  handler: async (ctx, args) => {
    // ------------------------------------------------------------------------
    // Vérification du profil cible
    // ------------------------------------------------------------------------

    const profile = await ctx.db.get(args.profileId);

    if (!profile) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Profil introuvable",
      });
    }

    // ------------------------------------------------------------------------
    // Identification éventuelle du visiteur
    // ------------------------------------------------------------------------

    const identity = await ctx.auth.getUserIdentity();

    let viewerId: Id<"users"> | undefined;

    if (identity) {
      const viewer = await ctx.db
        .query("users")
        .withIndex("by_token", (q) =>
          q.eq("tokenIdentifier", identity.tokenIdentifier),
        )
        .unique();

      viewerId = viewer?._id;

      // Ne jamais compter ses propres consultations.
      if (viewerId === args.profileId) {
        return {
          recorded: false,
          reason: "self_view",
        } as const;
      }
    }

    // ------------------------------------------------------------------------
    // Déduplication quotidienne
    // ------------------------------------------------------------------------

    const date = isoDate(new Date());

    if (viewerId) {
      const existing = await ctx.db
        .query("profileViews")
        .withIndex("by_viewer_and_profile_and_date", (q) =>
          q
            .eq("viewerId", viewerId)
            .eq("profileId", args.profileId)
            .eq("date", date),
        )
        .first();

      if (existing) {
        return {
          recorded: false,
          reason: "already_recorded_today",
        } as const;
      }
    }

    // ------------------------------------------------------------------------
    // Enregistrement
    // ------------------------------------------------------------------------

    await ctx.db.insert("profileViews", {
      profileId: args.profileId,
      viewerId,
      date,
    });

    return {
      recorded: true,
      reason: "recorded",
    } as const;
  },
});

// ============================================================================
// MY ANALYTICS
// ============================================================================

export const getMyAnalytics = query({
  args: {},

  handler: async (ctx): Promise<AnalyticsResult> => {
    // ========================================================================
    // AUTHENTIFICATION
    // ========================================================================

    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHENTICATED",
        message: "Non authentifié",
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

    // ========================================================================
    // PÉRIODE
    // ========================================================================

    const days30 = getLastDays(30);
    const days7 = days30.slice(-7);
    const weekStart = days7[0];

    const viewsByDayMap: Record<string, number> = {};
    const likesByDayMap: Record<string, number> = {};
    const followersByDayMap: Record<string, number> = {};

    for (const date of days30) {
      viewsByDayMap[date] = 0;
      likesByDayMap[date] = 0;
      followersByDayMap[date] = 0;
    }

    // ========================================================================
    // PROFILE VIEWS
    // ========================================================================

    let totalViews = 0;

    const profileViewsQuery = ctx.db
      .query("profileViews")
      .withIndex("by_profile", (q) => q.eq("profileId", user._id));

    for await (const view of profileViewsQuery) {
      totalViews += 1;

      if (viewsByDayMap[view.date] !== undefined) {
        viewsByDayMap[view.date] += 1;
      }
    }

    // ========================================================================
    // PUBLICATIONS
    // ========================================================================

    let totalPublications = 0;
    let totalLikes = 0;
    let totalComments = 0;

    const topPublications: TopPublication[] = [];

    const publicationsQuery = ctx.db
      .query("publications")
      .withIndex("by_author", (q) => q.eq("authorId", user._id));

    for await (const publication of publicationsQuery) {
      totalPublications += 1;
      totalLikes += publication.likeCount;
      totalComments += publication.commentCount;

      const candidate: TopPublication = {
        _id: publication._id,
        title: publication.title,
        type: publication.type,
        views: publication.viewCount,
        likes: publication.likeCount,
        comments: publication.commentCount,
      };

      topPublications.push(candidate);

      // Conserver uniquement les 5 meilleures publications.
      topPublications.sort(
        (a, b) =>
          b.views + b.likes + b.comments - (a.views + a.likes + a.comments),
      );

      if (topPublications.length > 5) {
        topPublications.pop();
      }
    }

    // ========================================================================
    // FOLLOWERS
    // ========================================================================

    let totalFollowers = 0;

    const followersQuery = ctx.db
      .query("follows")
      .withIndex("by_following", (q) => q.eq("followingId", user._id));

    for await (const follow of followersQuery) {
      totalFollowers += 1;

      const date = isoDate(new Date(follow._creationTime));

      if (followersByDayMap[date] !== undefined) {
        followersByDayMap[date] += 1;
      }
    }

    // ========================================================================
    // DAILY VIEWS
    // ========================================================================

    const viewsByDay: DayMetric[] = days30.map((date) => ({
      date,
      views: viewsByDayMap[date] ?? 0,
    }));

    // Compatibilité avec le contrat frontend existant.
    const profileViewsByDay: DayMetric[] = viewsByDay.map((entry) => ({
      date: entry.date,
      views: entry.views,
    }));

    // ========================================================================
    // DAILY LIKES
    // ========================================================================
    //
    // Le schéma actuel ne permet pas de reconstruire proprement les likes
    // reçus par l'ensemble des publications d'un utilisateur par jour.
    //
    // On ne fabrique donc PAS de données.
    // ========================================================================

    const likesByDay: LikeMetric[] = days30.map((date) => ({
      date,
      likes: likesByDayMap[date] ?? 0,
    }));

    // ========================================================================
    // FOLLOWER CURVE
    // ========================================================================

    let cumulativeFollowers = 0;

    const followersByDay: FollowerMetric[] = days30.map((date) => {
      cumulativeFollowers += followersByDayMap[date] ?? 0;

      return {
        date,
        count: cumulativeFollowers,
      };
    });

    // ========================================================================
    // ENGAGEMENT
    // ========================================================================

    const engagementRate =
      totalViews > 0
        ? Math.round(((totalLikes + totalComments) / totalViews) * 100)
        : 0;

    // ========================================================================
    // WEEK SUMMARY
    // ========================================================================

    const weekViews = viewsByDay
      .filter((entry) => entry.date >= weekStart)
      .reduce((sum, entry) => sum + entry.views, 0);

    const weekLikes = likesByDay
      .filter((entry) => entry.date >= weekStart)
      .reduce((sum, entry) => sum + entry.likes, 0);

    // ========================================================================
    // RESULT
    // ========================================================================

    return {
      totalViews,
      totalLikes,
      totalComments,
      totalFollowers,
      totalPublications,
      engagementRate,

      weekSummary: {
        label: "Cette semaine",
        views: weekViews,
        likes: weekLikes,
      },

      viewsByDay,
      likesByDay,
      followersByDay,
      profileViewsByDay,

      topPublications,
    };
  },
});

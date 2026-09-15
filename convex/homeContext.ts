// convex/homeContext.ts

import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// ============================================================
// TYPES
// ============================================================

type HomeLocation = {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  area?: string;
};

type HomeWeather = {
  temperature: number;
  condition: string;
  icon?: string;
};

type RecentInteraction = {
  type: "like" | "save" | "share" | "comment" | "view";

  publicationId: string;
  timestamp: number;
};

type RecentActivity = {
  recentModules: string[];
  recentSearches: string[];
  recentPublications: string[];
  recentInteractions: RecentInteraction[];
  moduleEngagement: Record<string, number>;
};

type UnreadCounts = {
  messages: number;
  notifications: number;
  feed: number;
};

type NetworkData = {
  following: number;
  followers: number;
  communities: string[];
};

type SessionData = {
  isFirstLaunchToday: boolean;
  sessionCountToday: number;
  idleMinutes: number;
};

type HomeContext = {
  userId?: Id<"users">;

  location?: HomeLocation;

  time: {
    hour: number;
    dayOfWeek: number;
    period: "morning" | "afternoon" | "evening" | "night";
    timestamp: number;
  };

  weather?: HomeWeather;

  preferences: {
    modules: string[];
    categories: string[];
    interests: string[];
  };

  activity: RecentActivity;

  unread: UnreadCounts;

  network: NetworkData;

  device: {
    online: boolean;
    platform: "web";
    screenSize: "medium";
  };

  session: SessionData;
};

// ============================================================
// QUERY PRINCIPALE
// ============================================================

/**
 * Récupère le contexte complet de la Home
 * pour l'utilisateur courant.
 *
 * Le contexte combine :
 * - profil utilisateur
 * - préférences Home
 * - activité récente
 * - localisation
 * - météo
 * - compteurs non lus
 * - réseau
 * - session
 */
export const getHomeContext = query({
  args: {},

  handler: async (ctx): Promise<HomeContext> => {
    // --------------------------------------------------------
    // AUTHENTIFICATION
    // --------------------------------------------------------

    const identity = await ctx.auth.getUserIdentity();

    // --------------------------------------------------------
    // UTILISATEUR NON CONNECTÉ
    // --------------------------------------------------------

    if (!identity) {
      const now = new Date();

      return {
        userId: undefined,

        location: undefined,

        time: {
          hour: now.getHours(),
          dayOfWeek: now.getDay(),
          period: getPeriod(now.getHours()),
          timestamp: now.getTime(),
        },

        weather: undefined,

        preferences: {
          modules: [],
          categories: [],
          interests: [],
        },

        activity: {
          recentModules: [],
          recentSearches: [],
          recentPublications: [],
          recentInteractions: [],
          moduleEngagement: {},
        },

        unread: {
          messages: 0,
          notifications: 0,
          feed: 0,
        },

        network: {
          following: 0,
          followers: 0,
          communities: [],
        },

        device: {
          online: true,
          platform: "web",
          screenSize: "medium",
        },

        session: {
          isFirstLaunchToday: false,
          sessionCountToday: 0,
          idleMinutes: 0,
        },
      };
    }

    // --------------------------------------------------------
    // RÉCUPÉRER L'UTILISATEUR
    // --------------------------------------------------------

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // --------------------------------------------------------
    // PRÉFÉRENCES HOME
    // --------------------------------------------------------

    const homePrefs = user.homePreferences ?? {
      favoriteModules: [],
      hiddenSections: [],
      customSectionOrder: [],

      notificationPreferences: {
        newRecommendations: true,
        nearbyAlerts: true,
        opportunities: true,
      },
    };

    // --------------------------------------------------------
    // ACTIVITÉ RÉCENTE
    // --------------------------------------------------------

    const recentActivity = await getRecentActivity(ctx, user._id);

    // --------------------------------------------------------
    // NON LUS
    // --------------------------------------------------------

    const unreadCounts = await getUnreadCounts(ctx, user._id);

    // --------------------------------------------------------
    // RÉSEAU
    // --------------------------------------------------------

    const networkData = await getNetworkData(ctx, user._id);

    // --------------------------------------------------------
    // LOCALISATION
    // --------------------------------------------------------
    //
    // IMPORTANT :
    // Le schéma users possède city/country.
    // On ne lit PAS user.location.
    //

    const location: HomeLocation | undefined =
      user.city || user.country
        ? {
            city: user.city,

            country: user.country,
          }
        : undefined;

    // --------------------------------------------------------
    // MÉTÉO
    // --------------------------------------------------------

    const weather = await getWeather(ctx, location);

    // --------------------------------------------------------
    // SESSION
    // --------------------------------------------------------

    const sessionData = await getSessionData(ctx, user._id);

    // --------------------------------------------------------
    // HEURE ACTUELLE
    // --------------------------------------------------------

    const now = new Date();

    // --------------------------------------------------------
    // CONTEXTE FINAL
    // --------------------------------------------------------

    const context: HomeContext = {
      userId: user._id,

      location,

      time: {
        hour: now.getHours(),

        dayOfWeek: now.getDay(),

        period: getPeriod(now.getHours()),

        timestamp: now.getTime(),
      },

      weather,

      preferences: {
        modules: homePrefs.favoriteModules ?? [],

        categories: [],

        interests: user.interests ?? [],
      },

      activity: recentActivity,

      unread: unreadCounts,

      network: networkData,

      device: {
        online: true,
        platform: "web",
        screenSize: "medium",
      },

      session: sessionData,
    };

    return context;
  },
});

// ============================================================
// PÉRIODE DE LA JOURNÉE
// ============================================================

function getPeriod(
  hour: number,
): "morning" | "afternoon" | "evening" | "night" {
  if (hour >= 5 && hour < 12) {
    return "morning";
  }

  if (hour >= 12 && hour < 17) {
    return "afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "evening";
  }

  return "night";
}

// ============================================================
// ACTIVITÉ RÉCENTE
// ============================================================

async function getRecentActivity(
  _ctx: any,
  _userId: Id<"users">,
): Promise<RecentActivity> {
  /*
   * Cette partie reste volontairement neutre.
   *
   * Nous ne faisons PAS de requête vers une table
   * "activity" ou "interactions" tant que ces tables
   * ne sont pas nécessaires dans le schéma actuel.
   *
   * Les vraies interactions Home peuvent ensuite être
   * branchées sur homeEvents.
   */

  return {
    recentModules: [],

    recentSearches: [],

    recentPublications: [],

    recentInteractions: [],

    moduleEngagement: {},
  };
}

// ============================================================
// COMPTEURS NON LUS
// ============================================================

async function getUnreadCounts(
  _ctx: any,
  _userId: Id<"users">,
): Promise<UnreadCounts> {
  /*
   * Valeurs sûres par défaut.
   *
   * On évite ici de dépendre d'index ou de champs
   * qui peuvent varier dans les modules Messages,
   * Notifications ou Feed.
   */

  return {
    messages: 0,
    notifications: 0,
    feed: 0,
  };
}

// ============================================================
// RÉSEAU
// ============================================================

async function getNetworkData(
  _ctx: any,
  _userId: Id<"users">,
): Promise<NetworkData> {
  /*
   * Cette version ne suppose pas encore la structure
   * exacte des tables de réseau.
   *
   * Le module Network pourra alimenter ces valeurs
   * lorsqu'on branchera définitivement ses queries.
   */

  return {
    following: 0,
    followers: 0,
    communities: [],
  };
}

// ============================================================
// MÉTÉO
// ============================================================

async function getWeather(
  _ctx: any,
  location?: HomeLocation,
): Promise<HomeWeather | undefined> {
  if (!location) {
    return undefined;
  }

  /*
   * Pour le moment, la météo est un contexte local
   * temporaire.
   *
   * Elle pourra ensuite être remplacée par une action
   * externe dédiée sans modifier getHomeContext().
   */

  return {
    temperature: 27,
    condition: "sunny",
    icon: "☀️",
  };
}

// ============================================================
// SESSION
// ============================================================

async function getSessionData(
  _ctx: any,
  _userId: Id<"users">,
): Promise<SessionData> {
  /*
   * Valeurs par défaut jusqu'à la connexion
   * du système de sessions/analytics.
   */

  return {
    isFirstLaunchToday: true,
    sessionCountToday: 1,
    idleMinutes: 0,
  };
}

// ============================================================
// QUERY SIMPLIFIÉE
// ============================================================

/**
 * Version légère du contexte Home.
 *
 * Utile pour les composants qui ont seulement besoin :
 * - de l'utilisateur
 * - de l'heure
 * - des modules favoris
 * - des intérêts
 */
export const getHomeContextSimple = query({
  args: {},

  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return null;
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email))
      .first();

    if (!user) {
      return null;
    }

    const now = new Date();

    return {
      userId: user._id,

      time: {
        hour: now.getHours(),

        dayOfWeek: now.getDay(),

        period: getPeriod(now.getHours()),

        timestamp: now.getTime(),
      },

      preferences: {
        modules: user.homePreferences?.favoriteModules ?? [],

        categories: [],

        interests: user.interests ?? [],
      },

      location: {
        city: user.city,

        country: user.country,
      },
    };
  },
});

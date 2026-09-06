import type { Id } from "@/convex/_generated/dataModel";

export interface AnalyticsDay {
  date: string;
  views: number;
}

export interface AnalyticsLikesDay {
  date: string;
  likes: number;
}

export interface AnalyticsFollowersDay {
  date: string;
  count: number;
}

export interface TopPublication {
  _id: string;
  title: string;
  type: string;
  views: number;
  likes: number;
  comments: number;
}

export interface MyAnalytics {
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

  viewsByDay: AnalyticsDay[];
  likesByDay: AnalyticsLikesDay[];
  followersByDay: AnalyticsFollowersDay[];
  profileViewsByDay: AnalyticsDay[];

  topPublications: TopPublication[];
}

export type AnalyticsMetric = "views" | "likes" | "followers" | "profileViews";

export type AnalyticsPeriod = "7d" | "30d";

export const analyticsService = {
  formatNumber(value: number): string {
    return new Intl.NumberFormat(undefined, {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  },

  formatPercentage(value: number): string {
    return `${value}%`;
  },

  formatDate(date: string): string {
    const parsed = new Date(`${date}T00:00:00`);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });
  },

  getMetricData(
    analytics: MyAnalytics,
    metric: AnalyticsMetric,
    period: AnalyticsPeriod,
  ) {
    const limit = period === "7d" ? 7 : 30;

    switch (metric) {
      case "views":
        return analytics.viewsByDay.slice(-limit);

      case "likes":
        return analytics.likesByDay.slice(-limit).map((item) => ({
          date: item.date,
          likes: item.likes,
        }));

      case "followers":
        return analytics.followersByDay.slice(-limit);

      case "profileViews":
        return analytics.profileViewsByDay.slice(-limit);

      default:
        return [];
    }
  },

  getMetricLabel(metric: AnalyticsMetric): string {
    switch (metric) {
      case "views":
        return "Vues";

      case "likes":
        return "J'aime";

      case "followers":
        return "Abonnés";

      case "profileViews":
        return "Visites du profil";

      default:
        return "";
    }
  },

  getMetricValue(analytics: MyAnalytics, metric: AnalyticsMetric): number {
    switch (metric) {
      case "views":
        return analytics.totalViews;

      case "likes":
        return analytics.totalLikes;

      case "followers":
        return analytics.totalFollowers;

      case "profileViews":
        return analytics.profileViewsByDay.reduce(
          (total, item) => total + item.views,
          0,
        );

      default:
        return 0;
    }
  },

  getPublicationScore(publication: TopPublication): number {
    return publication.views + publication.likes + publication.comments;
  },

  sortTopPublications(publications: TopPublication[]): TopPublication[] {
    return [...publications].sort(
      (a, b) =>
        analyticsService.getPublicationScore(b) -
        analyticsService.getPublicationScore(a),
    );
  },

  getEmptyAnalytics(): MyAnalytics {
    return {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalFollowers: 0,
      totalPublications: 0,
      engagementRate: 0,

      weekSummary: {
        label: "Cette semaine",
        views: 0,
        likes: 0,
      },

      viewsByDay: [],
      likesByDay: [],
      followersByDay: [],
      profileViewsByDay: [],

      topPublications: [],
    };
  },

  isValidAnalytics(value: unknown): value is MyAnalytics {
    if (!value || typeof value !== "object") {
      return false;
    }

    const analytics = value as MyAnalytics;

    return (
      typeof analytics.totalViews === "number" &&
      typeof analytics.totalLikes === "number" &&
      typeof analytics.totalComments === "number" &&
      typeof analytics.totalFollowers === "number" &&
      typeof analytics.totalPublications === "number" &&
      typeof analytics.engagementRate === "number"
    );
  },
};

export default analyticsService;

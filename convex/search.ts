import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel.d.ts";

// ── Types for AdvancedSearch queries ─────────────────────────────────────────

type PublicationSearchResult = {
  _id: Id<"publications">;
  title: string;
  description: string;
  type: string;
  location: string | undefined;
  price: string | undefined;
  author: { name: string | undefined } | null;
};

type UserSearchResult = {
  _id: Id<"users">;
  name: string | undefined;
  bio: string | undefined;
  city: string | undefined;
  avatar: string | undefined;
};

type TrendingTag = {
  tag: string;
  count: number;
};

export const searchPublications = query({
  args: {
    q: v.string(),
    type: v.optional(v.union(
      v.literal("immo"), v.literal("job"), v.literal("service"),
      v.literal("evenement"), v.literal("community"), v.literal("agri"),
      v.literal("sante"), v.literal("transport"), v.literal("annonce"),
    )),
  },
  handler: async (ctx, args): Promise<PublicationSearchResult[]> => {
    const results = await ctx.db
      .query("publications")
      .withSearchIndex("search_publications", (search) => {
        const base = search.search("title", args.q).eq("status", "active");
        return base;
      })
      .take(20);

    const filtered = args.type ? results.filter(r => r.type === args.type) : results;

    return await Promise.all(filtered.map(async (pub) => {
      const author = await ctx.db.get(pub.authorId);
      return {
        _id: pub._id,
        title: pub.title,
        description: pub.description,
        type: pub.type,
        location: pub.location,
        price: pub.price,
        author: author ? { name: author.name } : null,
      };
    }));
  },
});

export const searchUsers = query({
  args: { q: v.string() },
  handler: async (ctx, args): Promise<UserSearchResult[]> => {
    // Simple scan with filter since users have no search index
    const allUsers = await ctx.db.query("users").take(100);
    const q = args.q.toLowerCase();
    return allUsers
      .filter(u =>
        (u.name?.toLowerCase().includes(q) ?? false) ||
        (u.bio?.toLowerCase().includes(q) ?? false) ||
        (u.city?.toLowerCase().includes(q) ?? false)
      )
      .slice(0, 10)
      .map(u => ({
        _id: u._id,
        name: u.name,
        bio: u.bio,
        city: u.city,
        avatar: u.avatar,
      }));
  },
});

export const getTrendingTags = query({
  args: {},
  handler: async (ctx): Promise<TrendingTag[]> => {
    // Get tags from recent publications
    const recent = await ctx.db.query("publications").order("desc").take(200);
    const tagCounts: Record<string, number> = {};
    for (const pub of recent) {
      for (const tag of pub.tags) {
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([tag, count]) => ({ tag, count }));
  },
});

// Return types for the smartSearch query
type PublicationResult = {
  _id: Id<"publications">;
  title: string;
  type: string;
  price: string | undefined;
  location: string | undefined;
};

type JobResult = {
  _id: Id<"jobListings">;
  title: string;
  company: string;
  city: string;
  contractType: string;
};

type PropertyResult = {
  _id: Id<"properties">;
  title: string;
  type: string;
  price: number;
  city: string;
};

type CourseResult = {
  _id: Id<"courses">;
  title: string;
  category: string;
  isFree: boolean;
  price: number;
};

type SmartSearchResult = {
  publications: PublicationResult[];
  jobs: JobResult[];
  properties: PropertyResult[];
  courses: CourseResult[];
};

export const smartSearch = query({
  args: { query: v.string() },
  handler: async (ctx, args): Promise<SmartSearchResult> => {
    const q = args.query;

    // Search publications (active status)
    const publications = await ctx.db
      .query("publications")
      .withSearchIndex("search_publications", (search) =>
        search.search("title", q).eq("status", "active"),
      )
      .take(4);

    // Search job listings (open status)
    const jobs = await ctx.db
      .query("jobListings")
      .withSearchIndex("search_jobs", (search) =>
        search.search("title", q).eq("status", "open"),
      )
      .take(4);

    // Search properties (available status)
    const properties = await ctx.db
      .query("properties")
      .withSearchIndex("search_properties", (search) =>
        search.search("title", q).eq("status", "available"),
      )
      .take(4);

    // Search courses (published status)
    const courses = await ctx.db
      .query("courses")
      .withSearchIndex("search_courses", (search) =>
        search.search("title", q).eq("status", "published"),
      )
      .take(4);

    return {
      publications: publications.map((p) => ({
        _id: p._id,
        title: p.title,
        type: p.type,
        price: p.price,
        location: p.location,
      })),
      jobs: jobs.map((j) => ({
        _id: j._id,
        title: j.title,
        company: j.company,
        city: j.city,
        contractType: j.contractType,
      })),
      properties: properties.map((p) => ({
        _id: p._id,
        title: p.title,
        type: p.type,
        price: p.price,
        city: p.city,
      })),
      courses: courses.map((c) => ({
        _id: c._id,
        title: c.title,
        category: c.category,
        isFree: c.isFree,
        price: c.price,
      })),
    };
  },
});

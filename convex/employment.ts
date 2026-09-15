import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity)
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Connexion requise",
    });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) =>
      q.eq("tokenIdentifier", identity.tokenIdentifier),
    )
    .unique();
  if (!user)
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  return user;
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB LISTINGS
// ─────────────────────────────────────────────────────────────────────────────
export const listJobs = query({
  args: {
    city: v.optional(v.string()),
    status: v.optional(v.string()),
    employerId: v.optional(v.id("users")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    if (args.employerId) {
      return ctx.db
        .query("jobListings")
        .withIndex("by_employer", (q) => q.eq("employerId", args.employerId!))
        .paginate(args.paginationOpts);
    }
    return ctx.db
      .query("jobListings")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .paginate(args.paginationOpts);
  },
});

export const getJob = query({
  args: { id: v.id("jobListings") },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.id);
    if (!job) return null;
    const employer = await ctx.db.get(job.employerId);
    return {
      ...job,
      employerName: employer?.name,
      employerAvatar: employer?.avatar,
    };
  },
});

export const searchJobs = query({
  args: { q: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("jobListings")
      .withSearchIndex("search_jobs", (qi) => qi.search("title", args.q))
      .take(20);
  },
});

export const createJob = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    company: v.string(),
    companyLogo: v.optional(v.string()),
    category: v.string(),
    contractType: v.union(
      v.literal("cdi"),
      v.literal("cdd"),
      v.literal("stage"),
      v.literal("freelance"),
      v.literal("alternance"),
      v.literal("benevole"),
    ),
    salaryMin: v.optional(v.number()),
    salaryMax: v.optional(v.number()),
    currency: v.optional(v.string()),
    city: v.string(),
    remote: v.boolean(),
    skills: v.array(v.string()),
    deadline: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // 1. Créer l'offre d'emploi
    const jobId = await ctx.db.insert("jobListings", {
      ...args,
      employerId: user._id,
      status: "open",
    });

    // 2. Créer la publication associée pour le feed
    await ctx.db.insert("publications", {
      type: "job",
      title: args.title,
      description: args.description,
      authorId: user._id,
      tags: args.skills ?? [],
      images: [],
      meta: JSON.stringify({
        jobId,
        company: args.company,
        companyLogo: args.companyLogo,
        contract: args.contractType,
        salaryMin: args.salaryMin,
        salaryMax: args.salaryMax,
        currency: args.currency || "USD",
        city: args.city,
        remote: args.remote,
        skills: args.skills,
        status: "open",
        deadline: args.deadline,
      }),
      likeCount: 0,
      commentCount: 0,
      viewCount: 0,
      status: "active",
    });

    return jobId;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// LINK PUBLICATION ↔ JOB
// ─────────────────────────────────────────────────────────────────────────────
export const getJobByPublication = query({
  args: {
    publicationId: v.id("publications"),
  },
  handler: async (ctx, args) => {
    const publication = await ctx.db.get(args.publicationId);

    if (!publication) return null;
    if (publication.type !== "job") return null;

    // 1. Si meta contient déjà le jobId, on le privilégie
    if (publication.meta) {
      try {
        const meta =
          typeof publication.meta === "string"
            ? JSON.parse(publication.meta)
            : publication.meta;

        if (meta?.jobId) {
          const job = await ctx.db.get(meta.jobId);
          if (job) return job;
        }
      } catch {
        // Meta invalide : on ignore et on passe au fallback
      }
    }

    // 2. Fallback : rechercher par auteur + titre (insensible à la casse)
    const jobs = await ctx.db
      .query("jobListings")
      .withIndex("by_employer", (q) => q.eq("employerId", publication.authorId))
      .collect();

    const matchedJob = jobs.find(
      (job) =>
        job.title.trim().toLowerCase() ===
        publication.title.trim().toLowerCase(),
    );

    return matchedJob ?? null;
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// JOB APPLICATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const applyToJob = mutation({
  args: {
    jobId: v.id("jobListings"),
    coverLetter: v.optional(v.string()),
    cvUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("jobApplications")
      .withIndex("by_job_and_applicant", (q) =>
        q.eq("jobId", args.jobId).eq("applicantId", user._id),
      )
      .unique();
    if (existing)
      throw new ConvexError({
        code: "CONFLICT",
        message: "Candidature déjà envoyée",
      });
    return ctx.db.insert("jobApplications", {
      ...args,
      applicantId: user._id,
      status: "submitted",
      appliedAt: new Date().toISOString(),
    });
  },
});

export const getMyApplications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const apps = await ctx.db
      .query("jobApplications")
      .withIndex("by_applicant", (q) => q.eq("applicantId", user._id))
      .order("desc")
      .take(30);
    return Promise.all(
      apps.map(async (a) => {
        const job = await ctx.db.get(a.jobId);
        return { ...a, jobTitle: job?.title, jobCompany: job?.company };
      }),
    );
  },
});

export const getJobApplications = query({
  args: { jobId: v.id("jobListings") },
  handler: async (ctx, args) => {
    const applications = await ctx.db
      .query("jobApplications")
      .withIndex("by_job", (q) => q.eq("jobId", args.jobId))
      .collect();
    return Promise.all(
      applications.map(async (a) => {
        const applicant = await ctx.db.get(a.applicantId);
        return {
          ...a,
          applicantName: applicant?.name,
          applicantAvatar: applicant?.avatar,
        };
      }),
    );
  },
});

export const updateApplicationStatus = mutation({
  args: {
    id: v.id("jobApplications"),
    status: v.union(
      v.literal("viewed"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("hired"),
    ),
  },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// BUSINESS PROFILES
// ─────────────────────────────────────────────────────────────────────────────
export const getBusinessProfile = query({
  args: { userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    if (args.userId) {
      return ctx.db
        .query("businessProfiles")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .unique();
    }
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return null;
    return ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const upsertBusinessProfile = mutation({
  args: {
    companyName: v.string(),
    sector: v.string(),
    description: v.string(),
    logo: v.optional(v.string()),
    coverImage: v.optional(v.string()),
    city: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    employeeCount: v.optional(v.string()),
    foundedYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("businessProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("businessProfiles", {
      ...args,
      userId: user._id,
      verified: false,
      rating: undefined,
      reviewCount: 0,
    });
  },
});

export const listBusinessProfiles = query({
  args: { sector: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.sector && args.sector !== "Tout") {
      return ctx.db
        .query("businessProfiles")
        .withIndex("by_sector", (q) => q.eq("sector", args.sector!))
        .take(30);
    }
    return ctx.db.query("businessProfiles").take(30);
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// FREELANCE MISSIONS
// ─────────────────────────────────────────────────────────────────────────────
export const listMissions = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("freelanceMissions")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .paginate(args.paginationOpts);
  },
});

export const createMission = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    skills: v.array(v.string()),
    budget: v.optional(v.number()),
    currency: v.optional(v.string()),
    duration: v.optional(v.string()),
    remote: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("freelanceMissions", {
      ...args,
      clientId: user._id,
      status: "open",
    });
  },
});

export const bidOnMission = mutation({
  args: {
    missionId: v.id("freelanceMissions"),
    proposal: v.string(),
    bidAmount: v.optional(v.number()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("freelanceMissionBids", {
      ...args,
      freelancerId: user._id,
      status: "pending",
      submittedAt: new Date().toISOString(),
    });
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MENTOR
// ─────────────────────────────────────────────────────────────────────────────
export const listMentors = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const profiles = await ctx.db
      .query("mentorProfiles")
      .paginate(args.paginationOpts);
    return {
      ...profiles,
      page: await Promise.all(
        profiles.page.map(async (p) => {
          const user = await ctx.db.get(p.userId);
          return {
            ...p,
            name: user?.name,
            avatar: user?.avatar,
            city: user?.city,
          };
        }),
      ),
    };
  },
});

export const upsertMentorProfile = mutation({
  args: {
    expertise: v.array(v.string()),
    bio: v.string(),
    hourlyRate: v.optional(v.number()),
    currency: v.optional(v.string()),
    availability: v.string(),
    languages: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db
      .query("mentorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, args);
      return existing._id;
    }
    return ctx.db.insert("mentorProfiles", {
      ...args,
      userId: user._id,
      totalSessions: 0,
      verified: false,
    });
  },
});

export const bookMentorSession = mutation({
  args: {
    mentorId: v.id("users"),
    scheduledAt: v.string(),
    durationMinutes: v.number(),
    topic: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return ctx.db.insert("mentorSessions", {
      ...args,
      menteeId: user._id,
      status: "scheduled",
    });
  },
});

export const getMySessions = query({
  args: { role: v.union(v.literal("mentor"), v.literal("mentee")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const sessions =
      args.role === "mentor"
        ? await ctx.db
            .query("mentorSessions")
            .withIndex("by_mentor", (q) => q.eq("mentorId", user._id))
            .order("desc")
            .take(20)
        : await ctx.db
            .query("mentorSessions")
            .withIndex("by_mentee", (q) => q.eq("menteeId", user._id))
            .order("desc")
            .take(20);
    return Promise.all(
      sessions.map(async (s) => {
        const other = await ctx.db.get(
          args.role === "mentor" ? s.menteeId : s.mentorId,
        );
        return { ...s, otherName: other?.name, otherAvatar: other?.avatar };
      }),
    );
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REFERRALS (Parrainage)
// ─────────────────────────────────────────────────────────────────────────────
export const createReferralCode = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const code = `REF-${user._id.substring(0, 8).toUpperCase()}`;
    return { code, userId: user._id };
  },
});

export const useReferralCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .collect();
    if (referrals.length === 0)
      throw new ConvexError({ code: "NOT_FOUND", message: "Code invalide" });
    const existing = referrals.find((r) => r.referredId === user._id);
    if (existing)
      throw new ConvexError({ code: "CONFLICT", message: "Code déjà utilisé" });
    const referral = referrals[0];
    if (referral.referrerId === user._id)
      throw new ConvexError({
        code: "BAD_REQUEST",
        message: "Impossible d'utiliser votre propre code",
      });
    await ctx.db.insert("referrals", {
      referrerId: referral.referrerId,
      referredId: user._id,
      code: args.code,
      status: "validated",
      validatedAt: new Date().toISOString(),
    });
  },
});

export const getMyReferrals = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();
    if (!user) return [];
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", user._id))
      .collect();
    return Promise.all(
      referrals.map(async (r) => {
        const referred = await ctx.db.get(r.referredId);
        return {
          ...r,
          referredName: referred?.name,
          referredAvatar: referred?.avatar,
        };
      }),
    );
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

async function requireUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError({ message: "Non authentifié", code: "UNAUTHENTICATED" });
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .unique();
  if (!user) throw new ConvexError({ message: "Utilisateur introuvable", code: "NOT_FOUND" });
  return user;
}

// ─── COURSES ─────────────────────────────────────────────────────────────────

export const listPublishedCourses = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const q = args.category
      ? ctx.db.query("courses").withIndex("by_category", (q) => q.eq("category", args.category!))
      : ctx.db.query("courses").withIndex("by_status", (q) => q.eq("status", "published"));
    const courses = await q.take(50);
    return courses.filter((c) => c.status === "published");
  },
});

export const getMyEnrollments = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const result = await Promise.all(
      enrollments.map(async (e) => {
        const course = await ctx.db.get(e.courseId);
        return course ? { ...e, course } : null;
      })
    );
    return result.filter(Boolean);
  },
});

export const enrollInCourse = mutation({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Check if already enrolled
    const existing = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_and_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", user._id)
      )
      .unique();
    if (existing) return existing._id;
    const id = await ctx.db.insert("courseEnrollments", {
      courseId: args.courseId,
      userId: user._id,
      enrolledAt: new Date().toISOString(),
      progressPct: 0,
    });
    // Increment enrollment count
    const course = await ctx.db.get(args.courseId);
    if (course) {
      await ctx.db.patch(args.courseId, { enrollmentCount: course.enrollmentCount + 1 });
    }
    return id;
  },
});

export const completeLesson = mutation({
  args: { lessonId: v.id("courseLessons"), courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    // Mark lesson as complete
    const existing = await ctx.db
      .query("lessonProgress")
      .withIndex("by_lesson_and_user", (q) =>
        q.eq("lessonId", args.lessonId).eq("userId", user._id)
      )
      .unique();
    if (!existing) {
      await ctx.db.insert("lessonProgress", {
        lessonId: args.lessonId,
        userId: user._id,
        completedAt: new Date().toISOString(),
      });
    }
    // Update enrollment progress
    const enrollment = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_course_and_user", (q) =>
        q.eq("courseId", args.courseId).eq("userId", user._id)
      )
      .unique();
    if (enrollment) {
      const allLessons = await ctx.db
        .query("courseLessons")
        .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
        .collect();
      const completedLessons = await Promise.all(
        allLessons.map((l) =>
          ctx.db
            .query("lessonProgress")
            .withIndex("by_lesson_and_user", (q) =>
              q.eq("lessonId", l._id).eq("userId", user._id)
            )
            .unique()
        )
      );
      const doneCount = completedLessons.filter(Boolean).length;
      const progressPct = allLessons.length > 0 ? Math.round((doneCount / allLessons.length) * 100) : 0;
      await ctx.db.patch(enrollment._id, { progressPct, lastLessonId: args.lessonId });
    }
  },
});

export const getCourseLessons = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("courseLessons")
      .withIndex("by_course_and_order", (q) => q.eq("courseId", args.courseId))
      .collect();
  },
});

export const getLessonProgress = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const lessons = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();
    const progress = await Promise.all(
      lessons.map(async (l) => {
        const p = await ctx.db
          .query("lessonProgress")
          .withIndex("by_lesson_and_user", (q) =>
            q.eq("lessonId", l._id).eq("userId", user._id)
          )
          .unique();
        return { lessonId: l._id, done: !!p };
      })
    );
    return progress;
  },
});

// ─── QUIZ ─────────────────────────────────────────────────────────────────────

export const listPublicQuizzes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("quizzes")
      .filter((q) => q.eq(q.field("isPublic"), true))
      .take(30);
  },
});

export const getMyQuizAttempts = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);
    const result = await Promise.all(
      attempts.map(async (a) => {
        const quiz = await ctx.db.get(a.quizId);
        return { ...a, quiz };
      })
    );
    return result;
  },
});

export const submitQuizAttempt = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
    score: v.number(),
    passed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId: user._id,
      score: args.score,
      answers: args.answers,
      completedAt: new Date().toISOString(),
      passed: args.passed,
    });
  },
});

// ─── CERTIFICATIONS ───────────────────────────────────────────────────────────

export const getMyCertificates = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
  },
});

// ─── MENTORAT ─────────────────────────────────────────────────────────────────

export const listMentors = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("mentorProfiles").take(20);
    const result = await Promise.all(
      profiles.map(async (p) => {
        const user = await ctx.db.get(p.userId);
        return user ? { ...p, user } : null;
      })
    );
    return result.filter(Boolean);
  },
});

export const getMyMentorProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return await ctx.db
      .query("mentorProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

export const getMyMentorSessions = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const asMentee = await ctx.db
      .query("mentorSessions")
      .withIndex("by_mentee", (q) => q.eq("menteeId", user._id))
      .order("desc")
      .take(10);
    const result = await Promise.all(
      asMentee.map(async (s) => {
        const mentor = await ctx.db.get(s.mentorId);
        return { ...s, mentor };
      })
    );
    return result;
  },
});

export const requestMentorSession = mutation({
  args: {
    mentorUserId: v.id("users"),
    topic: v.string(),
    scheduledAt: v.string(),
    durationMinutes: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    return await ctx.db.insert("mentorSessions", {
      mentorId: args.mentorUserId,
      menteeId: user._id,
      scheduledAt: args.scheduledAt,
      durationMinutes: args.durationMinutes,
      topic: args.topic,
      status: "scheduled",
    });
  },
});

// ─── STATS SUMMARY ────────────────────────────────────────────────────────────

export const getEducationStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const enrollments = await ctx.db
      .query("courseEnrollments")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const certificates = await ctx.db
      .query("certificates")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const sessions = await ctx.db
      .query("mentorSessions")
      .withIndex("by_mentee", (q) => q.eq("menteeId", user._id))
      .collect();
    return {
      coursesEnrolled: enrollments.length,
      quizAttempts: attempts.length,
      quizPassed: attempts.filter((a) => a.passed).length,
      certificates: certificates.length,
      mentorSessions: sessions.length,
    };
  },
});

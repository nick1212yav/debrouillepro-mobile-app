import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// Temporary compatibility layer.
// These endpoints keep unfinished modules compiling until each module receives
// its own dedicated backend (school.ts, church.ts, sport.ts, etc.).
// ============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// SCHOOL
// ─────────────────────────────────────────────────────────────────────────────

export const listMySchoolMessages = query({
  args: {},
  handler: async () => {
    return [] as {
      _id: Id<"schoolMessages">; // ✅ corrigé : Id au lieu de string
      fromName: string;
      subject: string;
      read: boolean;
    }[];
  },
});

export const markSchoolMessageRead = mutation({
  args: { messageId: v.id("schoolMessages") },
  handler: async () => {
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// CHURCH
// ─────────────────────────────────────────────────────────────────────────────

export const getChurchSubscription = query({
  args: {
    churchName: v.string(),
  },
  handler: async () => {
    return {
      subscribed: false,
    };
  },
});

export const listMyDonations = query({
  args: {},
  handler: async () => {
    return [] as {
      amount: number;
      currency: string;
      createdAt: number;
    }[];
  },
});

export const toggleChurchSubscription = mutation({
  args: {
    churchName: v.string(),
  },
  handler: async () => {
    return { success: true };
  },
});

export const makeDonation = mutation({
  args: {
    amount: v.number(),
    currency: v.string(),
    churchName: v.string(),
    note: v.optional(v.string()),
  },
  handler: async () => {
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// FAVORITES
// ─────────────────────────────────────────────────────────────────────────────

export const listMyFavorites = query({
  args: {
    itemType: v.string(),
  },
  handler: async () => {
    return [] as number[];
  },
});

export const toggleFavorite = mutation({
  args: {
    itemId: v.number(),
    itemType: v.string(),
    itemName: v.string(),
  },
  handler: async () => {
    return { success: true };
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// SPORT
// ─────────────────────────────────────────────────────────────────────────────

export const listMyClubMemberships = query({
  args: {},
  handler: async () => {
    // ✅ retourne number[] pour correspondre à l'utilisation actuelle de SportPage
    return [] as number[];
  },
});

export const listMyTournamentRegistrations = query({
  args: {},
  handler: async () => {
    return [] as {
      tournamentName: string;
      sport: string;
    }[];
  },
});

export const joinClub = mutation({
  args: {
    clubId: v.id("sportClubs"),
  },
  handler: async () => {
    return { success: true };
  },
});

export const leaveClub = mutation({
  args: {
    clubId: v.id("sportClubs"),
  },
  handler: async () => {
    return { success: true };
  },
});

export const registerTournament = mutation({
  args: {
    tournamentName: v.string(),
    sport: v.string(),
  },
  handler: async () => {
    return { success: true };
  },
});

export const unregisterTournament = mutation({
  args: {
    tournamentName: v.string(),
    sport: v.string(),
  },
  handler: async () => {
    return { success: true };
  },
});

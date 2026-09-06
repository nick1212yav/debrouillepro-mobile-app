// src/features/messages/presence/services/presence.service.ts

import type { Id } from "@/convex/_generated/dataModel";

// ============================================================================
// TYPES
// ============================================================================

export type PresenceStatus = "online" | "away" | "offline";

export type UserPresence = {
  userId: Id<"users">;
  status: PresenceStatus;
  lastSeen: string | null;
  device: string | null;
};

// ============================================================================
// MUTATIONS / QUERIES
// ============================================================================

type SetPresenceMutation = (args: {
  status: PresenceStatus;
  device?: string;
}) => Promise<Id<"presence">>;

type DevicePresenceMutation = (args: {
  device?: string;
}) => Promise<Id<"presence">>;

type GoOfflineMutation = () => Promise<Id<"presence"> | null>;

type GetPresenceQuery = (args: {
  userId: Id<"users">;
}) => Promise<UserPresence>;

type GetUsersPresenceQuery = (args: {
  userIds: Id<"users">[];
}) => Promise<UserPresence[]>;

// ============================================================================
// SERVICE
// ============================================================================

export const presenceService = {
  // --------------------------------------------------------------------------
  // SET PRESENCE
  // --------------------------------------------------------------------------

  setPresence(
    mutation: SetPresenceMutation,
    status: PresenceStatus,
    device?: string,
  ) {
    return mutation({
      status,
      ...(device ? { device } : {}),
    });
  },

  // --------------------------------------------------------------------------
  // ONLINE
  // --------------------------------------------------------------------------

  goOnline(mutation: DevicePresenceMutation, device?: string) {
    return mutation({
      ...(device ? { device } : {}),
    });
  },

  // --------------------------------------------------------------------------
  // AWAY
  // --------------------------------------------------------------------------

  goAway(mutation: DevicePresenceMutation, device?: string) {
    return mutation({
      ...(device ? { device } : {}),
    });
  },

  // --------------------------------------------------------------------------
  // OFFLINE
  //
  // La mutation Convex ne prend aucun argument.
  // --------------------------------------------------------------------------

  goOffline(mutation: GoOfflineMutation) {
    return mutation();
  },

  // --------------------------------------------------------------------------
  // HEARTBEAT
  // --------------------------------------------------------------------------

  heartbeat(mutation: DevicePresenceMutation, device?: string) {
    return mutation({
      ...(device ? { device } : {}),
    });
  },

  // --------------------------------------------------------------------------
  // GET PRESENCE
  // --------------------------------------------------------------------------

  getPresence(query: GetPresenceQuery, userId: Id<"users">) {
    return query({ userId });
  },

  // --------------------------------------------------------------------------
  // GET USERS PRESENCE
  // --------------------------------------------------------------------------

  getUsersPresence(query: GetUsersPresenceQuery, userIds: Id<"users">[]) {
    return query({ userIds });
  },
};

export default presenceService;

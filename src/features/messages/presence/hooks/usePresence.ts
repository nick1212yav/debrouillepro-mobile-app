import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef } from "react";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

import type {
  PresenceStatus,
  UserPresence,
} from "../services/presence.service";
import { presenceService } from "../services/presence.service";

const HEARTBEAT_INTERVAL = 30_000;

interface UsePresenceOptions {
  userId?: Id<"users">;
  userIds?: Id<"users">[];
  device?: string;
  autoStart?: boolean;
}

export function usePresence(options: UsePresenceOptions = {}) {
  const { userId, userIds = [], device = "web", autoStart = true } = options;

  const { isAuthenticated } = useConvexAuth();

  const setPresenceMutation = useMutation(api.messages.presence.setPresence);

  const goOnlineMutation = useMutation(api.messages.presence.goOnline);

  const goAwayMutation = useMutation(api.messages.presence.goAway);

  const goOfflineMutation = useMutation(api.messages.presence.goOffline);

  const heartbeatMutation = useMutation(api.messages.presence.heartbeat);

  const presence = useQuery(
    api.messages.presence.getPresence,
    isAuthenticated && userId ? { userId } : "skip",
  );

  const uniqueUserIds = [...new Set(userIds.map((id) => id.toString()))]
    .map((id) => userIds.find((userIdValue) => userIdValue.toString() === id))
    .filter((value): value is Id<"users"> => value !== undefined);

  const usersPresence = useQuery(
    api.messages.presence.getUsersPresence,
    isAuthenticated && uniqueUserIds.length > 0
      ? {
          userIds: uniqueUserIds,
        }
      : "skip",
  );

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const onlineRef = useRef(false);

  const setStatus = useCallback(
    async (status: PresenceStatus) => {
      if (!isAuthenticated) {
        return null;
      }

      try {
        const result = await presenceService.setPresence(
          setPresenceMutation,
          status,
          device,
        );

        onlineRef.current = status === "online";

        return result;
      } catch (error) {
        console.error(
          "[usePresence] Impossible de modifier la présence:",
          error,
        );

        throw error;
      }
    },
    [device, isAuthenticated, setPresenceMutation],
  );

  const goOnline = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const result = await presenceService.goOnline(goOnlineMutation, device);

      onlineRef.current = true;

      return result;
    } catch (error) {
      console.error("[usePresence] Impossible de passer en ligne:", error);

      throw error;
    }
  }, [device, goOnlineMutation, isAuthenticated]);

  const goAway = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const result = await presenceService.goAway(goAwayMutation, device);

      onlineRef.current = false;

      return result;
    } catch (error) {
      console.error("[usePresence] Impossible de passer en absent:", error);

      throw error;
    }
  }, [device, goAwayMutation, isAuthenticated]);

  const goOffline = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      const result = await presenceService.goOffline(goOfflineMutation);

      onlineRef.current = false;

      return result;
    } catch (error) {
      console.error("[usePresence] Impossible de passer hors ligne:", error);

      throw error;
    }
  }, [goOfflineMutation, isAuthenticated]);

  const heartbeat = useCallback(async () => {
    if (!isAuthenticated) {
      return null;
    }

    try {
      return await presenceService.heartbeat(heartbeatMutation, device);
    } catch (error) {
      console.error("[usePresence] Heartbeat échoué:", error);

      return null;
    }
  }, [device, heartbeatMutation, isAuthenticated]);

  const getUserPresence = useCallback(
    (targetUserId: Id<"users">) => {
      if (!usersPresence || usersPresence.length === 0) {
        return null;
      }

      return usersPresence.find((item) => item.userId === targetUserId) ?? null;
    },
    [usersPresence],
  );

  useEffect(() => {
    if (!isAuthenticated || !autoStart) {
      return;
    }

    void goOnline();

    heartbeatRef.current = setInterval(() => {
      void heartbeat();
    }, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);

        heartbeatRef.current = null;
      }

      if (onlineRef.current) {
        void goOffline();
      }
    };
  }, [autoStart, goOffline, goOnline, heartbeat, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !autoStart) {
      return;
    }

    const handleVisibilityChange = () => {
      if (undefined === "visible") {
        void goOnline();
      } else {
        void goAway();
      }
    };

    undefined("visibilitychange", handleVisibilityChange);

    return () => {
      undefined("visibilitychange", handleVisibilityChange);
    };
  }, [autoStart, goAway, goOnline, isAuthenticated]);

  return {
    presence: (presence as UserPresence | null | undefined) ?? null,

    usersPresence: (usersPresence as UserPresence[] | undefined) ?? [],

    isLoadingSingle:
      isAuthenticated && Boolean(userId) && presence === undefined,

    isLoadingMultiple:
      isAuthenticated &&
      uniqueUserIds.length > 0 &&
      usersPresence === undefined,

    setStatus,
    goOnline,
    goAway,
    goOffline,
    heartbeat,
    getUserPresence,
  };
}

export default usePresence;

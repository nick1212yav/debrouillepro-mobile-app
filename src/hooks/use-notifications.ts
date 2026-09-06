// src/hooks/use-notifications.ts
import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d";
import type { Doc } from "@/convex/_generated/dataModel.d";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// ── Types ─────────────────────────────────────────────────────────────────────
export type NotifType =
  | "message"
  | "job"
  | "immo"
  | "payment"
  | "system"
  | "delivery"
  | "sante"
  | "agri"
  | "transport"
  | "community"
  | "like"
  | "comment"
  | "follow"
  | "boost"
  | "event"
  | "streak"
  | "digest";

export type NotifPriority = "high" | "normal" | "low";

export interface Notif {
  id: Id<"notifications">;
  type: NotifType;
  module: string;
  title: string;
  body: string;
  time: string;
  timestamp: number;
  read: boolean;
  pinned: boolean;
  priority: NotifPriority;
  initials?: string;
  actionPage?: string;
  amount?: string;
  actionButtons?: { label: string; variant: "primary" | "danger" }[];
}

export interface NotifPrefs {
  enabled: Record<NotifType, boolean>;
  dndEnabled: boolean;
  dndFrom: string;
  dndTo: string;
}

// ── Preferences ──────────────────────────────────────────────────────────────
const PREFS_KEY = "dbp_notif_prefs_v3";

const DEFAULT_PREFS: NotifPrefs = {
  enabled: {
    message: true,
    job: true,
    immo: true,
    payment: true,
    system: true,
    delivery: true,
    sante: true,
    agri: true,
    transport: true,
    community: true,
    like: true,
    comment: true,
    follow: true,
    boost: true,
    event: true,
    streak: true,
    digest: true,
  },
  dndEnabled: false,
  dndFrom: "22:00",
  dndTo: "07:00",
};

function loadPrefs(): NotifPrefs {
  try {
    return (
      JSON.parse(localStorage.getItem(PREFS_KEY) ?? "null") || DEFAULT_PREFS
    );
  } catch {
    return DEFAULT_PREFS;
  }
}

function fmtRelative(ts: number): string {
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Hier";
  if (diffD < 7) return `Il y a ${diffD}j`;
  return new Date(ts).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

// ── Seeder hook ──────────────────────────────────────────────────────────────
export function useNotificationsSeeder() {
  const { isAuthenticated } = useFirebaseAuth();
  const seed = useMutation(api.notifications.seedDemo);

  useEffect(() => {
    if (isAuthenticated) {
      seed({}).catch(() => {
        /* ignore */
      });
    }
  }, [isAuthenticated, seed]);
}

// ── Main hook ──────────────────────────────────────────────────────────────────
export function useNotifications() {
  const { isAuthenticated } = useFirebaseAuth();
  const [prefs, setPrefs] = useState<NotifPrefs>(loadPrefs);

  const savePrefs = useCallback((next: NotifPrefs) => {
    setPrefs(next);
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  }, []);

  // ✅ Requêtes Convex sans email (l'identité est récupérée via ctx.auth)
  const rawNotifs = useQuery(
    api.notifications.list,
    isAuthenticated ? {} : "skip",
  ) as Doc<"notifications">[] | undefined;

  const unreadRaw = useQuery(
    api.notifications.unreadCount,
    isAuthenticated ? {} : "skip",
  ) as number | undefined;

  // Mutations sans email
  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);
  const dismissMutation = useMutation(api.notifications.dismiss);

  // ✅ Transformation en Notif[]
  const notifs: Notif[] = (rawNotifs ?? []).map((n) => ({
    id: n._id,
    type: n.type as NotifType,
    module: n.module,
    title: n.title,
    body: n.body,
    time: fmtRelative(n._creationTime),
    timestamp: n._creationTime,
    read: n.read,
    pinned: n.pinned,
    priority: n.priority as NotifPriority,
    initials: n.initials,
    actionPage: n.actionPage,
    amount: n.amount,
    actionButtons: n.actionButtons,
  }));

  const unreadTotal = unreadRaw ?? 0;

  const badgeCounts: Record<string, number> = {};
  notifs.forEach((n) => {
    if (!n.read && prefs.enabled[n.type]) {
      badgeCounts[n.module] = (badgeCounts[n.module] ?? 0) + 1;
    }
  });

  const markRead = useCallback(
    (id: Id<"notifications">) => {
      if (!isAuthenticated) return;
      markReadMutation({ id }).catch(() => {
        /* ignore */
      });
    },
    [markReadMutation, isAuthenticated],
  );

  const markAllRead = useCallback(() => {
    if (!isAuthenticated) return;
    markAllReadMutation({}).catch(() => {
      /* ignore */
    });
  }, [markAllReadMutation, isAuthenticated]);

  const dismiss = useCallback(
    (id: Id<"notifications">) => {
      if (!isAuthenticated) return;
      dismissMutation({ id }).catch(() => {
        /* ignore */
      });
    },
    [dismissMutation, isAuthenticated],
  );

  const updatePref = useCallback(
    (type: NotifType, enabled: boolean) => {
      savePrefs({ ...prefs, enabled: { ...prefs.enabled, [type]: enabled } });
    },
    [prefs, savePrefs],
  );

  const updateDnd = useCallback(
    (updates: Partial<NotifPrefs>) => {
      savePrefs({ ...prefs, ...updates });
    },
    [prefs, savePrefs],
  );

  return {
    notifs,
    prefs,
    unreadTotal,
    badgeCounts,
    markRead,
    markAllRead,
    dismiss,
    updatePref,
    updateDnd,
  };
}

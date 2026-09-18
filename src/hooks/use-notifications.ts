// src/hooks/use-notifications.ts
import { useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
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
  | "digest"
  | "annonce";

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

// ── Préférences par défaut ───────────────────────────────────────────────────
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
    annonce: true,
  },
  dndEnabled: false,
  dndFrom: "22:00",
  dndTo: "07:00",
};

function parsePrefs(raw: string | undefined): NotifPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const parsed = JSON.parse(raw);
    return {
      dndEnabled:
        typeof parsed?.dndEnabled === "boolean"
          ? parsed.dndEnabled
          : DEFAULT_PREFS.dndEnabled,
      dndFrom:
        typeof parsed?.dndFrom === "string"
          ? parsed.dndFrom
          : DEFAULT_PREFS.dndFrom,
      dndTo:
        typeof parsed?.dndTo === "string" ? parsed.dndTo : DEFAULT_PREFS.dndTo,
      enabled: {
        ...DEFAULT_PREFS.enabled,
        ...(parsed?.enabled && typeof parsed.enabled === "object"
          ? parsed.enabled
          : {}),
      },
    };
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

// ── Main hook ────────────────────────────────────────────────────────────────
export function useNotifications() {
  const { isAuthenticated } = useFirebaseAuth();

  // ── Queries
  const rawNotifs = useQuery(
    api.notifications.list,
    isAuthenticated ? {} : "skip",
  ) as Doc<"notifications">[] | undefined;

  const unreadRaw = useQuery(
    api.notifications.unreadCount,
    isAuthenticated ? {} : "skip",
  ) as number | undefined;

  const rawPrefsJson = useQuery(
    api.preferences.getMyNotifPrefs,
    isAuthenticated ? {} : "skip",
  ) as string | undefined;

  // ── Mutations
  const markReadMutation = useMutation(api.notifications.markNotificationRead);
  const markAllReadMutation = useMutation(api.notifications.markAllRead);
  const dismissMutation = useMutation(api.notifications.dismiss);
  const savePrefsMutation = useMutation(api.preferences.saveNotifPrefs);

  // ── Préférences
  const prefs: NotifPrefs = useMemo(
    () => parsePrefs(rawPrefsJson),
    [rawPrefsJson],
  );

  // ── Notifications enrichies
  const notifs: Notif[] = useMemo(
    () =>
      (rawNotifs ?? []).map((n) => ({
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
      })),
    [rawNotifs],
  );

  const unreadTotal = unreadRaw ?? 0;

  const badgeCounts: Record<string, number> = useMemo(() => {
    const counts: Record<string, number> = {};
    notifs.forEach((n) => {
      if (!n.read && prefs.enabled[n.type]) {
        counts[n.module] = (counts[n.module] ?? 0) + 1;
      }
    });
    return counts;
  }, [notifs, prefs.enabled]);

  // ── Actions
  const markRead = useCallback(
    (id: Id<"notifications">) => {
      if (!isAuthenticated) return;
      markReadMutation({ id }).catch(() => {
        /* silent — l'erreur n'empêche pas l'UI de fonctionner */
      });
    },
    [markReadMutation, isAuthenticated],
  );

  const markAllRead = useCallback(() => {
    if (!isAuthenticated) return;
    markAllReadMutation({}).catch(() => {
      /* silent */
    });
  }, [markAllReadMutation, isAuthenticated]);

  const dismiss = useCallback(
    (id: Id<"notifications">) => {
      if (!isAuthenticated) return;
      dismissMutation({ id }).catch(() => {
        /* silent */
      });
    },
    [dismissMutation, isAuthenticated],
  );

  // ── Écriture préférences (serveur = source de vérité)
  const savePrefs = useCallback(
    (next: NotifPrefs) => {
      if (!isAuthenticated) return;
      savePrefsMutation({ prefsJson: JSON.stringify(next) }).catch(() => {
        /* silent */
      });
    },
    [savePrefsMutation, isAuthenticated],
  );

  const updatePref = useCallback(
    (type: NotifType, enabled: boolean) => {
      savePrefs({
        ...prefs,
        enabled: { ...prefs.enabled, [type]: enabled },
      });
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

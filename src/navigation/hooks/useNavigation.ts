import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFavorites } from "@/hooks/use-favorites.ts";
import { useNotifications } from "@/hooks/use-notifications.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { buildNavigation } from "../navigation.builder";
import { moduleBadgeMap } from "../navigation.badges";
import { useAppUser } from "./useAppUser";

export function useNavigation() {
  const { isAdmin, isPremium, isVerified, role, isAuthenticated } =
    useAppUser();
  const { favorites } = useFavorites();
  const { badgeCounts } = useNotifications();

  // âœ… Plus besoin de `email` â€“ les requÃªtes utilisent `isAuthenticated` pour `{}` ou `"skip"`
  // Le backend rÃ©cupÃ¨re l'identitÃ© via `ctx.auth.getUserIdentity()`

  const msgUnread =
    useQuery(api.messages.conversations.getUnreadCount, isAuthenticated ? {} : "skip") ?? 0;

  // âœ… Correction : plus d'email â€“ on utilise `isAuthenticated`
  const notifUnread =
    useQuery(api.notifications.unreadCount, isAuthenticated ? {} : "skip") ?? 0;

  // âœ… Fallback si buildNavigation retourne undefined
  const navSections =
    buildNavigation({
      isAdmin,
      isPremium,
      isVerified,
      role,
    }) ?? [];

  // âœ… PrÃ©paration des badges avec vÃ©rifications
  const badges: Record<string, number> = {};
  navSections.forEach((section) => {
    // SÃ©curitÃ© : section ou items peuvent manquer
    if (!section || !section.items) return;
    section.items.forEach((item) => {
      if (!item) return;

      if (item.id === "messages") {
        badges[item.id] = msgUnread;
      } else if (item.id === "notifications") {
        badges[item.id] = notifUnread;
      } else if (item.id === "favorites") {
        badges[item.id] = favorites.length;
      } else {
        const moduleInfo = moduleBadgeMap[item.id];
        if (moduleInfo) {
          // Utiliser badgeCounts (avec fallback)
          const counts = badgeCounts ?? {};
          badges[item.id] = counts[moduleInfo.label] ?? 0;
        }
      }
    });
  });

  return {
    navSections,
    badges,
    isAuthenticated,
  };
}

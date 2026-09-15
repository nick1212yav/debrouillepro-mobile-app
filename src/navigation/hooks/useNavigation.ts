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

  // ✅ Plus besoin de `email` – les requêtes utilisent `isAuthenticated` pour `{}` ou `"skip"`
  // Le backend récupère l'identité via `ctx.auth.getUserIdentity()`

  const msgUnread =
    useQuery(api.messages.totalUnread, isAuthenticated ? {} : "skip") ?? 0;

  // ✅ Correction : plus d'email – on utilise `isAuthenticated`
  const notifUnread =
    useQuery(api.notifications.unreadCount, isAuthenticated ? {} : "skip") ?? 0;

  // ✅ Fallback si buildNavigation retourne undefined
  const navSections =
    buildNavigation({
      isAdmin,
      isPremium,
      isVerified,
      role,
    }) ?? [];

  // ✅ Préparation des badges avec vérifications
  const badges: Record<string, number> = {};
  navSections.forEach((section) => {
    // Sécurité : section ou items peuvent manquer
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

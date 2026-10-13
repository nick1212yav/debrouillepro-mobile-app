import { useCallback } from "react";
import { useRouter } from "expo-router";

/**
 * Ouvre la conversation avec un utilisateur.
 *
 * NOTE : la route /messages/new n'existe pas encore dans app/.
 * Le push échouera silencieusement (unmatched route) jusqu'à création
 * de app/messages/new.tsx. Documenté comme dette dans MARCHE_MODULES.
 */
export function useServiceChat(userId?: string) {
  const router = useRouter();

  const openChat = useCallback(() => {
    if (!userId) return;
    // TODO: créer app/messages/new.tsx
    router.push(`/messages/new?userId=${userId}`);
  }, [router, userId]);

  return { openChat };
}

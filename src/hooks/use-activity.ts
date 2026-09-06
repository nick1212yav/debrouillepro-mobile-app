// src/hooks/use-activity.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

export type ActivityEntry = Doc<"userActivity">;

export function useActivity() {
  const { isAuthenticated } = useFirebaseAuth();

  // ✅ Plus d'email – le backend utilise ctx.auth.getUserIdentity()
  const entries =
    useQuery(api.activity.list, isAuthenticated ? {} : "skip") ?? [];

  const logActivity = useMutation(api.activity.log);
  const clearActivity = useMutation(api.activity.clear);

  const log = async (
    args: Omit<Parameters<typeof logActivity>[0], "email">,
  ) => {
    if (!isAuthenticated) {
      console.warn("useActivity: Tentative de log sans authentification");
      return;
    }
    await logActivity(args);
  };

  const clear = async () => {
    if (!isAuthenticated) {
      console.warn("useActivity: Tentative de clear sans authentification");
      return;
    }
    await clearActivity({});
  };

  return {
    entries: entries ?? [],
    isLoading: entries === undefined,
    log,
    clear,
  };
}

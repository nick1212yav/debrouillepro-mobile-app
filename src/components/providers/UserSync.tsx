import { useEffect, useRef } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

export function UserSync() {
  const { user, loading, fetchAccessToken } = useFirebaseAuth();
  const { isLoading: convexLoading, isAuthenticated: convexAuthenticated } =
    useConvexAuth();
  const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);
  const syncedUid = useRef<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      // ✅ 1. Attendre que Firebase ET Convex soient prêts
      if (loading) {
        console.log("⏳ UserSync: Firebase loading...");
        return;
      }
      if (!user) {
        console.log("⏳ UserSync: Aucun utilisateur Firebase");
        return;
      }
      if (convexLoading) {
        console.log("⏳ UserSync: Convex loading...");
        return;
      }
      if (!convexAuthenticated) {
        console.log("⏳ UserSync: Convex non authentifié");
        return;
      }

      // ✅ 2. Éviter les synchronisations en double
      if (syncedUid.current === user.uid) {
        console.log("✅ UserSync: Déjà synchronisé pour cet utilisateur");
        return;
      }

      // ✅ 3. Obtenir un token JWT frais (forceRefresh)
      const token = await fetchAccessToken({ forceRefreshToken: true });
      if (!token) {
        console.warn("❌ UserSync: Impossible d'obtenir le token JWT");
        return;
      }

      // ✅ 4. Petite pause pour laisser Convex enregistrer le token (300 ms)
      await new Promise((resolve) => setTimeout(resolve, 300));

      // ✅ 5. Synchroniser
      try {
        console.log("🔄 UserSync: Synchronisation avec Convex...");
        await createOrUpdateUser({
          uid: user.uid,
          email: user.email ?? undefined,
          phone: user.phoneNumber ?? undefined,
          name: user.displayName ?? "Utilisateur",
          avatar: user.photoURL ?? undefined,
          emailVerified: user.emailVerified,
          roles: ["particulier"],
          permissions: [],
          city: undefined,
          country: undefined,
          language: "fr",
          profession: undefined,
          interests: [],
        });

        syncedUid.current = user.uid;
        console.log("✅ UserSync: Synchronisation réussie !");
      } catch (err) {
        // ✅ 6. Gérer spécifiquement l'erreur UNAUTHENTICATED
        if (
          err &&
          typeof err === "object" &&
          "code" in err &&
          err.code === "UNAUTHENTICATED"
        ) {
          console.log(
            "⏳ UserSync: Convex pas encore prêt (UNAUTHENTICATED) – réessai plus tard",
          );
          // Ne pas marquer comme synchronisé, on laisse le useEffect réessayer
          return;
        }

        // Autres erreurs : on logue et on réinitialise pour réessayer plus tard
        console.error("❌ UserSync: Erreur lors de la synchronisation :", err);
        syncedUid.current = null;
        // Délai avant de permettre une nouvelle tentative (évite les boucles)
        setTimeout(() => {
          syncedUid.current = null;
        }, 3000);
      }
    };

    void sync();
  }, [
    user,
    loading,
    convexLoading,
    convexAuthenticated,
    createOrUpdateUser,
    fetchAccessToken,
  ]);

  return null;
}

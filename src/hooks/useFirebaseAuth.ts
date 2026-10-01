// src/hooks/useFirebaseAuth.ts

import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "@/lib/firebase";

interface FetchAccessTokenOptions {
  forceRefreshToken: boolean;
}

interface FirebaseAuthState {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  fetchAccessToken: (
    options: FetchAccessTokenOptions,
  ) => Promise<string | null>;
}

export function useFirebaseAuth(): FirebaseAuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchAccessToken = useCallback(
    async ({
      forceRefreshToken,
    }: FetchAccessTokenOptions): Promise<string | null> => {
      /**
       * Convex peut appeler fetchAccessToken depuis son cycle
       * d'authentification. On utilise auth.currentUser comme
       * source de vérité plutôt que seulement le state React `user`.
       *
       * Cela évite une fenêtre de course entre :
       *
       * Firebase Auth
       *      ↓
       * onAuthStateChanged
       *      ↓
       * setUser(...)
       *      ↓
       * Convex
       */
      const currentUser = auth?.currentUser ?? user;

      if (!currentUser) {
        return null;
      }

      try {
        return await currentUser.getIdToken(forceRefreshToken);
      } catch (error) {
        console.error(
          "[firebase-auth] Impossible de récupérer le token Firebase.",
          error,
        );

        return null;
      }
    },
    [user],
  );

  return {
    user,
    loading,
    isLoading: loading,
    isAuthenticated: user !== null,
    fetchAccessToken,
  };
}

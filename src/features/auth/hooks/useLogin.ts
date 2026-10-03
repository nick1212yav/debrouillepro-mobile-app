// src/features/auth/hooks/useLogin.ts

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { loginWithEmail } from "../services/firebase/auth.service";

interface UseLoginOptions {
  onSuccess?: () => void;
}

export function useLogin(options: UseLoginOptions = {}) {
  const { onSuccess } = options;

  const [loading, setLoading] = useState(false);

  const login = useCallback(
    async (email: string, password: string) => {
      if (loading) return false;

      const normalizedEmail = email.trim();

      if (!normalizedEmail || !password) {
        toast.error("Veuillez renseigner votre email et votre mot de passe.");
        return false;
      }

      setLoading(true);

      try {
        await loginWithEmail(normalizedEmail, password);

        toast.success("Connexion réussie !");

        onSuccess?.();

        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur de connexion",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, onSuccess],
  );

  return {
    login,
    loading,
  };
}

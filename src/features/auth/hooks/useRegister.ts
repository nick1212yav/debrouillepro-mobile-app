// src/features/auth/hooks/useRegister.ts

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { registerWithEmail } from "../services/firebase/auth.service";

interface UseRegisterOptions {
  onSuccess?: () => void;
}

export function useRegister(options: UseRegisterOptions = {}) {
  const { onSuccess } = options;

  const [loading, setLoading] = useState(false);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      if (loading) {
        return false;
      }

      const normalizedEmail = email.trim();
      const normalizedName = name.trim();

      if (!normalizedEmail || !password || !normalizedName) {
        toast.error("Veuillez renseigner tous les champs requis.");
        return false;
      }

      setLoading(true);

      try {
        await registerWithEmail(normalizedEmail, password, normalizedName);

        toast.info("Un email de vérification a été envoyé.");

        toast.success("Compte créé avec succès !");

        onSuccess?.();

        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur d'inscription",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading, onSuccess],
  );

  return {
    register,
    loading,
  };
}

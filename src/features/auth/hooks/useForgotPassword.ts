// src/features/auth/hooks/useForgotPassword.ts

import { useCallback, useState } from "react";

import { toast } from "sonner";

import { sendPasswordReset } from "../services/firebase/auth.service";

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const sendReset = useCallback(
    async (email: string) => {
      const normalizedEmail = email.trim();

      if (!normalizedEmail || loading) {
        return false;
      }

      setLoading(true);

      try {
        await sendPasswordReset(normalizedEmail);

        setLastEmail(normalizedEmail);
        setSent(true);

        toast.success("Un email de réinitialisation a été envoyé");

        return true;
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Erreur lors de l'envoi",
        );

        return false;
      } finally {
        setLoading(false);
      }
    },
    [loading],
  );

  const resetState = useCallback(() => {
    setSent(false);
    setLastEmail("");
  }, []);

  return {
    loading,
    sent,
    lastEmail,
    sendReset,
    resetState,
  };
}

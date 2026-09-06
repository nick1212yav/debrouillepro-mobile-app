import { UIService } from "@/core/sdk/ui/UIService";
import { useState } from "react";
import { sendPasswordReset } from "../services/firebase/auth.service";

export function useForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [lastEmail, setLastEmail] = useState("");

  const sendReset = async (email: string) => {
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setLastEmail(email);
      setSent(true);
      UIService.openToast("Un email de réinitialisation a été envoyé", "success");
      return true;
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur lors de l'envoi", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setSent(false);
    setLastEmail("");
  };

  return { loading, sent, lastEmail, sendReset, resetState };
}

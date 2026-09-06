import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { useState } from "react";
import { registerWithEmail } from "../services/firebase/auth.service";

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      UIService.openToast("Un email de vérification a été envoyé", "info");
      UIService.openToast("Compte créé avec succès !", "success");
      router("/");
      return true;
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur d'inscription", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading };
}

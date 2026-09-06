import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { useState } from "react";
import { loginWithEmail } from "../services/firebase/auth.service";

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      UIService.openToast("Connexion réussie !", "success");
      router("/");
      return true;
    } catch (error) {
      UIService.openToast(error instanceof Error ? error.message : "Erreur de connexion", "error");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}

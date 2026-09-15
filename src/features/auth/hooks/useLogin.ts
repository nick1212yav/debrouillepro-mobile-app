import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loginWithEmail } from "../services/firebase/auth.service";

export function useLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await loginWithEmail(email, password);
      toast.success("Connexion réussie !");
      navigate("/");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur de connexion",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading };
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerWithEmail } from "../services/firebase/auth.service";

export function useRegister() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      await registerWithEmail(email, password, name);
      toast.info("Un email de vérification a été envoyé");
      toast.success("Compte créé avec succès !");
      navigate("/");
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur d'inscription",
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading };
}

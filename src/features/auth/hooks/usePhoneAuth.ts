// src/features/auth/hooks/usePhoneAuth.ts

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

import {
  createRecaptchaVerifier,
  sendPhoneCode,
  verifyPhoneCode,
} from "../services/firebase/phone.service";
import { getPhoneErrorMessage } from "../utils/phone.errors";

type PhoneStep = "phone" | "otp";

export function usePhoneAuth() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<PhoneStep>("phone");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(
    null,
  );
  const [phoneNumber, setPhoneNumber] = useState("");

  /**
   * Firebase Phone Auth Web utilise un conteneur DOM
   * pour le reCAPTCHA.
   *
   * Ne pas typer cette ref en React Native `View`.
   */
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const clearRecaptcha = useCallback(() => {
    try {
      verifierRef.current?.clear();
    } finally {
      verifierRef.current = null;
    }
  }, []);

  const initRecaptcha = useCallback(() => {
    const container = recaptchaRef.current;

    if (!container) {
      return null;
    }

    clearRecaptcha();

    try {
      const verifier = createRecaptchaVerifier(container);
      verifierRef.current = verifier;

      return verifier;
    } catch (error) {
      verifierRef.current = null;
      toast.error(getPhoneErrorMessage(error));
      return null;
    }
  }, [clearRecaptcha]);

  const sendCode = useCallback(
    async (phone: string) => {
      const normalizedPhone = phone.trim();

      if (!normalizedPhone) {
        toast.error("Veuillez saisir votre numéro de téléphone.");
        return false;
      }

      if (loading) {
        return false;
      }

      const verifier = initRecaptcha();

      if (!verifier) {
        toast.error("Erreur de chargement du reCAPTCHA.");
        return false;
      }

      setLoading(true);

      try {
        const result = await sendPhoneCode(normalizedPhone, verifier);

        setConfirmation(result);
        setPhoneNumber(normalizedPhone);
        setStep("otp");

        toast.success("Code SMS envoyé !");

        return true;
      } catch (error) {
        clearRecaptcha();
        toast.error(getPhoneErrorMessage(error));

        return false;
      } finally {
        setLoading(false);
      }
    },
    [clearRecaptcha, initRecaptcha, loading],
  );

  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      const normalizedCode = code.replace(/\D/g, "").slice(0, 6);

      if (!confirmation) {
        toast.error("Aucune confirmation en cours.");
        return false;
      }

      if (normalizedCode.length !== 6) {
        toast.error("Le code doit contenir 6 chiffres.");
        return false;
      }

      if (loading) {
        return false;
      }

      setLoading(true);

      try {
        await verifyPhoneCode(confirmation, normalizedCode);

        toast.success("Connexion réussie !");

        clearRecaptcha();

        /*
         * UserSync synchronise automatiquement l'utilisateur
         * Firebase → Convex après l'authentification.
         */
        return true;
      } catch (error) {
        clearRecaptcha();
        toast.error(getPhoneErrorMessage(error));

        return false;
      } finally {
        setLoading(false);
      }
    },
    [clearRecaptcha, confirmation, loading],
  );

  const reset = useCallback(() => {
    setStep("phone");
    setConfirmation(null);
    setPhoneNumber("");
    clearRecaptcha();
  }, [clearRecaptcha]);

  return {
    loading,
    step,
    recaptchaRef,
    phoneNumber,
    sendCode,
    verifyCode,
    reset,
  };
}

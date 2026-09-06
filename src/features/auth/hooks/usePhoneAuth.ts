import { UIService } from "@/core/sdk/ui/UIService";
import { useState, useRef, useCallback } from "react";
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
  const recaptchaRef = useRef<View>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const initRecaptcha = useCallback(() => {
    if (!recaptchaRef.current) return null;
    if (verifierRef.current) {
      verifierRef.current.clear();
      verifierRef.current = null;
    }
    verifierRef.current = createRecaptchaVerifier(recaptchaRef.current);
    return verifierRef.current;
  }, []);

  const sendCode = useCallback(
    async (phone: string) => {
      const verifier = initRecaptcha();
      if (!verifier) {
        UIService.openToast("Erreur de chargement du reCAPTCHA", "error");
        return false;
      }
      setLoading(true);
      try {
        const result = await sendPhoneCode(phone, verifier);
        setConfirmation(result);
        setPhoneNumber(phone);
        setStep("otp");
        UIService.openToast("Code SMS envoyé !", "success");
        return true;
      } catch (error) {
        UIService.openToast(getPhoneErrorMessage(error), "error");
        // Réinitialiser le reCAPTCHA en cas d'erreur
        verifierRef.current?.clear();
        verifierRef.current = null;
        return false;
      } finally {
        setLoading(false);
      }
    },
    [initRecaptcha],
  );

  const verifyCode = useCallback(
    async (code: string): Promise<boolean> => {
      if (!confirmation) {
        UIService.openToast("Aucune confirmation en cours", "error");
        return false;
      }
      setLoading(true);
      try {
        await verifyPhoneCode(confirmation, code);
        UIService.openToast("Connexion réussie !", "success");
        verifierRef.current?.clear();
        verifierRef.current = null;
        // ✅ UserSync va automatiquement synchroniser l'utilisateur
        return true;
      } catch (error) {
        UIService.openToast(getPhoneErrorMessage(error), "error");
        // Réinitialiser le reCAPTCHA en cas d'erreur
        verifierRef.current?.clear();
        verifierRef.current = null;
        return false;
      } finally {
        setLoading(false);
      }
    },
    [confirmation],
  );

  const reset = useCallback(() => {
    setStep("phone");
    setConfirmation(null);
    setPhoneNumber("");
    verifierRef.current?.clear();
    verifierRef.current = null;
  }, []);

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

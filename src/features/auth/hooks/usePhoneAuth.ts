import { useState, useRef, useCallback } from "react";
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
        toast.error("Erreur de chargement du reCAPTCHA");
        return false;
      }
      setLoading(true);
      try {
        const result = await sendPhoneCode(phone, verifier);
        setConfirmation(result);
        setPhoneNumber(phone);
        setStep("otp");
        toast.success("Code SMS envoyé !");
        return true;
      } catch (error) {
        toast.error(getPhoneErrorMessage(error));
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
        toast.error("Aucune confirmation en cours");
        return false;
      }
      setLoading(true);
      try {
        await verifyPhoneCode(confirmation, code);
        toast.success("Connexion réussie !");
        verifierRef.current?.clear();
        verifierRef.current = null;
        // ✅ UserSync va automatiquement synchroniser l'utilisateur
        return true;
      } catch (error) {
        toast.error(getPhoneErrorMessage(error));
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

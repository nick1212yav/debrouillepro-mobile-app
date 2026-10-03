import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import type { ConfirmationResult, User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { mapFirebaseError } from "../../utils/errors";

/**
 * Crée un vérificateur reCAPTCHA Firebase Web.
 *
 * Firebase `RecaptchaVerifier` attend un élément DOM (`HTMLElement`).
 * Il ne peut donc pas recevoir directement un composant React Native `View`.
 */
export function createRecaptchaVerifier(
  container: HTMLElement,
): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, container, {
    size: "invisible",
    callback: () => {
      // Firebase gère automatiquement la validation reCAPTCHA.
    },
  });
}

/**
 * Envoie le code OTP au numéro de téléphone.
 */
export async function sendPhoneCode(
  phoneNumber: string,
  verifier: RecaptchaVerifier,
): Promise<ConfirmationResult> {
  try {
    return await signInWithPhoneNumber(auth, phoneNumber.trim(), verifier);
  } catch (error) {
    console.error("🔥 Firebase Phone Error:", error);
    throw mapFirebaseError(error);
  }
}

/**
 * Vérifie le code OTP reçu et finalise l'authentification.
 */
export async function verifyPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> {
  try {
    const credential = await confirmation.confirm(code.trim());

    return credential.user;
  } catch (error) {
    console.error("🔥 Firebase OTP Error:", error);
    throw mapFirebaseError(error);
  }
}

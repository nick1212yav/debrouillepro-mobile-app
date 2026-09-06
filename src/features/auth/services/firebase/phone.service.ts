// src/features/auth/services/firebase/phone.service.ts

import type { User } from "firebase/auth";

import { mapFirebaseError } from "../../utils/errors";

// ─────────────────────────────────────────────────────────────
// Types React Native
// ─────────────────────────────────────────────────────────────

/**
 * Résultat retourné par un fournisseur d'authentification
 * téléphone compatible React Native / Expo.
 *
 * Firebase Web utilise ConfirmationResult, mais ce type est
 * volontairement abstrait ici afin que le service reste
 * compatible avec une implémentation native.
 */
export interface PhoneConfirmation {
  confirm: (code: string) => Promise<User>;
}

/**
 * Fonction responsable de l'envoi du code SMS.
 *
 * L'implémentation concrète peut être basée sur :
 * - expo-firebase-recaptcha
 * - Firebase Auth React Native
 * - Firebase Auth Web configuré pour Expo
 */
export type PhoneCodeSender = (
  phoneNumber: string,
) => Promise<PhoneConfirmation>;

// ─────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────

function normalizePhoneNumber(phoneNumber: string): string {
  return phoneNumber.trim().replace(/\s+/g, "");
}

function normalizeVerificationCode(code: string): string {
  return code.trim().replace(/\s+/g, "");
}

// ─────────────────────────────────────────────────────────────
// Envoi du code SMS
// ─────────────────────────────────────────────────────────────

/**
 * Envoie un code de vérification SMS.
 *
 * Le mécanisme de reCAPTCHA est géré par le fournisseur natif
 * injecté dans le paramètre `sendCode`.
 */
export async function sendPhoneCode(
  phoneNumber: string,
  sendCode: PhoneCodeSender,
): Promise<PhoneConfirmation> {
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedPhoneNumber) {
    throw new Error("Veuillez saisir un numéro de téléphone.");
  }

  if (typeof sendCode !== "function") {
    throw new Error("Le service d'envoi du code SMS n'est pas disponible.");
  }

  try {
    return await sendCode(normalizedPhoneNumber);
  } catch (error) {
    console.error("Firebase Phone Code Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Vérification du code SMS
// ─────────────────────────────────────────────────────────────

/**
 * Vérifie le code SMS reçu par l'utilisateur.
 */
export async function verifyPhoneCode(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<User> {
  const normalizedCode = normalizeVerificationCode(code);

  if (!normalizedCode) {
    throw new Error("Veuillez saisir le code de vérification.");
  }

  if (!confirmation || typeof confirmation.confirm !== "function") {
    throw new Error(
      "La session de vérification du numéro de téléphone est invalide.",
    );
  }

  try {
    return await confirmation.confirm(normalizedCode);
  } catch (error) {
    console.error("Firebase Phone Verification Error:", error);
    throw mapFirebaseError(error);
  }
}

export default {
  sendPhoneCode,
  verifyPhoneCode,
};

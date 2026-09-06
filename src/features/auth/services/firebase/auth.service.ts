// src/features/auth/services/firebase/auth.service.ts

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import type { AuthCredential, User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { mapFirebaseError } from "../../utils/errors";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface PhoneConfirmation {
  confirm: (code: string) => Promise<User>;
}

export interface GoogleSignInResult {
  idToken?: string | null;
  accessToken?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Connexion Email / Mot de passe
// ─────────────────────────────────────────────────────────────

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    return credential.user;
  } catch (error) {
    console.error("Firebase Login Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Inscription Email / Mot de passe
// ─────────────────────────────────────────────────────────────

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<User> {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email.trim(),
      password,
    );

    await updateProfile(credential.user, {
      displayName: name.trim(),
    });

    try {
      await sendEmailVerification(credential.user);
    } catch (verificationError) {
      console.warn(
        "Impossible d'envoyer immédiatement l'e-mail de vérification:",
        verificationError,
      );
    }

    return credential.user;
  } catch (error) {
    console.error("Firebase Register Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Réinitialisation du mot de passe
// ─────────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error("Firebase Reset Password Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Vérification Email
// ─────────────────────────────────────────────────────────────

export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error("Firebase Verification Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Connexion Téléphone
// ─────────────────────────────────────────────────────────────

/**
 * Confirme un code SMS Firebase.
 *
 * Le flux d'envoi du SMS est géré séparément par
 * phone.service.ts afin de permettre l'utilisation
 * d'une implémentation compatible React Native / Expo.
 */
export async function verifyPhoneCode(
  confirmation: PhoneConfirmation,
  code: string,
): Promise<User> {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    throw new Error("Veuillez saisir le code de vérification.");
  }

  try {
    return await confirmation.confirm(normalizedCode);
  } catch (error) {
    console.error("Firebase OTP Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Google
// ─────────────────────────────────────────────────────────────

/**
 * Crée la connexion Firebase à partir d'un token Google.
 *
 * Le flux OAuth natif doit être réalisé par le composant
 * ou le service Expo/React Native responsable de Google Sign-In.
 */
export async function loginWithGoogleTokens(
  result: GoogleSignInResult,
): Promise<User> {
  const idToken = result.idToken ?? null;
  const accessToken = result.accessToken ?? null;

  if (!idToken && !accessToken) {
    throw new Error(
      "Aucun jeton Google valide n'a été fourni pour l'authentification.",
    );
  }

  try {
    const credential: AuthCredential = GoogleAuthProvider.credential(
      idToken,
      accessToken,
    );

    const userCredential = await signInWithCredential(auth, credential);

    return userCredential.user;
  } catch (error) {
    console.error("Firebase Google Error:", error);
    throw mapFirebaseError(error);
  }
}

import { View } from "react-native";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import type { ConfirmationResult, User } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { mapFirebaseError } from "../../utils/errors";

// ─────────────────────────────────────────────────────────────
// reCAPTCHA singleton
// ─────────────────────────────────────────────────────────────

let recaptchaVerifier: RecaptchaVerifier | null = null;

export function getRecaptchaVerifier(
  container: View,
): RecaptchaVerifier {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, container, {
      size: "invisible",
      callback: () => {},
    });
  }

  return recaptchaVerifier;
}

export function resetRecaptchaVerifier(): void {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
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
    console.error("🔥 Firebase Login Error:", error);
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

    await sendEmailVerification(credential.user);

    return credential.user;
  } catch (error) {
    console.error("🔥 Firebase Register Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Réinitialisation mot de passe
// ─────────────────────────────────────────────────────────────

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    console.error("🔥 Firebase Reset Password Error:", error);
    throw mapFirebaseError(error);
  }
}

export async function resendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error("🔥 Firebase Verification Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Connexion Téléphone
// ─────────────────────────────────────────────────────────────

export async function sendPhoneCode(
  phoneNumber: string,
  container: View,
): Promise<ConfirmationResult> {
  try {
    const verifier = getRecaptchaVerifier(container);

    return await signInWithPhoneNumber(auth, phoneNumber, verifier);
  } catch (error) {
    console.error("🔥 Firebase Phone Error:", error);
    throw mapFirebaseError(error);
  }
}

export async function verifyPhoneCode(
  confirmation: ConfirmationResult,
  code: string,
): Promise<User> {
  try {
    const credential = await confirmation.confirm(code);

    return credential.user;
  } catch (error) {
    console.error("🔥 Firebase OTP Error:", error);
    throw mapFirebaseError(error);
  }
}

// ─────────────────────────────────────────────────────────────
// Google
// ─────────────────────────────────────────────────────────────

export async function loginWithGoogle(): Promise<User> {
  try {
    const provider = new GoogleAuthProvider();

    const credential = await signInWithPopup(auth, provider);

    return credential.user;
  } catch (error) {
    console.error("🔥 Firebase Google Error:", error);
    throw mapFirebaseError(error);
  }
}

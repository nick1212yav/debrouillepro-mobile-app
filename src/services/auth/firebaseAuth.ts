// src/services/auth/firebaseAuth.ts
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { auth } from "@/lib/firebase";

// ── Config Google Sign-In ───────────────────────────────────────────────
// ⚠️ À appeler UNE SEULE FOIS au boot de l'app (dans app/_layout.tsx).

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let isConfigured = false;

export function configureGoogleSignin(): void {
  if (isConfigured) return;
  isConfigured = true;

  if (!GOOGLE_WEB_CLIENT_ID) {
    console.warn(
      "[GoogleSignin] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID manquant dans .env.local",
    );
  }

  GoogleSignin.configure({
    // ⚠️ webClientId, PAS androidClientId
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: false,
    scopes: ["profile", "email"],
  });
}

// ── Email / Password ────────────────────────────────────────────────────
export async function registerWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

// ── Google natif (v13+) ─────────────────────────────────────────────────
/**
 * Ouvre le sélecteur de compte Google natif et crée une session Firebase.
 *
 * Retourne `null` si l'utilisateur annule (pas une erreur).
 */
export async function signInWithGoogle(): Promise<User | null> {
  try {
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const response = await GoogleSignin.signIn();

    // v13+ : response.type === "success" | "cancelled"
    if (response.type === "cancelled") {
      return null;
    }

    const idToken = response.data?.idToken;

    if (!idToken) {
      throw new Error("Aucun idToken Google reçu.");
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } catch (error: any) {
    // Filet de sécurité : certaines versions lèvent une erreur au cancel
    if (error?.code === statusCodes.SIGN_IN_CANCELLED) {
      return null;
    }
    console.error("[GoogleSignin] signIn error:", error);
    throw error;
  }
}

// ── Logout ──────────────────────────────────────────────────────────────
export async function logout(): Promise<void> {
  try {
    // Déconnecte aussi le compte Google natif si connecté
    await GoogleSignin.signOut();
  } catch {
    // Ignore — peut échouer si l'utilisateur ne s'est pas connecté via Google
  }
  await signOut(auth);
}

// ── Stubs de compatibilité (si d'anciens imports traînent) ──────────────
/**
 * @deprecated Utiliser signInWithGoogle() à la place.
 */
export function useGoogleAuth() {
  return {
    request: null,
    response: null,
    promptAsync: async () => {
      console.warn("[useGoogleAuth] obsolète — utiliser signInWithGoogle()");
    },
  };
}

/**
 * @deprecated Utiliser signInWithGoogle() à la place.
 */
export async function signInWithGoogleCredential(
  idToken: string,
): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

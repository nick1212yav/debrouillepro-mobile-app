// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  // @ts-ignore — getReactNativePersistence existe en RN mais absent des types publics
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ── Config ──────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// ── Garde-fou config ────────────────────────────────────────────────────
const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

if (!hasFirebaseConfig) {
  console.warn(
    "[firebase] Configuration incomplète. " +
      "Ajoute les variables EXPO_PUBLIC_FIREBASE_* dans .env.local.",
  );
}

// ── App Firebase (singleton) ────────────────────────────────────────────
const app = hasFirebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : (() => {
      throw new Error(
        "[firebase] Impossible d'initialiser Firebase sans configuration.",
      );
    })();

// ── Auth avec persistence adaptée à la plateforme ──────────────────────
//
// Sur le WEB    : getAuth suffit (localStorage automatique)
// Sur NATIF     : initializeAuth + AsyncStorage
//
// ⚠️ initializeAuth ne peut être appelé qu'UNE SEULE FOIS.
//    En cas de HMR / Fast Refresh, on tombe sur le catch → getAuth pour récupérer
//    l'instance existante.

let authInstance: ReturnType<typeof getAuth>;

if (Platform.OS === "web") {
  authInstance = getAuth(app);
} else {
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    // Déjà initialisé (hot reload) → récupérer l'instance existante
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;

export default app;

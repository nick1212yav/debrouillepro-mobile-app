// src/hooks/use-service-worker.ts

import { useEffect } from "react";
import { Platform } from "react-native";

/**
 * Gestion du Service Worker.
 *
 * Les Service Workers sont disponibles uniquement sur le Web/PWA.
 * Sur Android et iOS natifs, ce hook ne fait rien.
 *
 * Ce hook est volontairement conservé afin de préserver la compatibilité
 * avec les éventuels imports existants pendant la migration Web → Native.
 */
export function useServiceWorker(): void {
  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;
    let disposed = false;

    const registerServiceWorker = async () => {
      try {
        registration = await navigator.serviceWorker.register("/sw.js");

        if (disposed) {
          return;
        }

        /*
         * L'application Web peut continuer à gérer son cycle PWA
         * via le Service Worker enregistré ici.
         *
         * Les notifications de mise à jour sont volontairement laissées
         * à la couche Web/PWA afin de ne pas introduire de dépendance
         * navigateur dans l'application native.
         */
      } catch (error) {
        if (__DEV__) {
          console.warn("Service Worker registration failed:", error);
        }
      }
    };

    void registerServiceWorker();

    return () => {
      disposed = true;
    };
  }, []);
}

export default useServiceWorker;

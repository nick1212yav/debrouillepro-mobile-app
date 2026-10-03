// src/polyfills/web-apis.ts
/**
 * Polyfill des APIs web-only pour React Native (iOS / Android uniquement).
 *
 * ⚠️ À importer EN PREMIER dans `app/_layout.tsx` avant tout autre code.
 *
 * 🚨 V8.7 : ce polyfill ne s'active QUE sur iOS et Android (via Platform.OS).
 *
 *    En React Native Web (navigateur) et en SSR (Node.js), `Platform.OS`
 *    vaut `"web"`. Dans ce cas :
 *      - Soit les APIs existent nativement (navigateur)
 *      - Soit elles sont volontairement absentes (SSR)
 *    Dans les 2 cas, on ne doit RIEN polyfiller.
 *
 * 🎥 LiveKit :
 *    React Native / Hermes peut ne pas exposer certaines APIs Web utilisées
 *    par `livekit-client`.
 *
 *    Ce polyfill fournit notamment :
 *      - window.addEventListener
 *      - window.removeEventListener
 *      - window.dispatchEvent
 *      - AbortSignal.any
 *
 *    Le support EventTarget est nécessaire car LiveKit utilise les listeners
 *    de `window` pendant la connexion / déconnexion d'une Room.
 */

import { Platform } from "react-native";

// ── Détection de l'environnement ─────────────────────────────────────────

const isWebOrSSR = Platform.OS === "web";

if (isWebOrSSR) {
  // Navigateur ou SSR : on ne touche à RIEN.
  // eslint-disable-next-line no-console
  console.log("[polyfill] Platform.OS === 'web' — polyfills désactivés.");
} else {
  // ── iOS / Android : on active les polyfills ────────────────────────────

  const g: any = typeof globalThis !== "undefined" ? globalThis : {};

  // =========================================================================
  // 1. window
  // =========================================================================

  if (typeof g.window === "undefined") {
    g.window = {};
  }

  // =========================================================================
  // 1.1 window EventTarget
  // =========================================================================
  //
  // LiveKit utilise window.addEventListener/removeEventListener.
  //
  // En React Native, `window` peut exister sans exposer ces méthodes.
  // Il est donc important de ne PAS supposer que leur simple présence
  // signifie qu'elles sont utilisables.
  //
  // Ce registre est volontairement minimal :
  // - addEventListener
  // - removeEventListener
  // - dispatchEvent
  //
  // Il est suffisant pour les événements Web consommés par les SDK JS
  // comme livekit-client.
  // =========================================================================

  type WindowEventListener = (event: unknown) => void;

  const windowEventListeners = new Map<string, Set<WindowEventListener>>();

  const addWindowEventListener = (
    type: string,
    listener: WindowEventListener,
  ): void => {
    if (typeof type !== "string" || typeof listener !== "function") {
      return;
    }

    let listeners = windowEventListeners.get(type);

    if (!listeners) {
      listeners = new Set<WindowEventListener>();
      windowEventListeners.set(type, listeners);
    }

    listeners.add(listener);
  };

  const removeWindowEventListener = (
    type: string,
    listener: WindowEventListener,
  ): void => {
    if (typeof type !== "string" || typeof listener !== "function") {
      return;
    }

    const listeners = windowEventListeners.get(type);

    if (!listeners) {
      return;
    }

    listeners.delete(listener);

    if (listeners.size === 0) {
      windowEventListeners.delete(type);
    }
  };

  const dispatchWindowEvent = (event: Event): boolean => {
    if (!event || typeof event.type !== "string") {
      return false;
    }

    const listeners = windowEventListeners.get(event.type);

    if (!listeners || listeners.size === 0) {
      return true;
    }

    // Snapshot pour éviter les problèmes si un listener se supprime
    // lui-même pendant l'exécution.
    const currentListeners = Array.from(listeners);

    for (const listener of currentListeners) {
      try {
        listener(event);
      } catch (error) {
        if (__DEV__) {
          console.warn(
            `[polyfill] window event "${event.type}" listener error`,
            error,
          );
        }
      }
    }

    return true;
  };

  if (typeof g.window.addEventListener !== "function") {
    g.window.addEventListener = addWindowEventListener;
  }

  if (typeof g.window.removeEventListener !== "function") {
    g.window.removeEventListener = removeWindowEventListener;
  }

  if (typeof g.window.dispatchEvent !== "function") {
    g.window.dispatchEvent = dispatchWindowEvent;
  }

  // Exposer également les méthodes sur globalThis lorsqu'elles manquent.
  //
  // Certains packages utilisent directement globalThis.addEventListener
  // plutôt que window.addEventListener.
  if (typeof g.addEventListener !== "function") {
    g.addEventListener = g.window.addEventListener;
  }

  if (typeof g.removeEventListener !== "function") {
    g.removeEventListener = g.window.removeEventListener;
  }

  if (typeof g.dispatchEvent !== "function") {
    g.dispatchEvent = g.window.dispatchEvent;
  }

  // =========================================================================
  // 2. window.location
  // =========================================================================

  if (typeof g.window.location === "undefined") {
    const WEB_ORIGIN =
      process.env.EXPO_PUBLIC_WEB_URL ?? "https://app-template.com";

    const url = new URL(WEB_ORIGIN);

    g.window.location = {
      origin: WEB_ORIGIN,
      href: WEB_ORIGIN + "/",
      protocol: url.protocol,
      host: url.host,
      hostname: url.hostname,
      port: url.port,
      pathname: "/",
      search: "",
      hash: "",

      toString: () => g.window.location.href,

      assign: (u: string) => console.warn("[window.location.assign]", u),

      replace: (u: string) => console.warn("[window.location.replace]", u),

      reload: () => console.warn("[window.location.reload] ignoré en RN"),
    };
  }

  if (typeof g.location === "undefined") {
    g.location = g.window.location;
  }

  // =========================================================================
  // 3. window.history
  // =========================================================================

  if (typeof g.window.history === "undefined") {
    g.window.history = {
      length: 1,
      state: null,
      scrollRestoration: "auto",

      pushState: (_state: any, _title: any, u?: string) =>
        console.warn("[history.pushState]", u),

      replaceState: (_state: any, _title: any, u?: string) =>
        console.warn("[history.replaceState]", u),

      back: () => console.warn("[history.back] ignoré en RN"),

      forward: () => console.warn("[history.forward] ignoré en RN"),

      go: (_delta: number) => console.warn("[history.go] ignoré en RN"),
    };
  }

  if (typeof g.history === "undefined") {
    g.history = g.window.history;
  }

  // =========================================================================
  // 4. localStorage + sessionStorage (in-memory)
  // =========================================================================

  function createMemoryStorage() {
    const store = new Map<string, string>();

    return {
      get length() {
        return store.size;
      },

      getItem(key: string): string | null {
        return store.has(key) ? store.get(key)! : null;
      },

      setItem(key: string, value: string): void {
        store.set(key, String(value));
      },

      removeItem(key: string): void {
        store.delete(key);
      },

      clear(): void {
        store.clear();
      },

      key(index: number): string | null {
        return Array.from(store.keys())[index] ?? null;
      },
    };
  }

  if (typeof g.localStorage === "undefined") {
    g.localStorage = createMemoryStorage();

    console.warn(
      "[polyfill] localStorage est in-memory. " +
        "Les données seront perdues au redémarrage. " +
        "Utiliser AsyncStorage pour la persistance.",
    );
  }

  if (typeof g.sessionStorage === "undefined") {
    g.sessionStorage = createMemoryStorage();
  }

  if (typeof g.window.localStorage === "undefined") {
    g.window.localStorage = g.localStorage;
  }

  if (typeof g.window.sessionStorage === "undefined") {
    g.window.sessionStorage = g.sessionStorage;
  }

  // =========================================================================
  // 5. document (stub minimal)
  // =========================================================================

  if (typeof g.document === "undefined") {
    const noop = () => undefined;
    const noopNull = () => null;
    const noopArray = () => [];

    const noopElement = () => ({
      style: {},

      classList: {
        add: noop,
        remove: noop,
        toggle: noop,
        contains: () => false,
      },

      setAttribute: noop,
      removeAttribute: noop,
      getAttribute: noopNull,

      appendChild: noop,
      removeChild: noop,

      addEventListener: noop,
      removeEventListener: noop,

      querySelector: noopNull,
      querySelectorAll: noopArray,
      closest: noopNull,

      contains: () => false,

      focus: noop,
      blur: noop,
      click: noop,
    });

    g.document = {
      documentElement: noopElement(),
      body: noopElement(),
      head: noopElement(),

      createElement: noopElement,
      createTextNode: () => ({}),

      getElementById: noopNull,
      getElementsByClassName: noopArray,
      getElementsByTagName: noopArray,

      querySelector: noopNull,
      querySelectorAll: noopArray,

      addEventListener: noop,
      removeEventListener: noop,

      cookie: "",
      title: "",
      hidden: false,
      visibilityState: "visible",
      readyState: "complete",
      activeElement: null,
    };
  }

  if (typeof g.window.document === "undefined") {
    g.window.document = g.document;
  }

  // =========================================================================
  // 6. navigator
  // =========================================================================

  if (typeof g.navigator === "undefined") {
    g.navigator = {
      userAgent: "ReactNative",
      platform: "ReactNative",
      language: "fr-FR",
      languages: ["fr-FR", "en-US"],
      onLine: true,

      clipboard: {
        writeText: async () => undefined,

        readText: async () => "",
      },

      geolocation: {
        getCurrentPosition: (_success: any, err?: any) =>
          err?.({
            code: 1,
            message: "Geolocation non supporté en polyfill",
          }),

        watchPosition: () => 0,

        clearWatch: () => undefined,
      },
    };
  }

  if (typeof g.window.navigator === "undefined") {
    g.window.navigator = g.navigator;
  }

  // =========================================================================
  // 7. matchMedia
  // =========================================================================

  if (typeof g.matchMedia === "undefined") {
    g.matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,

      addListener: () => undefined,

      removeListener: () => undefined,

      addEventListener: () => undefined,

      removeEventListener: () => undefined,

      dispatchEvent: () => false,
    });
  }

  if (typeof g.window.matchMedia === "undefined") {
    g.window.matchMedia = g.matchMedia;
  }

  // =========================================================================
  // 8. ResizeObserver / IntersectionObserver
  // =========================================================================

  if (typeof g.ResizeObserver === "undefined") {
    g.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof g.IntersectionObserver === "undefined") {
    g.IntersectionObserver = class {
      root = null;
      rootMargin = "";
      thresholds: number[] = [];

      observe() {}

      unobserve() {}

      disconnect() {}

      takeRecords() {
        return [];
      }
    };
  }

  if (typeof g.window.ResizeObserver === "undefined") {
    g.window.ResizeObserver = g.ResizeObserver;
  }

  if (typeof g.window.IntersectionObserver === "undefined") {
    g.window.IntersectionObserver = g.IntersectionObserver;
  }

  // =========================================================================
  // 9. requestAnimationFrame
  // =========================================================================

  if (typeof g.requestAnimationFrame === "undefined") {
    g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16);

    g.cancelAnimationFrame = (id: any) => clearTimeout(id);
  }

  // Exposer également sur window.
  if (typeof g.window.requestAnimationFrame !== "function") {
    g.window.requestAnimationFrame = g.requestAnimationFrame;
  }

  if (typeof g.window.cancelAnimationFrame !== "function") {
    g.window.cancelAnimationFrame = g.cancelAnimationFrame;
  }

  // =========================================================================
  // 10. AbortSignal.any
  // =========================================================================
  //
  // LiveKit / livekit-client peut utiliser AbortSignal.any().
  // Certaines versions de React Native / Hermes peuvent ne pas
  // exposer cette API.
  //
  // On ne l'installe que lorsqu'elle manque.
  // =========================================================================

  if (
    typeof g.AbortSignal !== "undefined" &&
    typeof g.AbortController !== "undefined" &&
    typeof g.AbortSignal.any !== "function"
  ) {
    g.AbortSignal.any = (signals: AbortSignal[]): AbortSignal => {
      const controller = new g.AbortController();

      for (const signal of signals) {
        if (signal.aborted) {
          controller.abort(signal.reason);

          return controller.signal;
        }
      }

      const onAbort = (event?: Event) => {
        controller.abort(
          (event?.target as AbortSignal | null | undefined)?.reason,
        );
      };

      for (const signal of signals) {
        signal.addEventListener("abort", onAbort, { once: true });
      }

      return controller.signal;
    };
  }
}

export {};

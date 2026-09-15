// src/polyfills/web-apis.ts
/**
 * Polyfill des APIs web-only pour React Native (iOS / Android uniquement).
 *
 * ⚠️ À importer EN PREMIER dans `app/_layout.tsx` avant tout autre code.
 *
 * 🚨 V8.6 : ce polyfill ne s'active QUE sur iOS et Android (via Platform.OS).
 *
 *    En React Native Web (navigateur) et en SSR (Node.js), `Platform.OS`
 *    vaut `"web"`. Dans ce cas :
 *      - Soit les APIs existent nativement (navigateur)
 *      - Soit elles sont volontairement absentes (SSR)
 *    Dans les 2 cas, on ne doit RIEN polyfiller.
 *
 *    Sinon NativeWind / react-native-css-interop crash avec :
 *      "globalThis.window?.getComputedStyle is not a function"
 */

import { Platform } from "react-native";

// ── Détection de l'environnement ─────────────────────────────────────────
const isWebOrSSR = Platform.OS === "web";

if (isWebOrSSR) {
  // Navigateur ou SSR : on ne touche à RIEN.
  // eslint-disable-next-line no-console
  console.log("[polyfill] Platform.OS === 'web' — polyfills désactivés.");
} else {
  // ── iOS / Android : on active tous les polyfills ───────────────────────
  const g: any = typeof globalThis !== "undefined" ? globalThis : {};

  // 1. window
  if (typeof g.window === "undefined") {
    g.window = {};
  }

  // 2. window.location
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

  // 3. window.history
  if (typeof g.window.history === "undefined") {
    g.window.history = {
      length: 1,
      state: null,
      scrollRestoration: "auto",
      pushState: (_: any, __: any, u?: string) =>
        console.warn("[history.pushState]", u),
      replaceState: (_: any, __: any, u?: string) =>
        console.warn("[history.replaceState]", u),
      back: () => console.warn("[history.back] ignoré en RN"),
      forward: () => console.warn("[history.forward] ignoré en RN"),
      go: (_: number) => console.warn("[history.go] ignoré en RN"),
    };
  }

  if (typeof g.history === "undefined") {
    g.history = g.window.history;
  }

  // 4. localStorage + sessionStorage (in-memory)
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

  // 5. document (stub minimal)
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

  // 6. navigator
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
        getCurrentPosition: (_: any, err?: any) =>
          err?.({ code: 1, message: "Geolocation non supporté en polyfill" }),
        watchPosition: () => 0,
        clearWatch: () => undefined,
      },
    };
  }

  if (typeof g.window.navigator === "undefined") {
    g.window.navigator = g.navigator;
  }

  // 7. matchMedia
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

  // 8. ResizeObserver / IntersectionObserver (stubs)
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
      thresholds = [];
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

  // 9. requestAnimationFrame
  if (typeof g.requestAnimationFrame === "undefined") {
    g.requestAnimationFrame = (cb: any) => setTimeout(() => cb(Date.now()), 16);
    g.cancelAnimationFrame = (id: any) => clearTimeout(id);
  }
}

export {};

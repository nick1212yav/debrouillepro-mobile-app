// metro.config.js
//
// Configuration Metro — DébrouillePro
//
// ⚠️ RÈGLE IMPORTANTE :
//   On ne touche PAS à resolver.sourceExts ni resolver.assetExts.
//
//   Expo configure déjà Metro pour résoudre automatiquement :
//     MapPage.native.tsx  →  Android / iOS
//     MapPage.web.tsx     →  Web
//     MapPage.tsx         →  fallback
//
//   Toute modification manuelle de ces listes casse la résolution
//   interne d'expo-router (et d'autres packages Expo).
//
// Objectifs :
//  1. Compatibilité NativeWind (Tailwind sur React Native).
//  2. Windows-friendly (pas de Watchman, plus rapide).
//  3. Résolution automatique par plateforme (native / web).

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

/* ============================================================================
 * WATCHER — Windows friendly
 * ========================================================================== */

// Watchman ralentit parfois Metro sous Windows.
// On utilise le watcher natif de Node à la place.
config.watcher = {
  ...config.watcher,
  useWatchman: false,
};

/* ============================================================================
 * EXPORT avec NativeWind
 * ========================================================================== */

// NativeWind wrappe Metro pour transformer les classes Tailwind.
// Ne PAS retirer : sans ça, `className` ne fonctionne plus.
module.exports = withNativeWind(config, {
  input: "./global.css",
});

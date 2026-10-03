// app/_layout.tsx
import "@/polyfills/web-apis";
import "../global.css";
import "../nativewind";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { Slot } from "expo-router";
import { registerGlobals } from "@livekit/react-native";

import { DefaultProviders } from "../src/components/providers/default";
import { UIBridge } from "@/core/sdk/ui/UIBridge";
import { configureGoogleSignin } from "@/services/auth/firebaseAuth";

// ── LiveKit React Native ────────────────────────────────────────────────────
// Initialise les WebRTC globals requis par LiveKit.
// Doit être exécuté avant toute utilisation de LiveKit.
registerGlobals();

// ── Reanimated ─────────────────────────────────────────────────────────────
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

// ── Authentication ──────────────────────────────────────────────────────────
configureGoogleSignin();

export default function RootLayout() {
  return (
    <DefaultProviders>
      <UIBridge />
      <Slot />
    </DefaultProviders>
  );
}

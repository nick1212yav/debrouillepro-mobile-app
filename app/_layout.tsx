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
import { StripeProvider } from "@stripe/stripe-react-native";

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
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  const tree = (
    <DefaultProviders>
      <UIBridge />
      <Slot />
    </DefaultProviders>
  );

  if (!publishableKey) {
    console.warn(
      "[Stripe] EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante. " +
        "Les fonctionnalités de paiement Stripe sont indisponibles.",
    );

    return tree;
  }

  return (
    <StripeProvider publishableKey={publishableKey}>{tree}</StripeProvider>
  );
}

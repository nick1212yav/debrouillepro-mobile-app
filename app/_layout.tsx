// app/_layout.tsx
import "@/polyfills/web-apis";
import "../global.css";
import "../nativewind";

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";
import { Slot } from "expo-router";

import { DefaultProviders } from "../src/components/providers/default";
import { UIBridge } from "@/core/sdk/ui/UIBridge";
import { configureGoogleSignin } from "@/services/auth/firebaseAuth";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

configureGoogleSignin();

export default function RootLayout() {
  return (
    <DefaultProviders>
      <UIBridge />
      <Slot />
    </DefaultProviders>
  );
}

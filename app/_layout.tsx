import "../nativewind";
import { Stack } from "expo-router";
import { DefaultProviders } from "../src/components/providers/default";
import { UIBridge } from "@/core/sdk/ui/UIBridge";

export default function RootLayout() {
  return (
    <DefaultProviders>
      <UIBridge />
      <Stack screenOptions={{ headerShown: false }} />
    </DefaultProviders>
  );
}

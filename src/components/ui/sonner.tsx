// src/components/ui/sonner.tsx
import { useColorScheme } from "react-native";
import {
  Toaster as SonnerNativeToaster,
  type ToasterProps,
} from "sonner-native";

const Toaster = (props: ToasterProps) => {
  const colorScheme = useColorScheme();
  const theme = colorScheme === "dark" ? "dark" : "light";

  return <SonnerNativeToaster theme={theme} {...props} />;
};

export { Toaster };

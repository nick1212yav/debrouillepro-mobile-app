// src/shims/cmdk.tsx
/**
 * Shim `cmdk` (Command Menu Kit) pour React Native.
 * Web-only (DOM). Rend un composant no-op.
 */
import * as React from "react";
import { View, Text, type ViewProps } from "react-native";

const noop = (_props: any) => null;

export const Command = ({ children, ...props }: ViewProps) => (
  <View {...props}>{children}</View>
);
export const CommandInput = noop;
export const CommandList = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
export const CommandEmpty = noop;
export const CommandGroup = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
);
export const CommandItem = noop;
export const CommandSeparator = noop;
export const CommandDialog = noop;
export const CommandLoading = noop;
export const CommandShortcut = noop;

export default Command;

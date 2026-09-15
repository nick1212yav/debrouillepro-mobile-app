// src/shims/react-resizable-panels.tsx
/**
 * Shim `react-resizable-panels` pour React Native.
 * Web-only. Rend les panels en colonnes statiques.
 */
import * as React from "react";
import { View, type ViewProps } from "react-native";

export const PanelGroup = ({ children, ...props }: ViewProps) => (
  <View {...props}>{children}</View>
);
export const Panel = ({ children, ...props }: ViewProps) => (
  <View {...props}>{children}</View>
);
export const PanelResizeHandle = (_props: any) => null;

export default { PanelGroup, Panel, PanelResizeHandle };

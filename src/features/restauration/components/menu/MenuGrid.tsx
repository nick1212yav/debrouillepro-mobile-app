import { View } from "react-native";
import type { ReactNode } from "react";

interface MenuGridProps {
  children: ReactNode;
}

export function MenuGrid({ children }: MenuGridProps) {
  return (
    <View className="gap-3.5">
      {children}
    </View>
  );
}

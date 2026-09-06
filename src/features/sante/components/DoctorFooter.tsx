import { View } from "react-native";

// src/features/sante/components/DoctorFooter.tsx
import type { ReactNode } from "react";

interface DoctorFooterProps {
  children: ReactNode;
}

export function DoctorFooter({ children }: DoctorFooterProps) {
  return (
    <View
      className="flex-shrink-0 p-4 border-t border-white/10"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      {children}
    </View>
  );
}

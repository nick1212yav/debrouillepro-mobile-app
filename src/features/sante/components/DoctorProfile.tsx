import { View } from "react-native";

// src/features/sante/components/DoctorProfile.tsx
import type { ReactNode } from "react";

interface DoctorProfileProps {
  children: ReactNode;
}

export function DoctorProfile({ children }: DoctorProfileProps) {
  return <View className="space-y-4">{children}</View>;
}

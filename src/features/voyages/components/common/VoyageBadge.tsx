import { View } from "react-native";

// src/features/voyages/components/common/VoyageBadge.tsx
import type { ReactNode } from "react"; // ✅ Correction : import type unifié [1]

interface VoyageBadgeProps {
  children?: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "info";
}

export function VoyageBadge({
  children,
  className = "",
  variant = "primary",
}: VoyageBadgeProps) {
  const styles = {
    primary: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    secondary: "bg-white/5 text-white/60 border-white/10",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  };

  return (
    <View
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border backdrop-blur-md ${styles[variant]} ${className}`}
    >
      {children}
    </View>
  );
}

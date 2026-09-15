import { Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { usePresence } from "../hooks/usePresence";

interface PresenceIndicatorProps {
  userId: Id<"users">;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-2 w-2",
  md: "h-2.5 w-2.5",
  lg: "h-3 w-3",
} as const;

export function PresenceIndicator({
  userId,
  size = "md",
  className = "",
}: PresenceIndicatorProps) {
  const { presence } = usePresence({
    userId,
    autoStart: false,
  });

  const status = presence?.status ?? "offline";

  const isOnline = status === "online";

  const isAway = status === "away";

  return (
    <Text className={`inline-flex items-center justify-center ${className}`} title={isOnline ? "En ligne" : isAway ? "Absent" : "Hors ligne"} accessibilityLabel={isOnline ? "En ligne" : isAway ? "Absent" : "Hors ligne"}>
      <Text className={`${sizeClasses[size]} rounded-full ${
          isOnline ? "bg-emerald-500" : isAway ? "bg-amber-400" : "bg-white/25"
        }`} />
    </Text>
  );
}

export default PresenceIndicator;

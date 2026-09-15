import { Text } from "react-native";
import type { Id } from "@/convex/_generated/dataModel";

import { usePresence } from "../hooks/usePresence";

interface PresenceStatusProps {
  userId: Id<"users">;
  showDevice?: boolean;
  className?: string;
}

function formatLastSeen(lastSeen: string | null) {
  if (!lastSeen) {
    return "Jamais vu";
  }

  const timestamp = new Date(lastSeen).getTime();

  if (Number.isNaN(timestamp)) {
    return "Dernière activité inconnue";
  }

  const diff = Date.now() - timestamp;

  if (diff < 60_000) {
    return "à l'instant";
  }

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `il y a ${hours} h`;
  }

  const days = Math.floor(hours / 24);

  if (days === 1) {
    return "hier";
  }

  if (days < 7) {
    return `il y a ${days} j`;
  }

  return new Date(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

export function PresenceStatus({
  userId,
  showDevice = false,
  className = "",
}: PresenceStatusProps) {
  const { presence } = usePresence({
    userId,
    autoStart: false,
  });

  if (!presence) {
    return (
      <Text className={`text-xs text-white/40 ${className}`}>Hors ligne</Text>
    );
  }

  if (presence.status === "online") {
    return (
      <Text className={`inline-flex items-center gap-1.5 text-xs text-emerald-400 ${className}`}>
        <Text className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        En ligne
        {showDevice && presence.device && (
          <Text className="text-white/35">· {presence.device}</Text>
        )}
      </Text>
    );
  }

  if (presence.status === "away") {
    return (
      <Text className={`inline-flex items-center gap-1.5 text-xs text-amber-400 ${className}`}>
        <Text className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        Absent
        {showDevice && presence.device && (
          <Text className="text-white/35">· {presence.device}</Text>
        )}
      </Text>
    );
  }

  return (
    <Text className={`text-xs text-white/40 ${className}`}>
      Hors ligne · {formatLastSeen(presence.lastSeen)}
    </Text>
  );
}

export default PresenceStatus;

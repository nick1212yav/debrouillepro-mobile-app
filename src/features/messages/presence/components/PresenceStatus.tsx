// src/features/messages/presence/components/PresenceStatus.tsx

import { StyleSheet, Text, View } from "react-native";
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
  className: _className = "",
}: PresenceStatusProps) {
  const { presence } = usePresence({
    userId,
    autoStart: false,
  });

  if (!presence) {
    return (
      <Text style={styles.offline} accessibilityLabel="Hors ligne">
        Hors ligne
      </Text>
    );
  }

  if (presence.status === "online") {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`En ligne${
          showDevice && presence.device ? `, ${presence.device}` : ""
        }`}
        style={styles.row}
      >
        <View style={[styles.dot, styles.onlineDot]} />

        <Text style={styles.onlineText}>En ligne</Text>

        {showDevice && presence.device ? (
          <Text style={styles.deviceText}>
            {" · "}
            {presence.device}
          </Text>
        ) : null}
      </View>
    );
  }

  if (presence.status === "away") {
    return (
      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={`Absent${
          showDevice && presence.device ? `, ${presence.device}` : ""
        }`}
        style={styles.row}
      >
        <View style={[styles.dot, styles.awayDot]} />

        <Text style={styles.awayText}>Absent</Text>

        {showDevice && presence.device ? (
          <Text style={styles.deviceText}>
            {" · "}
            {presence.device}
          </Text>
        ) : null}
      </View>
    );
  }

  const lastSeen = formatLastSeen(presence.lastSeen);

  return (
    <Text style={styles.offline} accessibilityLabel={`Hors ligne, ${lastSeen}`}>
      Hors ligne · {lastSeen}
    </Text>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  dot: {
    width: 6,
    height: 6,
    marginRight: 6,
    borderRadius: 3,
  },

  onlineDot: {
    backgroundColor: "#10b981",
  },

  awayDot: {
    backgroundColor: "#fbbf24",
  },

  onlineText: {
    fontSize: 12,
    color: "#34d399",
  },

  awayText: {
    fontSize: 12,
    color: "#fbbf24",
  },

  deviceText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },

  offline: {
    fontSize: 12,
    color: "rgba(255,255,255,0.40)",
  },
});

export default PresenceStatus;

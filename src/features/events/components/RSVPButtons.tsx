import { View, Pressable } from "react-native";

// src/features/events/components/RSVPButtons.tsx
import { useState } from "react";
import { CheckCircle, XCircle, Clock } from "lucide-react-native";

interface Props {
  onRSVP: (status: "attending" | "interested" | "not_going") => Promise<void>;
  currentStatus?: "attending" | "interested" | "not_going" | null;
}

export function RSVPButtons({ onRSVP, currentStatus }: Props) {
  const [status, setStatus] = useState(currentStatus || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRSVP = async (
    newStatus: "attending" | "interested" | "not_going",
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onRSVP(newStatus);
      setStatus(status === newStatus ? null : newStatus);
    } finally {
      setIsLoading(false);
    }
  };

  const buttons = [
    {
      key: "attending",
      label: "Je participe",
      icon: CheckCircle,
      color: "#10B981",
      activeBg: "rgba(16,185,129,0.15)",
    },
    {
      key: "interested",
      label: "Intéressé",
      icon: Clock,
      color: "#F59E0B",
      activeBg: "rgba(245,158,11,0.15)",
    },
    {
      key: "not_going",
      label: "Pas intéressé",
      icon: XCircle,
      color: "#EF4444",
      activeBg: "rgba(239,68,68,0.15)",
    },
  ];

  return (
    <View className="flex flex-wrap gap-2">
      {buttons.map((btn) => {
        const isActive = status === btn.key;
        return (
          <Pressable
            key={btn.key}
            onPress={() => handleRSVP(btn.key as any)}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: isActive ? btn.activeBg : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <btn.icon size={14} />
            {btn.label}
          </Pressable>
        );
      })}
    </View>
  );
}

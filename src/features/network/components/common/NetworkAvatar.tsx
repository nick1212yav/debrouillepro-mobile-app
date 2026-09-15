import { Text, View, Image } from "react-native";

// src/features/network/components/common/NetworkAvatar.tsx
import React from "react";
import { ShieldCheck } from "lucide-react-native";

interface NetworkAvatarProps {
  name?: string;
  avatar?: string | null;
  size?: number | "md" | "lg" | "xl"; // ✅ Supporte désormais les tailles numériques et textuelles [1]
  verified?: boolean; // ✅ Ajouté pour la compatibilité avec PersonCard [1]
  online?: boolean; // ✅ Ajouté pour la compatibilité avec PersonCard [1]
  className?: string;
}

export function NetworkAvatar({
  name,
  avatar,
  size = 40,
  verified = false,
  online = false,
  className = "",
}: NetworkAvatarProps) {
  // Conversion des tailles textuelles en pixels standardisés
  const getPixelSize = (s: number | "md" | "lg" | "xl"): number => {
    if (typeof s === "number") return s;
    switch (s) {
      case "md":
        return 40;
      case "lg":
        return 64;
      case "xl":
        return 96;
      default:
        return 40;
    }
  };

  const pixelSize = getPixelSize(size);

  const renderContent = () => {
    if (avatar) {
      return (
        <Image className="rounded-full object-cover w-full h-full border border-white/10" source={{ uri: avatar }} accessibilityLabel={name || "Avatar"} />
      );
    }

    const initials = name
      ? name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : "?";

    return (
      <View className="rounded-full flex items-center justify-center font-black text-white border border-white/10 w-full h-full" style={{ fontSize: pixelSize * 0.35 }}>
        {initials}
      </View>
    );
  };

  return (
    <View className={`relative flex-shrink-0 ${className}`} style={{ width: pixelSize, height: pixelSize }}>
      {renderContent()}

      {/* ✅ Badge de présence en ligne */}
      {online && (
        <Text className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#020617] animate-pulse" />
      )}

      {/* ✅ Badge de vérification intégré sur l'avatar */}
      {verified && (
        <Text className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center">
          <ShieldCheck size={11} className="text-emerald-400" />
        </Text>
      )}
    </View>
  );
}

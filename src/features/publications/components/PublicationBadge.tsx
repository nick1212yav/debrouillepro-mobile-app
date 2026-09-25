import { Text, View } from "react-native";
import { getPublicationConfig } from "../config";
import type { PublicationType } from "../types";

interface Props {
  type: PublicationType;
  size?: "sm" | "md";
}

export function PublicationBadge({ type, size = "md" }: Props) {
  const config = getPublicationConfig(type);

  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-0.5";

  const fontSize = size === "sm" ? "text-[8px]" : "text-[9px]";

  return (
    <View
      className={`flex-row items-center gap-1 rounded-full ${padding}`}
      style={{
        backgroundColor: `${config.color}15`,
        borderWidth: 1,
        borderColor: `${config.color}30`,
      }}
    >
      <Text
        className={`${fontSize} font-semibold`}
        style={{
          color: config.color,
        }}
      >
        {config.badge}
      </Text>
    </View>
  );
}

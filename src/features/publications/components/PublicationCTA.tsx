import { Pressable, Text, View } from "react-native";
import type { PublicationCTAConfig as CTAConfig } from "../types";

interface Props {
  cta: CTAConfig;
  onClick: () => void;
}

export function PublicationCTA({ cta, onClick }: Props) {
  const Icon = cta.icon;

  return (
    <Pressable
      onPress={onClick}
      accessibilityRole="button"
      accessibilityLabel={cta.label}
      className="flex-row items-center justify-center gap-1.5 rounded-xl px-4 py-1.5"
      style={({ pressed }) => ({
        backgroundColor: cta.color ?? "#7C3AED",
        opacity: pressed ? 0.9 : 1,
        elevation: 6,
        shadowColor: cta.color ?? "#7C3AED",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      })}
    >
      {Icon ? (
        <Icon size={14} color="#FFFFFF" accessibilityLabel={cta.label} />
      ) : null}

      <Text className="text-xs font-semibold text-white">{cta.label}</Text>
    </Pressable>
  );
}

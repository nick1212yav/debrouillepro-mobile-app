import { Pressable } from "react-native";
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
      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white"
      style={{  }}
    >
      {Icon && <Icon size={14} />}
      {cta.label}
    </Pressable>
  );
}

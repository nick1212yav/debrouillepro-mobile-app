import { Pressable } from "react-native";
import type { PublicationCTAConfig as CTAConfig } from "../types";

interface Props {
  cta: CTAConfig;
  onClick: () => void;
}

export function PublicationCTA({ cta, onClick }: Props) {
  const Icon = cta.icon;

  return (
    <Pressable onPress={onClick} className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white transition-all active:scale-95" style={{ boxShadow: cta.color
              ? `0 2px 12px ${cta.color}44`
              : "0 2px 12px rgba(124,58,237,0.3)" }}>
      {Icon && <Icon size={14} />}
      {cta.label}
    </Pressable>
  );
}

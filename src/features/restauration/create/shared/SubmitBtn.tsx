// src/features/restauration/create/shared/SubmitBtn.tsx

import * as React from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  type PressableProps,
} from "react-native";
import { ShieldCheck } from "lucide-react-native";

type IconComponent = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

interface SubmitBtnProps extends Omit<PressableProps, "children" | "disabled"> {
  isSubmitting: boolean;
  label: string;
  loadingLabel?: string;
  icon?: IconComponent;
  disabled?: boolean;
  className?: string;
}

export function SubmitBtn({
  isSubmitting,
  label,
  loadingLabel = "Enregistrement en cours...",
  icon: Icon = ShieldCheck,
  disabled = false,
  className = "",
  accessibilityLabel,
  ...props
}: SubmitBtnProps) {
  const isDisabled = isSubmitting || disabled;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel ?? (isSubmitting ? loadingLabel : label)
      }
      accessibilityState={{
        disabled: isDisabled,
        busy: isSubmitting,
      }}
      className={`w-full flex-row items-center justify-center gap-2 rounded-xl bg-orange-500 py-4 ${
        isDisabled ? "bg-slate-800 opacity-60" : ""
      } ${className}`}
    >
      {isSubmitting ? (
        <>
          <ActivityIndicator size="small" color="#f8fafc" />

          <Text className="text-xs font-black uppercase tracking-wider text-white">
            {loadingLabel}
          </Text>
        </>
      ) : (
        <>
          <Icon size={14} color="#020617" />

          <Text className="text-xs font-black uppercase tracking-wider text-slate-950">
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export default SubmitBtn;

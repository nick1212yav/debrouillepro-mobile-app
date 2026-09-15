import { View } from "react-native";
import type { ReactNode } from "react";
type TransitionVariant = "slide-up" | "slide-left" | "fade" | "scale";

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
  className?: string;
}

const VARIANTS: Record<
  TransitionVariant,
  { initial: Record<string, unknown>; animate: Record<string, unknown>; exit: Record<string, unknown> }
> = {
  "slide-up": {
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -16 },
  },
  "slide-left": {
    initial: { opacity: 0, x: 40 },
    animate: { opacity: 1, x: 0 },
    exit:    { opacity: 0, x: -24 },
  },
  "fade": {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit:    { opacity: 0 },
  },
  "scale": {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit:    { opacity: 0, scale: 0.98 },
  },
};

const TRANSITION = {
  duration: 0.32,
  ease: [0.22, 1, 0.36, 1] as const,
};

// Spring transition for scale variant
const SPRING_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 30,
};

export default function PageTransition({
  children,
  variant = "slide-left",
  className = "h-full w-full",
}: PageTransitionProps) {
  const v = VARIANTS[variant];
  const transition = variant === "scale" ? SPRING_TRANSITION : TRANSITION;
  return (
    <View className={className} initial={v.initial} animate={v.animate} exit={v.exit} transition={transition}>
      {children}
    </View>
  );
}

// ── Staggered list container ──────────────────────────────────────────────────

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={className} initial="hidden" animate="visible" variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
      }}>
      {children}
    </View>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <View className={className} variants={{
        hidden: { opacity: 0, y: 18 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] as const },
        },
      }}>
      {children}
    </View>
  );
}

// ── Micro-interaction button wrapper ─────────────────────────────────────────

export function PressMotion({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <View className={className} whileTap={{ scale: 0.93 }} whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} onPress={onClick}>
      {children}
    </View>
  );
}

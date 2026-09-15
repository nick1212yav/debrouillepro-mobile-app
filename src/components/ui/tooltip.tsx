// src/components/ui/tooltip.tsx
import * as React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────
interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(): TooltipContextValue {
  const ctx = React.useContext(TooltipContext);
  if (!ctx) {
    // Fallback safe : permet d'utiliser TooltipTrigger/Content hors Provider
    // sans crash (utile pendant les transitions de layout).
    return {
      open: false,
      setOpen: () => undefined,
      toggle: () => undefined,
    };
  }
  return ctx;
}

// ── TooltipProvider (compat API Radix) ────────────────────────────────────
interface TooltipProviderProps {
  children: React.ReactNode;
  /** Conservé pour compat API. Ignoré en RN. */
  delayDuration?: number;
}

function TooltipProvider({ children }: TooltipProviderProps) {
  return <>{children}</>;
}

// ── Tooltip (racine) ──────────────────────────────────────────────────────
interface TooltipProps {
  children: React.ReactNode;
  /** Contrôle externe de l'ouverture. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const toggle = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const value = React.useMemo<TooltipContextValue>(
    () => ({ open, setOpen, toggle }),
    [open, setOpen, toggle],
  );

  return (
    <TooltipContext.Provider value={value}>
      <View style={styles.root}>{children}</View>
    </TooltipContext.Provider>
  );
}

// ── TooltipTrigger ────────────────────────────────────────────────────────
interface TooltipTriggerProps {
  children: React.ReactNode;
  /** Conservé pour compat API. Ignoré en RN. */
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

function TooltipTrigger({
  children,
  className: _className,
  style,
  disabled = false,
}: TooltipTriggerProps) {
  const { toggle } = useTooltipContext();

  return (
    <Pressable
      onPress={toggle}
      disabled={disabled}
      style={style}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
}

// ── TooltipContent ────────────────────────────────────────────────────────
interface TooltipContentProps {
  children: React.ReactNode;
  /** Conservé pour compat API. Ignoré en RN. */
  className?: string;
  sideOffset?: number;
  style?: StyleProp<ViewStyle>;
  /** "top" | "bottom" (par défaut "top"). */
  side?: "top" | "bottom" | "left" | "right";
}

function TooltipContent({
  children,
  className: _className,
  sideOffset = 4,
  style,
  side = "top",
}: TooltipContentProps) {
  const { open } = useTooltipContext();

  if (!open) return null;

  const sideStyle: ViewStyle =
    side === "top"
      ? { bottom: "100%", alignSelf: "center", marginBottom: sideOffset }
      : side === "bottom"
        ? { top: "100%", alignSelf: "center", marginTop: sideOffset }
        : side === "left"
          ? { right: "100%", alignSelf: "center", marginRight: sideOffset }
          : { left: "100%", alignSelf: "center", marginLeft: sideOffset };

  return (
    <View
      pointerEvents="none"
      style={[styles.contentWrapper, sideStyle]}
      accessibilityRole="text"
    >
      <View style={[styles.content, style]}>
        {typeof children === "string" || typeof children === "number" ? (
          <Text style={styles.contentText}>{children}</Text>
        ) : (
          children
        )}
      </View>
      <View
        style={[
          styles.arrow,
          side === "top"
            ? styles.arrowBottom
            : side === "bottom"
              ? styles.arrowTop
              : side === "left"
                ? styles.arrowRight
                : styles.arrowLeft,
        ]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const ARROW_SIZE = 6;

const styles = StyleSheet.create({
  root: {
    position: "relative",
  },
  contentWrapper: {
    position: "absolute",
    zIndex: 50,
  },
  content: {
    backgroundColor: "#18181B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    maxWidth: 260,
  },
  contentText: {
    color: "#FAFAFA",
    fontSize: 12,
    lineHeight: 16,
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#18181B",
    borderBottomColor: "#18181B",
  },
  arrowBottom: {
    alignSelf: "center",
    marginTop: -ARROW_SIZE * 2 + ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderTopColor: "#18181B",
  },
  arrowTop: {
    alignSelf: "center",
    marginBottom: -ARROW_SIZE * 2 + ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: "#18181B",
  },
  arrowLeft: {
    alignSelf: "center",
    borderRightWidth: ARROW_SIZE,
    borderRightColor: "#18181B",
  },
  arrowRight: {
    alignSelf: "center",
    borderLeftWidth: ARROW_SIZE,
    borderLeftColor: "#18181B",
  },
});

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

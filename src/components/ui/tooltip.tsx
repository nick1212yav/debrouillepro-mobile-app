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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null);

function useTooltipContext(): TooltipContextValue {
  const context = React.useContext(TooltipContext);

  if (context) {
    return context;
  }

  // Safe fallback pour préserver la compatibilité avec les composants
  // utilisés hors d'un <Tooltip>.
  return {
    open: false,
    setOpen: () => undefined,
    toggle: () => undefined,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TooltipProvider
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipProviderProps {
  children: React.ReactNode;

  /**
   * Conservé pour compatibilité avec l'API précédente.
   * Les délais ne sont pas nécessaires pour cette implémentation RN.
   */
  delayDuration?: number;
}

function TooltipProvider({
  children,
  delayDuration: _delayDuration,
}: TooltipProviderProps) {
  /*
   * IMPORTANT :
   * Le Provider ne crée volontairement AUCUN <View>.
   *
   * Il s'agit uniquement d'un provider de compatibilité API.
   * Cela évite d'introduire un conteneur natif supplémentaire autour
   * de l'arbre de navigation Expo Router.
   */
  return <>{children}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipProps {
  children: React.ReactNode;

  /** Contrôle externe de l'ouverture. */
  open?: boolean;

  /** Notification lors d'un changement d'état. */
  onOpenChange?: (open: boolean) => void;

  /** État initial en mode non contrôlé. */
  defaultOpen?: boolean;
}

function Tooltip({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: TooltipProps) {
  const [uncontrolledOpen, setUncontrolledOpen] =
    React.useState<boolean>(defaultOpen);

  const isControlled = controlledOpen !== undefined;

  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  const toggle = React.useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  const contextValue = React.useMemo<TooltipContextValue>(
    () => ({
      open,
      setOpen,
      toggle,
    }),
    [open, setOpen, toggle],
  );

  return (
    <TooltipContext.Provider value={contextValue}>
      {children}
    </TooltipContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TooltipTrigger
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipTriggerProps {
  children: React.ReactNode;

  /**
   * Conservé pour compatibilité avec les composants existants.
   * Le style Tailwind web n'est pas appliqué directement en RN.
   */
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
      accessibilityState={{ disabled }}
    >
      {children}
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TooltipContent
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipContentProps {
  children: React.ReactNode;

  /**
   * Conservé pour compatibilité API.
   */
  className?: string;

  sideOffset?: number;

  style?: StyleProp<ViewStyle>;

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

  if (!open) {
    return null;
  }

  const sideStyle: ViewStyle =
    side === "top"
      ? {
          bottom: "100%",
          alignSelf: "center",
          marginBottom: sideOffset,
        }
      : side === "bottom"
        ? {
            top: "100%",
            alignSelf: "center",
            marginTop: sideOffset,
          }
        : side === "left"
          ? {
              right: "100%",
              alignSelf: "center",
              marginRight: sideOffset,
            }
          : {
              left: "100%",
              alignSelf: "center",
              marginLeft: sideOffset,
            };

  const arrowStyle =
    side === "top"
      ? styles.arrowBottom
      : side === "bottom"
        ? styles.arrowTop
        : side === "left"
          ? styles.arrowRight
          : styles.arrowLeft;

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

      <View style={[styles.arrow, arrowStyle]} />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const ARROW_SIZE = 6;

const styles = StyleSheet.create({
  /*
   * Le wrapper du tooltip lui-même reste uniquement positionnel.
   * Il ne doit jamais être utilisé comme conteneur global.
   */
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
    marginTop: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderTopColor: "#18181B",
  },

  arrowTop: {
    alignSelf: "center",
    marginBottom: -ARROW_SIZE,
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

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };

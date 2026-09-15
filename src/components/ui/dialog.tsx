// src/components/ui/dialog.tsx
import * as React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewProps,
  type ViewStyle,
} from "react-native";
import { X } from "lucide-react-native";

// ── Context pour open/close ──────────────────────────────────────────────
interface DialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog(): DialogContextValue {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    // Fallback safe : évite un crash si un sous-composant est utilisé isolé
    return { open: false, setOpen: () => undefined };
  }
  return ctx;
}

// ── Dialog (racine) ──────────────────────────────────────────────────────
interface DialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
}

export function Dialog({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
}: DialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const value = React.useMemo<DialogContextValue>(
    () => ({ open, setOpen }),
    [open, setOpen],
  );

  return (
    <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
  );
}

// ── DialogTrigger ────────────────────────────────────────────────────────
interface DialogTriggerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function DialogTrigger({
  children,
  style,
  disabled = false,
}: DialogTriggerProps) {
  const { setOpen } = useDialog();
  return (
    <Pressable
      onPress={() => setOpen(true)}
      disabled={disabled}
      style={style}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
}

// ── DialogClose ──────────────────────────────────────────────────────────
interface DialogCloseProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function DialogClose({ children, style }: DialogCloseProps) {
  const { setOpen } = useDialog();
  return (
    <Pressable
      onPress={() => setOpen(false)}
      style={style}
      accessibilityRole="button"
      accessibilityLabel="Fermer"
    >
      {children}
    </Pressable>
  );
}

// ── DialogPortal (no-op en RN) ───────────────────────────────────────────
export function DialogPortal({ children }: { children?: React.ReactNode }) {
  return <>{children}</>;
}

// ── DialogOverlay (no-op, utilisé dans Content) ─────────────────────────
export function DialogOverlay(_props: ViewProps) {
  return null;
}

// ── DialogContent ────────────────────────────────────────────────────────
interface DialogContentProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  showCloseButton?: boolean;
}

export function DialogContent({
  children,
  style,
  showCloseButton = true,
}: DialogContentProps) {
  const { open, setOpen } = useDialog();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => setOpen(false)}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Pressable
          onPress={() => setOpen(false)}
          style={styles.backdrop}
          accessibilityLabel="Fermer"
        />

        {/* Content */}
        <View style={[styles.content, style]}>
          {children}

          {showCloseButton && (
            <Pressable
              onPress={() => setOpen(false)}
              style={styles.closeButton}
              hitSlop={6}
              accessibilityLabel="Fermer"
            >
              <X size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── DialogHeader ─────────────────────────────────────────────────────────
export function DialogHeader({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

// ── DialogFooter ─────────────────────────────────────────────────────────
export function DialogFooter({ style, children, ...props }: ViewProps) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

// ── DialogTitle ──────────────────────────────────────────────────────────
interface DialogTitleProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function DialogTitle({ children, style }: DialogTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

// ── DialogDescription ────────────────────────────────────────────────────
interface DialogDescriptionProps {
  children?: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function DialogDescription({ children, style }: DialogDescriptionProps) {
  return <Text style={[styles.description, style]}>{children}</Text>;
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  content: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#18181B",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 24,
    gap: 16,
    // Ombre iOS + Android
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  header: {
    flexDirection: "column",
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 22,
  },
  description: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    lineHeight: 20,
  },
});

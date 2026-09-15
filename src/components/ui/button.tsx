// src/components/ui/button.tsx
import * as React from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

// ── Types ──────────────────────────────────────────────────────────────────
export type ButtonVariant =
  | "default"
  | "destructive"
  | "outline"
  | "secondary"
  | "ghost"
  | "link";

export type ButtonSize =
  | "default"
  | "sm"
  | "lg"
  | "icon"
  | "icon-sm"
  | "icon-lg";

export interface ButtonVariantsOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  style?: StyleProp<ViewStyle>;
}

export interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Conservé pour compatibilité API (ignoré en RN). */
  className?: string;
  /** Clone l'unique enfant en lui passant onPress. */
  asChild?: boolean;
  children?: React.ReactNode;
}

// ── Base styles ────────────────────────────────────────────────────────────
const CONTAINER_BASE: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  borderRadius: 8,
};

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  default: { backgroundColor: "#8B5CF6" },
  destructive: { backgroundColor: "#DC2626" },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  secondary: { backgroundColor: "rgba(255,255,255,0.1)" },
  ghost: { backgroundColor: "transparent" },
  link: { backgroundColor: "transparent" },
};

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  default: { height: 36, paddingHorizontal: 16 },
  sm: { height: 32, paddingHorizontal: 12 },
  lg: { height: 40, paddingHorizontal: 24 },
  icon: { height: 36, width: 36, paddingHorizontal: 0 },
  "icon-sm": { height: 32, width: 32, paddingHorizontal: 0 },
  "icon-lg": { height: 40, width: 40, paddingHorizontal: 0 },
};

const TEXT_VARIANT_STYLES: Record<ButtonVariant, TextStyle> = {
  default: { color: "#FFFFFF", fontWeight: "600" },
  destructive: { color: "#FFFFFF", fontWeight: "600" },
  outline: { color: "#FFFFFF", fontWeight: "600" },
  secondary: { color: "#FFFFFF", fontWeight: "600" },
  ghost: { color: "#FFFFFF", fontWeight: "600" },
  link: {
    color: "#A78BFA",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
};

const TEXT_SIZE_STYLES: Record<ButtonSize, TextStyle> = {
  default: { fontSize: 14 },
  sm: { fontSize: 12 },
  lg: { fontSize: 15 },
  icon: { fontSize: 14 },
  "icon-sm": { fontSize: 12 },
  "icon-lg": { fontSize: 14 },
};

// ── Helpers exportés (compat avec l'API shadcn) ────────────────────────────
export function buttonVariants(options: ButtonVariantsOptions = {}): ViewStyle {
  const variant: ButtonVariant = options.variant ?? "default";
  const size: ButtonSize = options.size ?? "default";

  return StyleSheet.flatten([
    CONTAINER_BASE,
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    options.style,
  ]) as ViewStyle;
}

// ── Composant (forwardRef pour compat shadcn) ─────────────────────────────
export const Button = React.forwardRef<View, ButtonProps>(function Button(
  {
    variant = "default",
    size = "default",
    className: _className,
    asChild = false,
    style,
    children,
    ...props
  },
  ref,
) {
  const containerStyle = buttonVariants({ variant, size, style });

  const textStyle: TextStyle = {
    ...TEXT_VARIANT_STYLES[variant],
    ...TEXT_SIZE_STYLES[size],
  };

  // `asChild` : clone l'unique enfant et lui transmet onPress + styles
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      onPress: (event: any) => {
        child.props?.onPress?.(event);
        props.onPress?.(event);
      },
      style: StyleSheet.flatten([containerStyle, child.props?.style]),
    });
  }

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      style={({ pressed }) => [containerStyle, pressed && { opacity: 0.7 }]}
      {...props}
    >
      {typeof children === "string" || typeof children === "number" ? (
        <Text style={textStyle}>{children}</Text>
      ) : (
        children
      )}
    </Pressable>
  );
});

export default Button;

// src/shims/radix.tsx
/**
 * Shim global pour tous les `@radix-ui/react-*`.
 *
 * Fournit des primitives no-op (rendues comme `<View>`) qui préservent
 * l'API shadcn/ui (`Root`, `Trigger`, `Content`, `Close`, `Slot`, …).
 *
 * ⚠️ Les composants shadcn/ui basés sur Radix deviennent des composants
 *    statiques qui NE FONCTIONNENT PAS visuellement. But : faire passer
 *    le bundle. Les composants critiques seront migrés en RN un par un.
 */
import * as React from "react";
import { Text, View, type ViewProps } from "react-native";

// ── Filtre des props non-RN ─────────────────────────────────────────────
const INVALID_PROP_PREFIXES = ["data-", "aria-"];
const INVALID_PROPS = new Set([
  "asChild",
  "className",
  "sideOffset",
  "delayDuration",
  "skipDelayDuration",
  "disableOutsidePointerEvents",
  "onOpenAutoFocus",
  "onCloseAutoFocus",
  "onEscapeKeyDown",
  "onPointerDownOutside",
  "onInteractOutside",
  "forceMount",
  "dir",
  "modal",
  "loop",
  "orientation",
]);

function filterProps(props: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (INVALID_PROPS.has(k)) continue;
    if (INVALID_PROP_PREFIXES.some((p) => k.startsWith(p))) continue;
    filtered[k] = v;
  }
  return filtered;
}

// ── Enfants : wrap les strings dans <Text> (RN n'accepte pas les strings
//    directement dans <View>) ────────────────────────────────────────────
function renderChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string" || typeof children === "number") {
    return <Text>{children}</Text>;
  }
  if (Array.isArray(children)) {
    return children.map((c, i) =>
      typeof c === "string" || typeof c === "number" ? (
        <Text key={i}>{c}</Text>
      ) : (
        c
      ),
    );
  }
  return children;
}

// ── Fabrique no-op ───────────────────────────────────────────────────────
function makeNoop(name: string) {
  const C = React.forwardRef<any, ViewProps>(({ children, ...props }, ref) => {
    const cleanProps = filterProps(props as Record<string, unknown>);
    return (
      <View ref={ref} {...cleanProps}>
        {renderChildren(children)}
      </View>
    );
  });
  C.displayName = `Radix.${name}`;
  return C;
}

// ── Slot (pour @radix-ui/react-slot) ────────────────────────────────────
export const Slot = React.forwardRef<any, any>(
  ({ children, ...props }, ref) => {
    if (React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ...props,
        ref,
      });
    }
    return <>{children}</>;
  },
);
Slot.displayName = "Radix.Slot";

// ── Toutes les primitives utilisées par shadcn/ui ───────────────────────
export const Root = makeNoop("Root");
export const Trigger = makeNoop("Trigger");
export const Content = makeNoop("Content");
export const Overlay = makeNoop("Overlay");
export const Portal = makeNoop("Portal");
export const Close = makeNoop("Close");
export const Title = makeNoop("Title");
export const Description = makeNoop("Description");
export const Item = makeNoop("Item");
export const ItemText = makeNoop("ItemText");
export const ItemIndicator = makeNoop("ItemIndicator");
export const Group = makeNoop("Group");
export const Label = makeNoop("Label");
export const Separator = makeNoop("Separator");
export const Indicator = makeNoop("Indicator");
export const Thumb = makeNoop("Thumb");
export const Track = makeNoop("Track");
export const Range = makeNoop("Range");
export const Arrow = makeNoop("Arrow");
export const Header = makeNoop("Header");
export const Footer = makeNoop("Footer");
export const Menu = makeNoop("Menu");
export const Sub = makeNoop("Sub");
export const SubTrigger = makeNoop("SubTrigger");
export const SubContent = makeNoop("SubContent");
export const RadioGroup = makeNoop("RadioGroup");
export const RadioItem = makeNoop("RadioItem");
export const CheckboxItem = makeNoop("CheckboxItem");
export const Viewport = makeNoop("Viewport");
export const Corner = makeNoop("Corner");
export const Scrollbar = makeNoop("Scrollbar");
export const Link = makeNoop("Link");
export const List = makeNoop("List");
export const Action = makeNoop("Action");
export const Cancel = makeNoop("Cancel");
export const Image = makeNoop("Image");
export const Fallback = makeNoop("Fallback");
export const AspectRatio = makeNoop("AspectRatio");
export const RadioIndicator = makeNoop("RadioIndicator");

export default {
  Slot,
  Root,
  Trigger,
  Content,
  Overlay,
  Portal,
  Close,
  Title,
  Description,
  Item,
  Group,
  Label,
};

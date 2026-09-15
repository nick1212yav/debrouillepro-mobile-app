// src/shims/motion-react.tsx
/**
 * Shim `motion/react` → React Native `Animated.View`.
 *
 * Remplace `framer-motion` / `motion` (web-only) par des composants
 * compatibles React Native. Les props `initial`, `animate`, `exit`,
 * `transition` sont **ignorées** (pas d'animation automatique) pour
 * éviter les erreurs de bundling.
 *
 * Pour de vraies animations, il faudra migrer vers `react-native-reanimated`
 * au cas par cas, mais le shim permet au bundle de passer.
 *
 * 🆕 V8.5 : ajout de `useReducedMotion()` pour compatibilité avec les
 *           composants qui l'utilisent (OfflineBanner, TabBar, TopBar, etc.)
 */
import * as React from "react";
import {
  AccessibilityInfo,
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  type ViewProps,
} from "react-native";

// ── Types ─────────────────────────────────────────────────────────────────
type MotionProps = ViewProps & {
  initial?: unknown;
  animate?: unknown;
  exit?: unknown;
  transition?: unknown;
  whileHover?: unknown;
  whileTap?: unknown;
  whileFocus?: unknown;
  whileInView?: unknown;
  variants?: unknown;
  layout?: unknown;
  layoutId?: string;
  drag?: unknown;
  dragConstraints?: unknown;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  [key: string]: unknown;
};

// ── Helper : filtre les props motion-only ────────────────────────────────
const MOTION_ONLY_PROPS = new Set([
  "initial",
  "animate",
  "exit",
  "transition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileInView",
  "variants",
  "layout",
  "layoutId",
  "drag",
  "dragConstraints",
  "onAnimationStart",
  "onAnimationComplete",
]);

function filterMotionProps(props: MotionProps): ViewProps {
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!MOTION_ONLY_PROPS.has(k)) {
      filtered[k] = v;
    }
  }
  return filtered as ViewProps;
}

// ── motion.* : chaque clé renvoie un wrapper de View/Text/Image ──────────
const createMotionComponent = <P extends ViewProps>(
  Component: React.ComponentType<P>,
) => {
  const Wrapped = React.forwardRef<any, MotionProps>((props, ref) => {
    const cleanProps = filterMotionProps(props) as P;
    return <Component ref={ref} {...cleanProps} />;
  });
  Wrapped.displayName = `Motion(${Component.displayName ?? "Component"})`;
  return Wrapped;
};

export const motion = {
  div: createMotionComponent(View),
  span: createMotionComponent(Text),
  p: createMotionComponent(Text),
  a: createMotionComponent(Pressable),
  button: createMotionComponent(Pressable),
  img: createMotionComponent(Image),
  ul: createMotionComponent(View),
  ol: createMotionComponent(View),
  li: createMotionComponent(View),
  section: createMotionComponent(View),
  article: createMotionComponent(View),
  header: createMotionComponent(View),
  footer: createMotionComponent(View),
  main: createMotionComponent(View),
  nav: createMotionComponent(View),
  aside: createMotionComponent(View),
  form: createMotionComponent(View),
  label: createMotionComponent(Text),
  input: createMotionComponent(View),
  textarea: createMotionComponent(View),
  View: createMotionComponent(View),
  Text: createMotionComponent(Text),
  Image: createMotionComponent(Image),
  Pressable: createMotionComponent(Pressable),
  ScrollView: createMotionComponent(ScrollView),
};

// ── AnimatePresence : simple pass-through ────────────────────────────────
interface AnimatePresenceProps {
  children?: React.ReactNode;
  mode?: "sync" | "wait" | "popLayout";
  initial?: boolean;
  onExitComplete?: () => void;
}

export function AnimatePresence({ children }: AnimatePresenceProps) {
  return <>{children}</>;
}

// ── Autres exports (stubs) ───────────────────────────────────────────────
export const MotionConfig = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

export function useAnimation() {
  return {
    start: async () => undefined,
    stop: () => undefined,
    set: () => undefined,
  };
}

export function useMotionValue<T>(initial: T) {
  return {
    get: () => initial,
    set: (_v: T) => undefined,
    onChange: () => () => undefined,
  };
}

export function useTransform<T, U>(_input: T, _fn: (v: T) => U): U | undefined {
  return undefined;
}

export function useScroll() {
  return {
    scrollY: { get: () => 0, onChange: () => () => undefined },
    scrollX: { get: () => 0, onChange: () => () => undefined },
  };
}

export const LayoutGroup = ({ children }: { children: React.ReactNode }) => (
  <>{children}</>
);

// 🆕 V8.5 : useReducedMotion (compatibilité avec les composants web migrés)
//
// Sur le web, `useReducedMotion` lit `prefers-reduced-motion` via matchMedia.
// En RN, on lit `AccessibilityInfo.isReduceMotionEnabled()`.
//
// Note : `AccessibilityInfo` est async, donc la première valeur retournée
// est toujours `false` (comportement par défaut). Le hook bascule ensuite
// sur la vraie valeur si nécessaire via un state.
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    // Lecture initiale
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (!cancelled) setReduced(value);
      })
      .catch(() => {
        // Silencieux : on garde `false` par défaut
      });

    // Écoute des changements
    const subscription = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      (value: boolean) => {
        if (!cancelled) setReduced(value);
      },
    );

    return () => {
      cancelled = true;
      if (subscription && typeof subscription.remove === "function") {
        subscription.remove();
      }
    };
  }, []);

  return reduced;
}

export default { motion, AnimatePresence, useReducedMotion };

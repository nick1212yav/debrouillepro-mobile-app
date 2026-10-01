import { Pressable, StyleSheet, View, type ViewStyle } from "react-native";
import { useEffect, type ReactNode } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

type TransitionVariant = "slide-up" | "slide-left" | "fade" | "scale";

interface PageTransitionProps {
  children: ReactNode;
  variant?: TransitionVariant;
}

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

interface PressMotionProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const ENTER_DURATION = 320;
const STAGGER_DELAY = 60;
const INITIAL_CHILD_DELAY = 50;
const ENTER_EASING = Easing.bezier(0.22, 1, 0.36, 1);
const PAGE_SPRING = { damping: 30, stiffness: 380, mass: 0.8 };
const PRESS_SPRING = { damping: 18, stiffness: 420, mass: 0.55 };

function getInitialState(variant: TransitionVariant) {
  switch (variant) {
    case "slide-up":
      return { opacity: 0, translateX: 0, translateY: 32, scale: 1 };
    case "slide-left":
      return { opacity: 0, translateX: 40, translateY: 0, scale: 1 };
    case "fade":
      return { opacity: 0, translateX: 0, translateY: 0, scale: 1 };
    case "scale":
      return { opacity: 0, translateX: 0, translateY: 0, scale: 0.96 };
  }
}

/**
 * IMPORTANT : pas de `className` ici.
 * NativeWind injecte `height: 100%` via `h-full`, qui écrase `flex: 1`
 * quand le parent n'a pas de hauteur explicite → composant invisible.
 */
export default function PageTransition({
  children,
  variant = "slide-left",
}: PageTransitionProps) {
  const initial = getInitialState(variant);

  const opacity = useSharedValue(initial.opacity);
  const translateX = useSharedValue(initial.translateX);
  const translateY = useSharedValue(initial.translateY);
  const scale = useSharedValue(initial.scale);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  useEffect(() => {
    opacity.value = withTiming(1, {
      duration: ENTER_DURATION,
      easing: ENTER_EASING,
    });

    if (variant === "scale") {
      scale.value = withSpring(1, PAGE_SPRING);
      return;
    }

    translateX.value = withTiming(0, {
      duration: ENTER_DURATION,
      easing: ENTER_EASING,
    });

    translateY.value = withTiming(0, {
      duration: ENTER_DURATION,
      easing: ENTER_EASING,
    });
  }, [opacity, scale, translateX, translateY, variant]);

  return (
    <View style={styles.fill}>
      <Animated.View style={[styles.fill, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

export function StaggerContainer({
  children,
  className = "",
}: StaggerContainerProps) {
  return (
    <View className={className} style={styles.staggerContainer}>
      {children}
    </View>
  );
}

export function StaggerItem({
  children,
  className = "",
  index = 0,
}: StaggerItemProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(18);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    const delay = INITIAL_CHILD_DELAY + Math.max(0, index) * STAGGER_DELAY;

    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: ENTER_DURATION, easing: ENTER_EASING }),
    );

    translateY.value = withDelay(
      delay,
      withTiming(0, { duration: ENTER_DURATION, easing: ENTER_EASING }),
    );
  }, [index, opacity, translateY]);

  return (
    <Animated.View className={className} style={animatedStyle}>
      {children}
    </Animated.View>
  );
}

export function PressMotion({
  children,
  className = "",
  onClick,
}: PressMotionProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, PRESS_SPRING);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, PRESS_SPRING);
  };

  return (
    <Pressable
      className={className}
      onPress={onClick}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
    >
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    width: "100%",
    minHeight: 0,
  } satisfies ViewStyle,

  staggerContainer: {
    width: "100%",
    minHeight: 0,
  },
});

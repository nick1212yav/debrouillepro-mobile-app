/**
 * Confetti celebration overlay (React Native).
 * Usage: <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

interface ConfettiProps {
  active: boolean;
  onDone?: () => void;
  durationMs?: number;
  count?: number;
}

const COLORS = [
  "#8B5CF6",
  "#6366F1",
  "#EC4899",
  "#F59E0B",
  "#10B981",
  "#3B82F6",
  "#EF4444",
  "#F97316",
  "#A3E635",
  "#22D3EE",
];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  shape: "rect" | "circle";
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    duration: 1.5 + Math.random() * 1.5,
    delay: Math.random() * 0.8,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

function ParticleView({ particle }: { particle: Particle }) {
  const translateY = useRef(new Animated.Value(-SCREEN_HEIGHT * 0.1)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = particle.duration * 1000;
    const delay = particle.delay * 1000;
    const easing = Easing.bezier(0.25, 0.46, 0.45, 0.94);

    const fallAnimation = Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT * 1.1,
      duration,
      delay,
      easing,
      useNativeDriver: true,
    });

    const rotateAnimation = Animated.timing(rotate, {
      toValue: 1,
      duration,
      delay,
      easing,
      useNativeDriver: true,
    });

    const fadeAnimation = Animated.sequence([
      Animated.delay(delay + duration * 0.7),
      Animated.timing(opacity, {
        toValue: 0,
        duration: duration * 0.3,
        useNativeDriver: true,
      }),
    ]);

    Animated.parallel([fallAnimation, rotateAnimation, fadeAnimation]).start();
  }, [particle.duration, particle.delay, translateY, rotate, opacity]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: [`${particle.rotate}deg`, `${particle.rotate + 540}deg`],
  });

  const left = (particle.x / 100) * SCREEN_WIDTH;

  return (
    <Animated.View
      style={{
        position: "absolute",
        left,
        width: particle.size,
        height: particle.shape === "rect" ? particle.size * 0.4 : particle.size,
        backgroundColor: particle.color,
        borderRadius: particle.shape === "circle" ? particle.size / 2 : 2,
        opacity,
        transform: [{ translateY }, { rotate: rotateInterpolation }],
      }}
    />
  );
}

export default function Confetti({
  active,
  onDone,
  durationMs = 3000,
  count = 60,
}: ConfettiProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const particles = useRef<Particle[]>(generateParticles(count));

  useEffect(() => {
    if (active) {
      particles.current = generateParticles(count);
      timerRef.current = setTimeout(() => {
        onDone?.();
      }, durationMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, durationMs, count, onDone]);

  if (!active) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {particles.current.map((p) => (
        <ParticleView key={p.id} particle={p} />
      ))}
    </View>
  );
}

/** Hook for easy usage */
export function useConfetti() {
  const [active, setActive] = useState(false);

  const fire = useCallback(() => {
    setActive(true);
  }, []);

  const confetti = <Confetti active={active} onDone={() => setActive(false)} />;

  return { fire, confetti };
}

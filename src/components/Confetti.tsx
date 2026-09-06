import { View } from "react-native";
/**
 * Confetti celebration overlay.
 * Usage: <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
 */
import { useEffect, useRef } from "react";

interface ConfettiProps {
  active: boolean;
  onDone?: () => void;
  durationMs?: number;
  count?: number;
}

const COLORS = [
  "#8B5CF6", "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#3B82F6", "#EF4444", "#F97316", "#A3E635", "#22D3EE",
];

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotate: number;
  duration: number;
  delay: number;
  shape: "rect" | "circle";
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 6 + Math.random() * 8,
    rotate: Math.random() * 360,
    duration: 1.5 + Math.random() * 1.5,
    delay: Math.random() * 0.8,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
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

  return (
    <>
      {active && (
        <View
          key="confetti-overlay"
          className="fixed inset-0 z-[100] overflow-hidden"
        >
          {particles.current.map((p) => (
            <View
              key={p.id}
              style={{ position: "absolute", width: p.size, height: p.shape === "rect" ? p.size * 0.4 : p.size, backgroundColor: p.color, borderRadius: p.shape === "circle" ? "50%" : 2 }}
            />
          ))}
        </View>
      )}
    </>
  );
}

// Hook for easy usage
import { useState, useCallback } from "react";

export function useConfetti() {
  const [active, setActive] = useState(false);

  const fire = useCallback(() => {
    setActive(true);
  }, []);

  const confetti = (
    <Confetti
      active={active}
      onDone={() => setActive(false)}
    />
  );

  return { fire, confetti };
}

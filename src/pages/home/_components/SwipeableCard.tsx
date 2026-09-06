
type NativeMotionValue<T> = {
  get: () => T;
  set: (value: T) => void;
};

function useMotionValue<T>(initial: T): NativeMotionValue<T> {
  const ref = useRef<NativeMotionValue<T> | null>(null);
  if (ref.current === null) {
    let current = initial;
    ref.current = {
      get: () => current,
      set: (value: T) => { current = value; },
    };
  }
  return ref.current;
}

function useTransform<T, R>(
  value: NativeMotionValue<T>,
  transform: ((value: T) => R) | readonly R[],
): R {
  const current = value.get();
  return typeof transform === "function"
    ? transform(current)
    : transform[0];
}

function animate(..._args: unknown[]): { stop: () => void } {
  return { stop: () => undefined };
}

function useSpring<T>(value: T): T { return value; }
function useScroll(): Record<string, unknown> { return {}; }
function useVelocity<T>(value: T): T { return value; }
function useTime(): number { return 0; }
import { Text, View } from "react-native";
import { useRef, useMemo } from "react";
import { Bookmark, X, Check, Sparkles } from "lucide-react-native";

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

const SWIPE_THRESHOLD = 100;
const EXIT_DISTANCE = 520;
const MAX_ROTATION = 8;

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = "",
  disabled = false,
}: SwipeableCardProps) {
  const x = useMotionValue(0);
  const didTrigger = useRef(false);

  /*
   * ─────────────────────────────────────────────────────────────
   * POSITION / ROTATION
   * ─────────────────────────────────────────────────────────────
   */

  const rotate = useTransform(
    x,
    [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
    [-MAX_ROTATION, 0, MAX_ROTATION],
  );

  const scale = useTransform(
    x,
    [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
    [0.97, 1, 0.97],
  );

  /*
   * ─────────────────────────────────────────────────────────────
   * ACTION PROGRESS
   * ─────────────────────────────────────────────────────────────
   */

  const leftProgress = useTransform(
    x,
    [-SWIPE_THRESHOLD * 1.8, -SWIPE_THRESHOLD, 0],
    [1, 0.85, 0],
  );

  const rightProgress = useTransform(
    x,
    [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.8],
    [0, 0.85, 1],
  );

  const leftOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD * 1.5, -30, 0],
    [1, 0.25, 0],
  );

  const rightOpacity = useTransform(
    x,
    [0, 30, SWIPE_THRESHOLD * 1.5],
    [0, 0.25, 1],
  );

  const leftScale = useTransform(
    x,
    [-SWIPE_THRESHOLD * 1.5, -SWIPE_THRESHOLD, 0],
    [1.15, 1, 0.8],
  );

  const rightScale = useTransform(
    x,
    [0, SWIPE_THRESHOLD, SWIPE_THRESHOLD * 1.5],
    [0.8, 1, 1.15],
  );

  /*
   * ─────────────────────────────────────────────────────────────
   * CARD SHADOW / GLOW
   * ─────────────────────────────────────────────────────────────
   */

  const shadowOpacity = useTransform(
    x,
    [-SWIPE_THRESHOLD * 2, 0, SWIPE_THRESHOLD * 2],
    [0.28, 0.12, 0.28],
  );

  /*
   * ─────────────────────────────────────────────────────────────
   * SWIPE HANDLER
   * ─────────────────────────────────────────────────────────────
   */

  const handleDragEnd = () => {
    if (disabled || didTrigger.current) {
      animate(x, 0, {
        type: "spring",
        stiffness: 420,
        damping: 32,
      });

      return;
    }

    const current = x.get();

    /*
     * Swipe gauche
     * = ignorer / dismiss
     */
    if (current < -SWIPE_THRESHOLD && onSwipeLeft) {
      didTrigger.current = true;

      animate(x, -EXIT_DISTANCE, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }).then(() => {
        onSwipeLeft();
        didTrigger.current = false;
      });

      return;
    }

    /*
     * Swipe droite
     * = sauvegarder
     */
    if (current > SWIPE_THRESHOLD && onSwipeRight) {
      didTrigger.current = true;

      animate(x, EXIT_DISTANCE, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      }).then(() => {
        onSwipeRight();
        didTrigger.current = false;
      });

      return;
    }

    /*
     * Pas assez loin :
     * retour magnétique au centre.
     */
    animate(x, 0, {
      type: "spring",
      stiffness: 500,
      damping: 35,
    });
  };

  return (
    <View className={`relative overflow-hidden rounded-3xl ${className}`}>
      {/* ========================================================
          AMBIENT BACKGROUND
          ======================================================== */}

      <View
        style={{ opacity: leftOpacity }}
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
      >
        <View className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-red-500/5 to-transparent" />

        <View className="absolute right-6 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-red-500/20" />
      </View>

      <View
        style={{ opacity: rightOpacity }}
        className="absolute inset-0 z-0 overflow-hidden rounded-3xl"
      >
        <View className="absolute inset-0 bg-gradient-to-l from-yellow-400/20 via-yellow-400/5 to-transparent" />

        <View className="absolute left-6 top-1/2 -translate-y-1/2 h-32 w-32 rounded-full bg-yellow-400/20" />
      </View>

      {/* ========================================================
          LEFT ACTION — DISMISS
          ======================================================== */}

      <View
        style={{
          opacity: leftOpacity,
          scale: leftScale,
        }}
        className="absolute inset-y-0 right-5 z-[1] flex items-center"
      >
        <View className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-red-400/30 bg-red-500/15 shadow-[0_0_30px_rgba(239,68,68,0.18)]">
          <X size={22} strokeWidth={2.5} className="text-red-300" />

          <View
            style={{ opacity: leftProgress }}
            className="absolute inset-0 rounded-2xl border border-red-400/30"
          />
        </View>
      </View>

      {/* ========================================================
          RIGHT ACTION — BOOKMARK
          ======================================================== */}

      <View
        style={{
          opacity: rightOpacity,
          scale: rightScale,
        }}
        className="absolute inset-y-0 left-5 z-[1] flex items-center"
      >
        <View className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-400/30 bg-yellow-400/15 shadow-[0_0_30px_rgba(250,204,21,0.18)]">
          <Bookmark size={21} strokeWidth={2.4} className="text-yellow-300" />

          <View
            style={{ opacity: rightProgress }}
            className="absolute inset-0 rounded-2xl border border-yellow-300/40"
          />
        </View>
      </View>

      {/* ========================================================
          SWIPE LABELS
          ======================================================== */}

      <View
        style={{ opacity: leftOpacity }}
        className="absolute right-5 top-5 z-[2]"
      >
        <View className="flex items-center gap-1.5 rounded-full border border-red-400/20 bg-red-500/10 px-2.5 py-1">
          <X size={11} className="text-red-300" />

          <Text className="text-[9px] font-bold uppercase tracking-wider text-red-300">
            Ignorer
          </Text>
        </View>
      </View>

      <View
        style={{ opacity: rightOpacity }}
        className="absolute left-5 top-5 z-[2]"
      >
        <View className="flex items-center gap-1.5 rounded-full border border-yellow-300/20 bg-yellow-400/10 px-2.5 py-1">
          <Bookmark size={10} className="text-yellow-300" />

          <Text className="text-[9px] font-bold uppercase tracking-wider text-yellow-300">
            Sauvegarder
          </Text>
        </View>
      </View>

      {/* ========================================================
          MAIN CARD
          ======================================================== */}

      <View
        style={{
          x,
          rotate,
          scale
        }}
        className={[
          "relative z-10",
          "cursor-grab active:cursor-grabbing",
          "touch-pan-y",
          "will-change-transform",
          disabled ? "cursor-default" : "",
        ].join(" ")}
      >
        {/* Premium top highlight */}
        <View className="absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {children}

        {/* ======================================================
            MICRO SWIPE HINT
            ====================================================== */}

        {!disabled && (
          <View className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
            <View
              className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2.5 py-1"
            >
              <Sparkles size={9} className="text-white/50" />

              <Text className="text-[8px] font-medium text-white/40">
                Glisser pour agir
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

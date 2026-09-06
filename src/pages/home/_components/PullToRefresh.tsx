
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
import { View, Text } from "react-native";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { Check, RefreshCw } from "lucide-react-native";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 76;
const MAX_PULL = 118;
const INDICATOR_HEIGHT = 76;

function getPullResistance(distance: number): number {
  if (distance <= 0) return 0;

  if (distance <= 40) {
    return distance * 0.72;
  }

  if (distance <= PULL_THRESHOLD) {
    return 28.8 + (distance - 40) * 0.52;
  }

  return Math.min(47.52 + (distance - PULL_THRESHOLD) * 0.28, MAX_PULL);
}

export default function PullToRefresh({
  onRefresh,
  children,
  className = "",
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [triggered, setTriggered] = useState(false);

  const scrollRef = useRef<View>(null);

  const startY = useRef<number | null>(null);
  const tracking = useRef(false);
  const triggeredRef = useRef(false);
  const mounted = useRef(true);

  /**
   * Motion uniquement pour l'indicateur.
   * Le contenu Home n'est jamais transformé.
   */
  const pullY = useMotionValue(0);

  const progress = useTransform(pullY, [0, PULL_THRESHOLD], [0, 1]);

  const iconOpacity = useTransform(
    pullY,
    [0, 12, 32, PULL_THRESHOLD],
    [0, 0.25, 0.65, 1],
  );

  const iconRotate = useTransform(pullY, [0, PULL_THRESHOLD], [0, 300]);

  const indicatorScale = useTransform(pullY, [0, PULL_THRESHOLD], [0.82, 1]);

  const textOpacity = useTransform(
    pullY,
    [0, 25, PULL_THRESHOLD],
    [0, 0.35, 1],
  );

  const progressStroke = useTransform(progress, [0, 1], [0, 100]);

  /* ============================================================
   * LIFECYCLE
   * ============================================================ */

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  /* ============================================================
   * RESET
   * ============================================================ */

  const resetPull = useCallback(() => {
    startY.current = null;
    tracking.current = false;
    triggeredRef.current = false;

    if (mounted.current) {
      setTriggered(false);
    }

    pullY.stop();
    pullY.set(0);
  }, [pullY]);

  /* ============================================================
   * TOUCH START
   * ============================================================ */

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<View>) => {
      if (refreshing) return;

      const element = scrollRef.current;

      if (!element) return;

      /**
       * Pull-to-refresh uniquement au sommet.
       */
      if (element.scrollTop > 0) {
        startY.current = null;
        tracking.current = false;
        return;
      }

      const touch = event.touches[0];

      if (!touch) return;

      startY.current = touch.clientY;
      tracking.current = true;
    },
    [refreshing],
  );

  /* ============================================================
   * TOUCH MOVE
   * ============================================================ */

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<View>) => {
      if (refreshing || !tracking.current || startY.current === null) {
        return;
      }

      const element = scrollRef.current;

      if (!element) {
        resetPull();
        return;
      }

      /**
       * Dès que le scroll natif reprend,
       * on abandonne le pull-to-refresh.
       */
      if (element.scrollTop > 0) {
        resetPull();
        return;
      }

      const touch = event.touches[0];

      if (!touch) return;

      const distance = touch.clientY - startY.current;

      /**
       * Mouvement vers le haut :
       * ne jamais bloquer le navigateur.
       */
      if (distance <= 0) {
        if (pullY.get() !== 0) {
          pullY.set(0);
        }

        if (triggeredRef.current) {
          triggeredRef.current = false;
          setTriggered(false);
        }

        return;
      }

      const resisted = getPullResistance(distance);

      pullY.set(resisted);

      const reachedThreshold = resisted >= PULL_THRESHOLD;

      if (reachedThreshold !== triggeredRef.current) {
        triggeredRef.current = reachedThreshold;
        setTriggered(reachedThreshold);
      }
    },
    [pullY, refreshing, resetPull],
  );

  /* ============================================================
   * REFRESH
   * ============================================================ */

  const executeRefresh = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    setTriggered(true);
    triggeredRef.current = true;

    pullY.stop();
    pullY.set(PULL_THRESHOLD * 0.72);

    try {
      await onRefresh();
    } catch (error) {
      console.error("[PullToRefresh] Refresh failed:", error);
    } finally {
      if (!mounted.current) return;

      setRefreshing(false);
      setTriggered(false);
      triggeredRef.current = false;

      pullY.stop();
      pullY.set(0);
    }
  }, [onRefresh, pullY, refreshing]);

  /* ============================================================
   * TOUCH END
   * ============================================================ */

  const handleTouchEnd = useCallback(() => {
    if (refreshing || !tracking.current) {
      return;
    }

    tracking.current = false;

    const currentPull = pullY.get();

    startY.current = null;

    if (currentPull >= PULL_THRESHOLD) {
      void executeRefresh();
      return;
    }

    triggeredRef.current = false;
    setTriggered(false);

    pullY.stop();
    pullY.set(0);
  }, [executeRefresh, pullY, refreshing]);

  /* ============================================================
   * TOUCH CANCEL
   * ============================================================ */

  const handleTouchCancel = useCallback(() => {
    if (refreshing) return;

    resetPull();
  }, [refreshing, resetPull]);

  /* ============================================================
   * RENDER
   * ============================================================ */

  return (
    <View
      className={`
        relative
        flex
        flex-1
        min-h-0
        min-w-0
        w-full
        overflow-hidden
        bg-transparent
        ${className}
      `}
    >
      {/* ======================================================
          PULL INDICATOR
          ====================================================== */}

      <View
        className="absolute inset-x-0 top-0 z-30 flex items-center justify-center"
        style={{
          height: INDICATOR_HEIGHT,
        }}
       
      >
        <View
          style={{
            opacity: iconOpacity,
            scale: indicatorScale,
          }}
          className="relative flex flex-col items-center"
        >
          {/* Glow */}

          <View
            className="absolute h-14 w-14 rounded-full"
            style={{ opacity: progress }}
          />

          {/* Ring */}

          <View className="relative h-10 w-10">
            <svg
              viewBox="0 0 40 40"
              className="absolute inset-0 h-10 w-10 -rotate-90"
            >
              <circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,.08)"
                strokeWidth="2"
              />

              <motion.circle
                cx="20"
                cy="20"
                r="15"
                fill="none"
                stroke="rgba(167,139,250,.9)"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength="100"
                style={{
                  pathLength: progressStroke,
                }}
              />
            </svg>

            <View
              className="absolute inset-0 flex items-center justify-center"
              style={{
                rotate: iconRotate,
              }}
            >
              {refreshing ? (
                <RefreshCw
                  size={17}
                  strokeWidth={2.2}
                  className="text-violet-300"
                />
              ) : triggered ? (
                <Check
                  size={18}
                  strokeWidth={2.4}
                  className="text-violet-300"
                />
              ) : (
                <RefreshCw
                  size={17}
                  strokeWidth={2}
                  className="text-white/45"
                />
              )}
            </View>
          </View>

          {/* Label */}

          <View
            style={{
              opacity: textOpacity,
            }}
            className="mt-1.5 rounded-full px-2.5 py-1"
          >
            <Text
              className="text-[9px] font-semibold tracking-wide text-white/45"
            >
              {refreshing
                ? "Actualisation…"
                : triggered
                  ? "Relâcher pour actualiser"
                  : "Tirer pour actualiser"}
            </Text>
          </View>
        </View>
      </View>

      {/* ======================================================
          TRUE NATIVE SCROLL AREA
          ====================================================== */}

      <View
        ref={scrollRef}
        className="relative flex-1 min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-transparent"
        style={{ touchAction: refreshing ? "none" : "pan-y", overscrollBehaviorY: "contain" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      >
        {children}
      </View>
    </View>
  );
}

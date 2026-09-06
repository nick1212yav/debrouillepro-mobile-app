// src/pages/home/_components/FeedFilters.tsx

import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Leaf,
  Newspaper,
  Plane,
  Users,
  type LucideIcon,
} from "lucide-react-native";

import { cn } from "@/lib/utils";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface FeedFilter {
  id: string;
  label: string;
  icon: LucideIcon;
  accent: string;
  description: string;
  isEmergency?: boolean;
}

/**
 * Les compteurs viennent du backend.
 *
 * Exemple :
 *
 * counts={{
 *   Immo: 12,
 *   "Jobs/Pro": 34,
 * }}
 */
export type FeedFilterCounts = Record<string, number>;

/* ============================================================================
 * FILTER CATALOG
 * ========================================================================== */

export const FILTERS: FeedFilter[] = [
  {
    id: "Tout",
    label: "Tout",
    icon: Check,
    accent: "#a78bfa",
    description: "Tout le contenu",
  },
  {
    id: "Immo",
    label: "Immo",
    icon: Building2,
    accent: "#fb923c",
    description: "Immobilier et logement",
  },
  {
    id: "Jobs/Pro",
    label: "Jobs",
    icon: BriefcaseBusiness,
    accent: "#a78bfa",
    description: "Emploi et opportunités",
  },
  {
    id: "Agri",
    label: "Agri",
    icon: Leaf,
    accent: "#4ade80",
    description: "Agriculture et alimentation",
  },
  {
    id: "Événements",
    label: "Événements",
    icon: CalendarDays,
    accent: "#f472b6",
    description: "Événements près de vous",
  },
  {
    id: "Voyages",
    label: "Voyages",
    icon: Plane,
    accent: "#38bdf8",
    description: "Voyages et destinations",
  },
  {
    id: "Media",
    label: "Actualités",
    icon: Newspaper,
    accent: "#fbbf24",
    description: "Actualités et médias",
  },
  {
    id: "Community",
    label: "Communauté",
    icon: Users,
    accent: "#c084fc",
    description: "Communauté et échanges",
  },
  {
    id: "SOS",
    label: "SOS",
    icon: AlertTriangle,
    accent: "#ef4444",
    description: "Urgences et assistance",
    isEmergency: true,
  },
];

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface FeedFiltersProps {
  active: string;

  onChange: (filterId: string) => void;

  counts?: FeedFilterCounts;

  disabled?: string[];

  showCounts?: boolean;

  compact?: boolean;

  className?: string;
}

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function FeedFilters({
  active,
  onChange,
  counts,
  disabled = [],
  showCounts = true,
  compact = false,
  className,
}: FeedFiltersProps) {
  const scrollRef = useRef<ScrollView | null>(null);

  const scrollOffsetRef = useRef(0);
  const viewportWidthRef = useRef(0);
  const contentWidthRef = useRef(0);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  /* --------------------------------------------------------------------------
   * SCROLL STATE
   * ------------------------------------------------------------------------ */

  const updateScrollState = useCallback(() => {
    const offset = scrollOffsetRef.current;
    const viewportWidth = viewportWidthRef.current;
    const contentWidth = contentWidthRef.current;

    const maxScroll = Math.max(contentWidth - viewportWidth, 0);

    setCanScrollLeft(offset > 4);
    setCanScrollRight(offset < maxScroll - 4);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollOffsetRef.current = event.nativeEvent.contentOffset.x;

      updateScrollState();
    },
    [updateScrollState],
  );

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      viewportWidthRef.current = event.nativeEvent.layout.width;

      updateScrollState();
    },
    [updateScrollState],
  );

  const handleContentSizeChange = useCallback(
    (width: number) => {
      contentWidthRef.current = width;

      updateScrollState();
    },
    [updateScrollState],
  );

  useEffect(() => {
    const timeout = setTimeout(() => {
      updateScrollState();
    }, 50);

    return () => {
      clearTimeout(timeout);
    };
  }, [updateScrollState]);

  /* --------------------------------------------------------------------------
   * SCROLL CONTROLS
   * ------------------------------------------------------------------------ */

  const scrollByDirection = useCallback((direction: "left" | "right") => {
    const step = 240;

    const maxScroll = Math.max(
      contentWidthRef.current - viewportWidthRef.current,
      0,
    );

    const nextOffset =
      direction === "left"
        ? Math.max(scrollOffsetRef.current - step, 0)
        : Math.min(scrollOffsetRef.current + step, maxScroll);

    scrollRef.current?.scrollTo({
      x: nextOffset,
      animated: true,
    });
  }, []);

  return (
    <View
      className={cn("relative mt-4", className)}
      accessibilityLabel="Filtrer le contenu"
    >
      {/* ====================================================================
          HEADER
      ===================================================================== */}

      <View className="mb-2 flex-row items-center justify-between px-5">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: "#a78bfa",
              shadowColor: "#a78bfa",
              shadowOpacity: 0.7,
              shadowRadius: 6,
              elevation: 4,
            }}
          />

          <Text
            className="flex-shrink text-[10px] font-bold uppercase text-white/35"
            numberOfLines={1}
          >
            Explorer le feed
          </Text>
        </View>

        {/* Navigation horizontale */}

        <View className="ml-3 flex-row items-center gap-1">
          <ScrollButton
            direction="left"
            disabled={!canScrollLeft}
            onPress={() => scrollByDirection("left")}
          />

          <ScrollButton
            direction="right"
            disabled={!canScrollRight}
            onPress={() => scrollByDirection("right")}
          />
        </View>
      </View>

      {/* ====================================================================
          FILTER RAIL
      ===================================================================== */}

      <View className="relative" onLayout={handleLayout}>
        {/* Fade gauche */}

        {canScrollLeft && (
          <View
            pointerEvents="none"
            className="absolute bottom-0 left-0 top-0 z-20 w-5"
            style={{
              backgroundColor: "rgba(7,7,17,0.82)",
            }}
          />
        )}

        {/* Fade droite */}

        {canScrollRight && (
          <View
            pointerEvents="none"
            className="absolute bottom-0 right-0 top-0 z-20 w-6"
            style={{
              backgroundColor: "rgba(7,7,17,0.82)",
            }}
          />
        )}

        {/* Scroll horizontal */}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          scrollEventThrottle={16}
          contentContainerClassName="gap-2 px-5 pb-2 pt-1"
          contentContainerStyle={{
            alignItems: "center",
          }}
          decelerationRate="fast"
        >
          {FILTERS.map((filter) => {
            const isActive = active === filter.id;

            const isDisabled = disabled.includes(filter.id);

            const count = counts?.[filter.id];

            const hasCount =
              showCounts &&
              typeof count === "number" &&
              Number.isFinite(count) &&
              count >= 0;

            return (
              <FilterChip
                key={filter.id}
                filter={filter}
                active={isActive}
                disabled={isDisabled}
                count={hasCount ? count : undefined}
                compact={compact}
                onPress={() => {
                  if (isDisabled) {
                    return;
                  }

                  onChange(filter.id);
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/* ============================================================================
 * FILTER CHIP
 * ========================================================================== */

interface FilterChipProps {
  filter: FeedFilter;

  active: boolean;

  disabled: boolean;

  count?: number;

  compact: boolean;

  onPress: () => void;
}

function FilterChip({
  filter,
  active,
  disabled,
  count,
  compact,
  onPress,
}: FilterChipProps) {
  const Icon = filter.icon;

  const isEmergency = filter.isEmergency === true;

  const pulse = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    if (!isEmergency || disabled) {
      pulse.stopAnimation();
      pulse.setValue(0);

      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.55,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [disabled, isEmergency, pulse]);

  const visibleCount = typeof count === "number" ? formatCount(count) : null;

  const backgroundColor = getBackgroundColor({
    active,
    emergency: isEmergency,
    color: filter.accent,
  });

  const borderColor = getBorderColor({
    active,
    emergency: isEmergency,
    color: filter.accent,
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        selected: active,
        disabled,
      }}
      accessibilityLabel={
        count !== undefined
          ? `${filter.label}, ${count} élément${count > 1 ? "s" : ""}`
          : filter.description
      }
      className={cn(
        "relative flex-row items-center overflow-hidden rounded-2xl",
        compact ? "min-h-9 gap-1.5 px-3" : "min-h-10 gap-2 px-3.5",
        disabled && "opacity-30",
      )}
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor,
        shadowColor: active ? filter.accent : "transparent",
        shadowOpacity: active ? 0.2 : 0,
        shadowRadius: active ? 10 : 0,
        elevation: active ? 3 : 0,
      }}
    >
      {/* Emergency pulse */}

      {isEmergency && !disabled && (
        <Animated.View
          pointerEvents="none"
          className="absolute inset-0 rounded-2xl"
          style={{
            opacity: pulse,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.28)",
          }}
        />
      )}

      {/* Icon */}

      <View
        className={cn(
          "items-center justify-center rounded-xl",
          compact ? "h-6 w-6" : "h-7 w-7",
        )}
        style={{
          backgroundColor: active
            ? `${filter.accent}22`
            : isEmergency
              ? "rgba(255,255,255,0.06)"
              : "rgba(255,255,255,0.045)",
        }}
      >
        <Icon
          size={compact ? 13 : 14}
          strokeWidth={active ? 2.5 : 2}
          color={
            isEmergency
              ? "#f87171"
              : active
                ? filter.accent
                : "rgba(255,255,255,0.52)"
          }
        />
      </View>

      {/* Label */}

      <Text
        className={cn("font-bold", compact ? "text-[10px]" : "text-[11px]")}
        numberOfLines={1}
        style={{
          color: isEmergency
            ? "#fca5a5"
            : active
              ? "#ffffff"
              : "rgba(255,255,255,0.58)",
        }}
      >
        {filter.label}
      </Text>

      {/* Backend count */}

      {visibleCount !== null && (
        <View
          className="min-w-[19px] items-center justify-center rounded-lg px-1.5 py-0.5"
          style={{
            backgroundColor: active
              ? "rgba(255,255,255,0.18)"
              : "rgba(255,255,255,0.08)",
          }}
        >
          <Text
            className="text-[8px] font-black"
            style={{
              color: active
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.42)",
            }}
          >
            {visibleCount}
          </Text>
        </View>
      )}

      {/* Active indicator */}

      {active && (
        <View
          className="ml-0.5 h-1.5 w-1.5 rounded-full"
          style={{
            backgroundColor: filter.accent,
            shadowColor: filter.accent,
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 3,
          }}
        />
      )}
    </Pressable>
  );
}

/* ============================================================================
 * SCROLL BUTTON
 * ========================================================================== */

interface ScrollButtonProps {
  direction: "left" | "right";

  disabled: boolean;

  onPress: () => void;
}

function ScrollButton({ direction, disabled, onPress }: ScrollButtonProps) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{
        disabled,
      }}
      accessibilityLabel={
        direction === "left"
          ? "Voir les filtres précédents"
          : "Voir les filtres suivants"
      }
      className={cn(
        "h-7 w-7 items-center justify-center rounded-xl border",
        disabled
          ? "border-white/[0.07] bg-white/[0.04] opacity-20"
          : "border-white/[0.07] bg-white/[0.04]",
      )}
      android_ripple={{
        color: "rgba(255,255,255,0.12)",
        borderless: false,
      }}
    >
      <Icon
        size={12}
        color={disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)"}
      />
    </Pressable>
  );
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${trimDecimal(value / 1_000_000)}M`;
  }

  if (value >= 1_000) {
    return `${trimDecimal(value / 1_000)}K`;
  }

  return String(value);
}

function trimDecimal(value: number): string {
  return value.toFixed(1).replace(".0", "");
}

function getBackgroundColor({
  active,
  emergency,
  color,
}: {
  active: boolean;
  emergency: boolean;
  color: string;
}): string {
  if (emergency) {
    return active ? "rgba(220,38,38,0.22)" : "rgba(239,68,68,0.08)";
  }

  if (active) {
    return hexToRgba(color, 0.16);
  }

  return "rgba(255,255,255,0.045)";
}

function getBorderColor({
  active,
  emergency,
  color,
}: {
  active: boolean;
  emergency: boolean;
  color: string;
}): string {
  if (emergency) {
    return active ? "rgba(248,113,113,0.45)" : "rgba(239,68,68,0.22)";
  }

  if (active) {
    return hexToRgba(color, 0.25);
  }

  return "rgba(255,255,255,0.075)";
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");

  const fullHex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : normalized;

  const red = parseInt(fullHex.slice(0, 2), 16);

  const green = parseInt(fullHex.slice(2, 4), 16);

  const blue = parseInt(fullHex.slice(4, 6), 16);

  if (Number.isNaN(red) || Number.isNaN(green) || Number.isNaN(blue)) {
    return `rgba(255,255,255,${alpha})`;
  }

  return `rgba(${red},${green},${blue},${alpha})`;
}

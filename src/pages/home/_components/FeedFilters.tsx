// src/pages/home/_components/FeedFilters.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useRef,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
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

export type FeedFilterCounts = Record<string, number>;

/* ============================================================================
 * FILTER CATALOG
 * ========================================================================== */

export const FILTERS: FeedFilter[] = [
  {
    id: "Tout",
    label: "Tout",
    icon: Check,
    accent: "#A78BFA",
    description: "Tout le contenu",
  },
  {
    id: "Immo",
    label: "Immo",
    icon: Building2,
    accent: "#FB923C",
    description: "Immobilier et logement",
  },
  {
    id: "Jobs/Pro",
    label: "Jobs",
    icon: BriefcaseBusiness,
    accent: "#A78BFA",
    description: "Emploi et opportunités",
  },
  {
    id: "Agri",
    label: "Agri",
    icon: Leaf,
    accent: "#4ADE80",
    description: "Agriculture et alimentation",
  },
  {
    id: "Événements",
    label: "Événements",
    icon: CalendarDays,
    accent: "#F472B6",
    description: "Événements près de vous",
  },
  {
    id: "Voyages",
    label: "Voyages",
    icon: Plane,
    accent: "#38BDF8",
    description: "Voyages et destinations",
  },
  {
    id: "Media",
    label: "Actualités",
    icon: Newspaper,
    accent: "#FBBF24",
    description: "Actualités et médias",
  },
  {
    id: "Community",
    label: "Communauté",
    icon: Users,
    accent: "#C084FC",
    description: "Communauté et échanges",
  },
  {
    id: "SOS",
    label: "SOS",
    icon: AlertTriangle,
    accent: "#EF4444",
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

/* ============================================================================
 * SCROLL BUTTON
 * ========================================================================== */

function ScrollButton({
  direction,
  disabled,
  onPress,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onPress: () => void;
}) {
  const Icon = direction === "left" ? ArrowLeft : ArrowRight;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        hitSlop={6}
        accessibilityLabel={
          direction === "left"
            ? "Voir les filtres précédents"
            : "Voir les filtres suivants"
        }
        style={({ pressed }) => [
          styles.scrollBtn,
          disabled && styles.scrollBtnDisabled,
          pressed && !disabled && { opacity: 0.75 },
        ]}
      >
        <Icon
          size={12}
          color={disabled ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)"}
        />
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * EMERGENCY PULSE
 * ========================================================================== */

function EmergencyPulse() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.9],
  });
  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        styles.emergencyPulse,
        { opacity, transform: [{ scale }] },
      ]}
    />
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
  const visibleCount = typeof count === "number" ? formatCount(count) : null;

  const scale = useRef(new Animated.Value(1)).current;
  const activeAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const countAnim = useRef(new Animated.Value(visibleCount ? 1 : 0)).current;
  const dotAnim = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(activeAnim, {
      toValue: active ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, activeAnim]);

  useEffect(() => {
    Animated.spring(countAnim, {
      toValue: visibleCount ? 1 : 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 12,
    }).start();
  }, [visibleCount, countAnim]);

  useEffect(() => {
    Animated.spring(dotAnim, {
      toValue: active ? 1 : 0,
      useNativeDriver: true,
      speed: 30,
      bounciness: 14,
    }).start();
  }, [active, dotAnim]);

  const onPressIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();
  };

  const borderColor = activeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: isEmergency
      ? ["rgba(239,68,68,0.22)", "rgba(248,113,113,0.5)"]
      : ["rgba(255,255,255,0.08)", `${filter.accent}55`],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ selected: active, disabled }}
        accessibilityLabel={
          count !== undefined
            ? `${filter.label}, ${count} élément${count > 1 ? "s" : ""}`
            : filter.description
        }
        style={[
          styles.chip,
          compact ? styles.chipCompact : styles.chipNormal,
          disabled && styles.chipDisabled,
        ]}
      >
        {/* Base background (visible when inactive) */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: isEmergency
                ? "rgba(239,68,68,0.08)"
                : "rgba(255,255,255,0.045)",
              borderRadius: 16,
            },
          ]}
          pointerEvents="none"
        />

        {/* Active gradient overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              opacity: activeAnim,
              borderRadius: 16,
              overflow: "hidden",
            },
          ]}
        >
          <LinearGradient
            colors={
              isEmergency
                ? ["rgba(239,68,68,0.32)", "rgba(220,38,38,0.16)"]
                : [`${filter.accent}28`, "rgba(255,255,255,0.08)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Border (animated color) */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: 16,
              borderWidth: 1,
              borderColor,
            },
          ]}
        />

        {/* Emergency pulse */}
        {isEmergency && !disabled ? <EmergencyPulse /> : null}

        {/* Icon */}
        <View
          style={[
            styles.iconWrap,
            compact ? styles.iconWrapCompact : styles.iconWrapNormal,
            {
              backgroundColor: active
                ? `${filter.accent}28`
                : isEmergency
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.05)",
            },
          ]}
        >
          <Icon
            size={compact ? 13 : 14}
            color={
              isEmergency
                ? "#FCA5A5"
                : active
                  ? "#FFFFFF"
                  : "rgba(255,255,255,0.65)"
            }
            strokeWidth={active ? 2.5 : 2}
          />
        </View>

        {/* Label */}
        <Text
          style={[
            styles.chipLabel,
            compact && { fontSize: 10 },
            {
              color: isEmergency
                ? "#FCA5A5"
                : active
                  ? "#FFFFFF"
                  : "rgba(255,255,255,0.65)",
            },
          ]}
          numberOfLines={1}
        >
          {filter.label}
        </Text>

        {/* Count badge */}
        {visibleCount !== null ? (
          <Animated.View
            style={[
              styles.countBadge,
              {
                backgroundColor: active
                  ? "rgba(255,255,255,0.22)"
                  : "rgba(255,255,255,0.1)",
                opacity: countAnim,
                transform: [
                  {
                    scale: countAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                {
                  color: active
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.5)",
                },
              ]}
            >
              {visibleCount}
            </Text>
          </Animated.View>
        ) : null}

        {/* Active dot */}
        {active ? (
          <Animated.View
            style={[
              styles.activeDot,
              {
                backgroundColor: filter.accent,
                shadowColor: filter.accent,
                opacity: dotAnim,
                transform: [
                  {
                    scale: dotAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
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
  const scrollRef = useRef<ScrollView>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const scrollX = useRef(0);
  const contentWidth = useRef(0);
  const layoutWidth = useRef(0);

  /* ───── entrance ───── */
  const entrance = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [entrance]);

  /* ───── scroll state ───── */
  const updateScrollState = useCallback(
    (x: number, contentW: number, layoutW: number) => {
      const maxScroll = contentW - layoutW;
      setCanScrollLeft(x > 4);
      setCanScrollRight(x < maxScroll - 4);
    },
    [],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      scrollX.current = x;
      updateScrollState(x, contentWidth.current, layoutWidth.current);
    },
    [updateScrollState],
  );

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentWidth.current = _w;
      updateScrollState(scrollX.current, _w, layoutWidth.current);
    },
    [updateScrollState],
  );

  const handleLayout = useCallback(
    (e: any) => {
      const w = e.nativeEvent.layout.width;
      layoutWidth.current = w;
      updateScrollState(scrollX.current, contentWidth.current, w);
    },
    [updateScrollState],
  );

  /* ───── scroll controls ───── */
  const scrollBy = useCallback((direction: "left" | "right") => {
    const step = 240;
    const target =
      direction === "left"
        ? Math.max(0, scrollX.current - step)
        : scrollX.current + step;
    scrollRef.current?.scrollTo({ x: target, animated: true });
  }, []);

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <Animated.View
      style={[styles.root, { opacity: entrance, transform: [{ translateY }] }]}
      accessibilityLabel="Filtrer le contenu"
    >
      {/* ───── HEADER ───── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerDot} />
          <Text style={styles.headerLabel}>EXPLORER LE FEED</Text>
        </View>

        {Platform.OS === "web" ? (
          <View style={styles.headerRight}>
            <ScrollButton
              direction="left"
              disabled={!canScrollLeft}
              onPress={() => scrollBy("left")}
            />
            <ScrollButton
              direction="right"
              disabled={!canScrollRight}
              onPress={() => scrollBy("right")}
            />
          </View>
        ) : null}
      </View>

      {/* ───── FILTER RAIL ───── */}
      <View style={styles.railWrap}>
        {/* Left fade */}
        {canScrollLeft ? (
          <LinearGradient
            colors={["#070711", "rgba(7,7,17,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeLeft}
            pointerEvents="none"
          />
        ) : null}

        {/* Right fade */}
        {canScrollRight ? (
          <LinearGradient
            colors={["rgba(7,7,17,0)", "#070711"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeRight}
            pointerEvents="none"
          />
        ) : null}

        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.railContent,
            compact && { paddingVertical: 4 },
          ]}
          onScroll={handleScroll}
          onContentSizeChange={handleContentSizeChange}
          onLayout={handleLayout}
          scrollEventThrottle={32}
          keyboardShouldPersistTaps="handled"
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
                  if (!isDisabled) onChange(filter.id);
                }}
              />
            );
          })}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    marginTop: 16,
  },

  // ── Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 10,
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  headerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A78BFA",
    shadowColor: "#A78BFA",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.5)",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scrollBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  scrollBtnDisabled: {
    opacity: 0.25,
  },

  // ── Rail
  railWrap: {
    position: "relative",
  },
  fadeLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 32,
    zIndex: 20,
  },
  fadeRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 20,
  },
  railContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 8,
  },

  // ── Chip
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  chipNormal: {
    minHeight: 40,
    gap: 8,
    paddingHorizontal: 14,
  },
  chipCompact: {
    minHeight: 36,
    gap: 6,
    paddingHorizontal: 12,
  },
  chipDisabled: {
    opacity: 0.3,
  },
  chipLabel: {
    fontSize: 11.5,
    fontWeight: "800",
    letterSpacing: 0.1,
    zIndex: 10,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    zIndex: 10,
  },
  iconWrapNormal: {
    width: 28,
    height: 28,
  },
  iconWrapCompact: {
    width: 24,
    height: 24,
  },
  countBadge: {
    minWidth: 22,
    height: 18,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    zIndex: 10,
  },
  countBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
    zIndex: 10,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  emergencyPulse: {
    borderRadius: 16,
    backgroundColor: "rgba(239,68,68,0.15)",
  },
});

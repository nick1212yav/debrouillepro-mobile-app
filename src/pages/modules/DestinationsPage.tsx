// src/pages/modules/DestinationsPage.tsx
import {
  Animated,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image as RNImage,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Clock,
  DollarSign,
  Filter,
  Globe,
  Heart,
  MapPin,
  Plane,
  Search,
  Sparkles,
  Star,
  Thermometer,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Doc } from "@/convex/_generated/dataModel.d.ts";
import { Authenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface DestinationsPageProps {
  onBack: () => void;
}

type Continent =
  | "Tous"
  | "Europe"
  | "Asie"
  | "Amériques"
  | "Afrique"
  | "Océanie";
type Budget = "Tous" | "Économique" | "Moyen" | "Premium" | "Luxe";
type TabId = "discover" | "bucket";

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  sheet: "#0E0E14",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#8B5CF6",
  primarySoft: "#C4B5FD",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  rose: "#FB7185",
  cyan: "#22D3EE",
} as const;

const CONTINENTS: Continent[] = [
  "Tous",
  "Europe",
  "Asie",
  "Amériques",
  "Afrique",
  "Océanie",
];
const BUDGETS: Budget[] = ["Tous", "Économique", "Moyen", "Premium", "Luxe"];

const BUDGET_COLORS: Record<string, string> = {
  Tous: "#8B5CF6",
  Économique: "#10B981",
  Moyen: "#3B82F6",
  Premium: "#F97316",
  Luxe: "#EC4899",
};

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function Skeleton({
  style,
}: {
  style?: React.ComponentProps<typeof Animated.View>["style"];
}) {
  const opacity = useRef(new Animated.Value(0.28)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.65,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.28,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: "rgba(255,255,255,0.06)",
          borderRadius: 16,
          opacity,
        },
        style,
      ]}
    />
  );
}

function DestCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <Skeleton style={{ height: 190, borderRadius: 0 }} />
      <View style={{ padding: 12, gap: 8 }}>
        <Skeleton style={{ height: 14, width: "60%", borderRadius: 7 }} />
        <Skeleton style={{ height: 12, width: "40%", borderRadius: 6 }} />
      </View>
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
  ctaLabel,
  onCta,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={28} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {ctaLabel && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.emptyCta,
            {
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            },
          ]}
        >
          <ChevronRight size={14} color={T.primarySoft} />
          <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DESTINATION CARD
   ════════════════════════════════════════════════════════════════════════════ */

function DestCard({
  dest,
  isSaved,
  onToggleSave,
  onPress,
  index,
}: {
  dest: Doc<"destinations">;
  isSaved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const destColor = dest.color || "#6366F1";
  const budgetColor = BUDGET_COLORS[dest.budget] || "#3B82F6";

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 380,
      delay: Math.min(index * 55, 500),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.985,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onPress();
  };

  const handleFavorite = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.35,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    onToggleSave();
  };

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <Pressable onPress={handlePress}>
        <Animated.View style={[styles.destCard, { transform: [{ scale }] }]}>
          {/* Image */}
          <View style={styles.destImageWrap}>
            {dest.imageUrl ? (
              <RNImage
                source={{ uri: dest.imageUrl }}
                style={styles.destImage}
                accessibilityLabel={dest.name}
              />
            ) : (
              <View
                style={[
                  styles.destImagePlaceholder,
                  { backgroundColor: alpha(destColor, 0.18) },
                ]}
              >
                <Globe size={40} color={alpha(destColor, 0.5)} />
              </View>
            )}
            <View pointerEvents="none" style={styles.destImageOverlay} />

            {/* Badges top-left */}
            <View style={styles.destBadgesRow}>
              {dest.trending && (
                <View style={styles.trendingBadge}>
                  <TrendingUp size={9} color="#fff" />
                  <Text style={styles.trendingBadgeText}>Tendance</Text>
                </View>
              )}
              <View
                style={[
                  styles.budgetBadge,
                  { backgroundColor: alpha(budgetColor, 0.92) },
                ]}
              >
                <Text style={styles.budgetBadgeText}>{dest.budget}</Text>
              </View>
            </View>

            {/* Fav top-right */}
            <Authenticated>
              <Pressable
                onPress={handleFavorite}
                hitSlop={10}
                style={styles.favBtn}
              >
                <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                  <Heart
                    size={14}
                    color={isSaved ? T.rose : "#fff"}
                    fill={isSaved ? T.rose : "transparent"}
                  />
                </Animated.View>
              </Pressable>
            </Authenticated>

            {/* Titre + rating en bas */}
            <View style={styles.destImageBottom}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text numberOfLines={1} style={styles.destName}>
                  {dest.name}
                </Text>
                <View style={styles.destLocationRow}>
                  <MapPin size={11} color="rgba(255,255,255,0.7)" />
                  <Text numberOfLines={1} style={styles.destCountry}>
                    {dest.country}
                  </Text>
                </View>
              </View>

              <View style={styles.destRatingCol}>
                <View style={styles.destRatingRow}>
                  <Star size={11} color={T.amberSoft} fill={T.amberSoft} />
                  <Text style={styles.destRatingText}>
                    {dest.rating.toFixed(1)}
                  </Text>
                </View>
                <View style={styles.destFlightRow}>
                  <Sparkles size={9} color={destColor} />
                  <Text style={[styles.destFlightText, { color: destColor }]}>
                    {dest.flightHours}h
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer tags */}
          <View style={styles.destFooter}>
            <View style={styles.destTag}>
              <Globe size={9} color={T.dim} />
              <Text style={styles.destTagText}>{dest.continent}</Text>
            </View>
            <View style={styles.destTag}>
              <DollarSign size={9} color={T.dim} />
              <Text style={styles.destTagText}>{dest.budget}</Text>
            </View>
            <View style={styles.destFooterRight}>
              <Clock size={9} color={T.ghost} />
              <Text style={styles.destFooterRightText}>
                {dest.flightHours}h vol
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DESTINATION DETAIL MODAL
   ════════════════════════════════════════════════════════════════════════════ */

function DestinationModal({
  visible,
  dest,
  isSaved,
  onToggleSave,
  onClose,
}: {
  visible: boolean;
  dest: Doc<"destinations"> | null;
  isSaved: boolean;
  onToggleSave: () => void;
  onClose: () => void;
}) {
  const slide = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: visible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, slide]);

  if (!dest) return null;

  const destColor = dest.color || "#6366F1";
  const budgetColor = BUDGET_COLORS[dest.budget] || "#3B82F6";

  const stats: {
    icon: React.ElementType;
    label: string;
    sub: string;
    color: string;
  }[] = [
    {
      icon: Star,
      label: `${dest.rating}`,
      sub: `${(dest.reviewCount / 1000).toFixed(1)}k avis`,
      color: T.amber,
    },
    { icon: DollarSign, label: dest.budget, sub: "Budget", color: budgetColor },
    {
      icon: Clock,
      label: `${dest.flightHours}h`,
      sub: "Vol",
      color: "#3B82F6",
    },
    { icon: Globe, label: dest.language, sub: "Langue", color: T.primary },
  ];

  const infos: { label: string; value: string; icon: React.ElementType }[] = [
    { label: "Langue", value: dest.language, icon: Globe },
    { label: "Devise", value: dest.currency, icon: DollarSign },
    { label: "Budget", value: dest.budget, icon: Thermometer },
    {
      label: "Vol depuis Afrique",
      value: `~${dest.flightHours}h`,
      icon: Plane,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle="overFullScreen"
    >
      <Animated.View
        style={[
          styles.modalRoot,
          {
            transform: [
              {
                translateY: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 900],
                }),
              },
            ],
          },
        ]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.modalHero}>
            {dest.imageUrl ? (
              <RNImage
                source={{ uri: dest.imageUrl }}
                style={styles.modalHeroImage}
                accessibilityLabel={dest.name}
              />
            ) : (
              <View
                style={[
                  styles.destImagePlaceholder,
                  { backgroundColor: alpha(destColor, 0.24) },
                ]}
              >
                <Globe size={54} color={alpha(destColor, 0.55)} />
              </View>
            )}
            <View pointerEvents="none" style={styles.modalHeroOverlay} />

            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <X size={18} color="#fff" />
            </Pressable>

            <Authenticated>
              <Pressable
                onPress={onToggleSave}
                style={[
                  styles.modalFavBtn,
                  isSaved && {
                    backgroundColor: alpha(T.danger, 0.9),
                    borderColor: alpha(T.danger, 0.5),
                  },
                ]}
              >
                <Heart
                  size={17}
                  color="#fff"
                  fill={isSaved ? "#fff" : "transparent"}
                />
              </Pressable>
            </Authenticated>

            <View style={styles.modalHeroText}>
              <Text numberOfLines={2} style={styles.modalHeroName}>
                {dest.name}
              </Text>
              <View style={styles.modalHeroMeta}>
                <MapPin size={12} color="rgba(255,255,255,0.78)" />
                <Text style={styles.modalHeroCountry}>{dest.country}</Text>
                <View style={styles.modalHeroDot} />
                <View
                  style={[
                    styles.modalHeroContinent,
                    { backgroundColor: alpha(destColor, 0.92) },
                  ]}
                >
                  <Text style={styles.modalHeroContinentText}>
                    {dest.continent}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Body */}
          <View style={styles.modalBody}>
            {/* Stats grid 4 colonnes → 2x2 wrap */}
            <View style={styles.modalStatsGrid}>
              {stats.map((s) => {
                const Icon = s.icon;
                return (
                  <View
                    key={s.label + s.sub}
                    style={[
                      styles.modalStatBox,
                      {
                        backgroundColor: alpha(s.color, 0.08),
                        borderColor: alpha(s.color, 0.22),
                      },
                    ]}
                  >
                    <Icon size={16} color={s.color} />
                    <Text style={styles.modalStatValue}>{s.label}</Text>
                    <Text style={styles.modalStatLabel}>{s.sub}</Text>
                  </View>
                );
              })}
            </View>

            {/* Description */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>À propos</Text>
              <Text style={styles.modalDescription}>{dest.description}</Text>
            </View>

            {/* Highlights */}
            {dest.highlights.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Incontournables</Text>
                <View style={{ gap: 8, marginTop: 10 }}>
                  {dest.highlights.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.highlightRow,
                        { backgroundColor: alpha(destColor, 0.08) },
                      ]}
                    >
                      <View
                        style={[
                          styles.highlightDot,
                          { backgroundColor: destColor },
                        ]}
                      />
                      <Text style={styles.highlightText}>{h}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Infos pratiques */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Infos pratiques</Text>
              <View style={{ gap: 8, marginTop: 10 }}>
                {infos.map((info) => {
                  const Icon = info.icon;
                  return (
                    <View key={info.label} style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Icon size={13} color={T.faint} />
                      </View>
                      <Text style={styles.infoLabel}>{info.label}</Text>
                      <Text numberOfLines={1} style={styles.infoValue}>
                        {info.value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Avis communauté */}
            <View style={styles.modalSection}>
              <View style={styles.reviewsHead}>
                <Users size={14} color={T.dim} />
                <Text style={styles.modalSectionTitle}>
                  Avis de la communauté
                </Text>
              </View>

              <View style={styles.reviewsBody}>
                <Text style={styles.reviewsScore}>
                  {dest.rating.toFixed(1)}
                </Text>
                <View style={{ flex: 1, gap: 6 }}>
                  <View style={styles.reviewsStarsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        color={
                          s <= Math.floor(dest.rating) ? T.amberSoft : T.ghost
                        }
                        fill={
                          s <= Math.floor(dest.rating)
                            ? T.amberSoft
                            : "transparent"
                        }
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewsCount}>
                    {dest.reviewCount.toLocaleString("fr-FR")} avis
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* CTA sticky */}
        <View style={styles.modalFooter}>
          <Authenticated>
            <Pressable
              onPress={onToggleSave}
              style={({ pressed }) => [
                styles.modalCta,
                isSaved
                  ? {
                      backgroundColor: alpha(T.danger, 0.16),
                      borderColor: alpha(T.danger, 0.42),
                      borderWidth: 1,
                    }
                  : {
                      backgroundColor: destColor,
                    },
                {
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Heart
                size={17}
                color="#fff"
                fill={isSaved ? "#fff" : "transparent"}
              />
              <Text style={styles.modalCtaText}>
                {isSaved
                  ? "Retirer de la bucket list"
                  : "Ajouter à ma bucket list"}
              </Text>
            </Pressable>
          </Authenticated>
        </View>
      </Animated.View>
    </Modal>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   FILTER CHIP
   ════════════════════════════════════════════════════════════════════════════ */

function FilterChip({
  label,
  active,
  color,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterChip,
        {
          backgroundColor: active
            ? alpha(color, 0.18)
            : "rgba(255,255,255,0.05)",
          borderColor: active ? alpha(color, 0.45) : T.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: active ? color : T.dim,
            fontWeight: active ? "900" : "700",
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function DestinationsPage({ onBack }: DestinationsPageProps) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [continent, setContinent] = useState<Continent>("Tous");
  const [budget, setBudget] = useState<Budget>("Tous");
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Doc<"destinations"> | null>(null);
  const [tab, setTab] = useState<TabId>("discover");
  const [refreshing, setRefreshing] = useState(false);

  /* Seed une seule fois */
  const seedTrips = useMutation(api.voyages.seedTrips);
  const seededRef = useRef(false);
  useEffect(() => {
    if (!seededRef.current) {
      seededRef.current = true;
      seedTrips().catch(() => {
        seededRef.current = false;
      });
    }
  }, [seedTrips]);

  /* Debounce search */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Queries */
  const destinations = useQuery(api.voyages.listDestinations, {});
  const savedDestinations = useQuery(api.voyages.getMySavedDestinations, {});
  const toggleSave = useMutation(api.voyages.toggleSaveDestination);

  const isLoading = destinations === undefined;

  const savedIds = useMemo(() => {
    if (!savedDestinations) return new Set<string>();
    return new Set(
      savedDestinations
        .filter((d): d is Doc<"destinations"> => d !== null && d !== undefined)
        .map((d) => d._id),
    );
  }, [savedDestinations]);

  /* Filtrage */
  const filtered = useMemo(() => {
    if (!destinations) return [];
    let list = [...destinations];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.country.toLowerCase().includes(q),
      );
    }
    if (continent !== "Tous")
      list = list.filter((d) => d.continent === continent);
    if (budget !== "Tous") list = list.filter((d) => d.budget === budget);
    if (tab === "bucket") list = list.filter((d) => savedIds.has(d._id));
    return list.sort((a, b) => b.rating - a.rating);
  }, [destinations, debouncedSearch, continent, budget, tab, savedIds]);

  const activeFilters =
    (continent !== "Tous" ? 1 : 0) + (budget !== "Tous" ? 1 : 0);

  /* Handlers */
  const handleToggleSave = useCallback(
    async (destId: Doc<"destinations">["_id"]) => {
      try {
        await toggleSave({ destinationId: destId });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur";
        toast.error(message);
      }
    },
    [toggleSave],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const resetFilters = useCallback(() => {
    setContinent("Tous");
    setBudget("Tous");
  }, []);

  const showPopularBanner =
    tab === "discover" && !debouncedSearch && continent === "Tous";

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 7 }}
            >
              <Globe size={16} color={T.primarySoft} />
              <Text style={styles.title}>Destinations</Text>
            </View>
            <Text style={styles.subtitle}>Découvre ton prochain voyage</Text>
          </View>

          <View style={styles.countPill}>
            <Globe size={11} color={T.primarySoft} />
            <Text style={styles.countPillText}>
              {destinations?.length ?? "…"}
            </Text>
          </View>
        </View>

        {/* Search + Filter */}
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <Search size={15} color={T.faint} />
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="Paris, Japon, plage…"
              placeholderTextColor={T.faint}
              style={styles.searchInput}
              autoCorrect={false}
            />
            {searchInput.length > 0 && (
              <Pressable onPress={() => setSearchInput("")} hitSlop={10}>
                <X size={15} color={T.faint} />
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setShowFilters((p) => !p)}
            style={({ pressed }) => [
              styles.filterBtn,
              showFilters || activeFilters > 0
                ? {
                    backgroundColor: T.primary,
                    borderColor: alpha(T.primary, 0.7),
                  }
                : {
                    backgroundColor: "rgba(255,255,255,0.06)",
                    borderColor: T.border,
                  },
              {
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}
          >
            <Filter
              size={16}
              color={showFilters || activeFilters > 0 ? "#fff" : T.dim}
            />
            {activeFilters > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilters}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Filtres repliables */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <Text style={styles.filterLabel}>Continent</Text>
            <View style={styles.filterRow}>
              {CONTINENTS.map((opt) => (
                <FilterChip
                  key={opt}
                  label={opt}
                  active={continent === opt}
                  color={T.primary}
                  onPress={() => setContinent(opt)}
                />
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 14 }]}>Budget</Text>
            <View style={styles.filterRow}>
              {BUDGETS.map((opt) => (
                <FilterChip
                  key={opt}
                  label={opt}
                  active={budget === opt}
                  color={BUDGET_COLORS[opt] ?? T.primary}
                  onPress={() => setBudget(opt)}
                />
              ))}
            </View>

            {activeFilters > 0 && (
              <Pressable onPress={resetFilters} style={styles.resetBtn}>
                <X size={12} color="#F87171" />
                <Text style={styles.resetBtnText}>
                  Réinitialiser les filtres
                </Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.segmented}>
          {(
            [
              { id: "discover" as TabId, label: "Découvrir", icon: Globe },
              {
                id: "bucket" as TabId,
                label: `Bucket List (${savedIds.size})`,
                icon: Bookmark,
              },
            ] as const
          ).map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <Pressable
                key={id}
                onPress={() => setTab(id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Icon size={13} color={active ? "#fff" : T.faint} />
                <Text
                  style={[styles.segmentText, active && { color: "#fff" }]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Contenu */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={T.primarySoft}
            colors={[T.primary]}
          />
        }
      >
        {/* Bannière populaire */}
        {showPopularBanner && (
          <View style={styles.popularBanner}>
            <View style={styles.popularIcon}>
              <Sparkles size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.popularTitle}>Destinations populaires</Text>
              <Text style={styles.popularSubtitle}>
                Classées par note communautaire
              </Text>
            </View>
          </View>
        )}

        {/* Liste */}
        {isLoading ? (
          <View style={{ gap: 16, marginTop: 4 }}>
            {[0, 1, 2, 3].map((i) => (
              <DestCardSkeleton key={i} />
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={tab === "bucket" ? Bookmark : Globe}
            title={
              tab === "bucket"
                ? "Ta bucket list est vide"
                : "Aucune destination"
            }
            message={
              tab === "bucket"
                ? "Ajoute des destinations pour les retrouver ici."
                : debouncedSearch
                  ? "Essaie un autre mot-clé ou change tes filtres."
                  : "Aucune destination ne correspond à tes filtres."
            }
            ctaLabel={
              tab === "bucket" ? "Explorer les destinations" : undefined
            }
            onCta={tab === "bucket" ? () => setTab("discover") : undefined}
          />
        ) : (
          <View style={{ gap: 16, marginTop: 4 }}>
            {filtered.map((dest, i) => (
              <DestCard
                key={dest._id}
                dest={dest}
                index={i}
                isSaved={savedIds.has(dest._id)}
                onToggleSave={() => handleToggleSave(dest._id)}
                onPress={() => setSelected(dest)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal détail */}
      <DestinationModal
        visible={selected !== null}
        dest={selected}
        isSaved={selected ? savedIds.has(selected._id) : false}
        onToggleSave={() => selected && handleToggleSave(selected._id)}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.12),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2, fontWeight: "600" },
  countPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.36),
  },
  countPillText: {
    color: T.primarySoft,
    fontSize: 11.5,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Search + filter */
  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    position: "relative",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: T.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
  },

  /* Filters panel */
  filtersPanel: {
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  filterLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 12 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: 14,
  },
  resetBtnText: {
    color: "#F87171",
    fontSize: 12,
    fontWeight: "800",
  },

  /* Segmented tabs */
  segmented: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segmentActive: {
    backgroundColor: T.primary,
    borderColor: alpha(T.primary, 0.7),
  },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  /* Content */
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 60 },

  /* Popular banner */
  popularBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: alpha(T.primary, 0.08),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.28),
    marginBottom: 4,
  },
  popularIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: T.primary,
  },
  popularTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  popularSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    marginTop: 3,
    fontWeight: "600",
  },

  /* Card skeleton */
  cardSkeleton: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },

  /* Dest card */
  destCard: {
    borderRadius: 22,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
    overflow: "hidden",
  },
  destImageWrap: { position: "relative", height: 200 },
  destImage: { width: "100%", height: "100%" },
  destImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  destImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  destBadgesRow: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
    maxWidth: SCREEN_W - 100,
  },
  trendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: alpha("#F97316", 0.92),
  },
  trendingBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  budgetBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  budgetBadgeText: {
    color: "#fff",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  favBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  destImageBottom: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  destName: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  destLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  destCountry: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 11.5,
    fontWeight: "700",
    flexShrink: 1,
  },
  destRatingCol: { alignItems: "flex-end", gap: 4 },
  destRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  destRatingText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  destFlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  destFlightText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  destFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  destTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  destTagText: {
    color: T.dim,
    fontSize: 10.5,
    fontWeight: "700",
  },
  destFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginLeft: "auto",
  },
  destFooterRightText: {
    color: T.ghost,
    fontSize: 10.5,
    fontWeight: "700",
  },

  /* Modal */
  modalRoot: { flex: 1, backgroundColor: T.bg },
  modalHero: { position: "relative", height: 300 },
  modalHeroImage: { width: "100%", height: "100%" },
  modalHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalFavBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  modalHeroText: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 22,
    gap: 8,
  },
  modalHeroName: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  modalHeroMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  modalHeroCountry: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "700",
  },
  modalHeroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  modalHeroContinent: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  modalHeroContinentText: {
    color: "#fff",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 22,
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: T.bg,
  },

  /* Stats grid */
  modalStatsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalStatBox: {
    width: "48.5%",
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  modalStatValue: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
    textAlign: "center",
  },
  modalStatLabel: {
    color: T.faint,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },

  /* Section */
  modalSection: { gap: 4 },
  modalSectionTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  modalDescription: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 13.5,
    lineHeight: 21,
    marginTop: 8,
  },

  /* Highlights */
  highlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 14,
  },
  highlightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  highlightText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },

  /* Info rows */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  infoLabel: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  infoValue: {
    color: T.text,
    fontSize: 12.5,
    fontWeight: "800",
    maxWidth: "45%",
  },

  /* Reviews */
  reviewsHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reviewsBody: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  reviewsScore: {
    color: T.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
  },
  reviewsStarsRow: { flexDirection: "row", gap: 2 },
  reviewsCount: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "700",
  },

  /* Modal footer */
  modalFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === "ios" ? 34 : 22,
    backgroundColor: "rgba(10,10,15,0.96)",
    borderTopWidth: 1,
    borderTopColor: T.border,
  },
  modalCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    height: 54,
    borderRadius: 18,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  modalCtaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.1,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15.5,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: alpha(T.primary, 0.14),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.32),
  },
  emptyCtaText: {
    color: T.primarySoft,
    fontSize: 12.5,
    fontWeight: "900",
  },
});

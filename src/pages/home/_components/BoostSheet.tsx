// src/pages/home/_components/BoostSheet.tsx
import {
  View,
  Pressable,
  Text,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  Zap,
  Star,
  Crown,
  Check,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react-native";
import { toast } from "sonner";

/* ============================================================================
 * TIERS
 * ========================================================================== */

const TIERS = [
  {
    key: "basic" as const,
    label: "Basic",
    days: 3,
    price: "2 500 FC",
    color: "#34D399",
    colorDeep: "#059669",
    Icon: Zap,
    desc: "Une visibilité renforcée pour donner un premier élan.",
    highlight: "Visibilité ×2",
    popular: false,
  },
  {
    key: "pro" as const,
    label: "Pro",
    days: 7,
    price: "5 000 FC",
    color: "#818CF8",
    colorDeep: "#4F46E5",
    Icon: Star,
    desc: "Le meilleur équilibre pour toucher davantage de personnes.",
    highlight: "Visibilité ×5",
    popular: true,
  },
  {
    key: "elite" as const,
    label: "Elite",
    days: 30,
    price: "15 000 FC",
    color: "#F59E0B",
    colorDeep: "#B45309",
    Icon: Crown,
    desc: "Une présence maximale avec une mise en avant prolongée.",
    highlight: "Top du feed",
    popular: false,
  },
];

type BoostTier = (typeof TIERS)[number]["key"];

interface Props {
  open: boolean;
  onClose: () => void;
  publicationId: Id<"publications"> | null;
  publicationTitle?: string;
}

/* ============================================================================
 * HELPERS
 * ========================================================================== */

const TRUST_ITEMS = [
  { icon: TrendingUp, label: "Plus de portée" },
  { icon: Sparkles, label: "Plus visible" },
  { icon: ShieldCheck, label: "Sécurisé" },
];

/* ============================================================================
 * PULSING ICON
 * ========================================================================== */

function PulsingIcon() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const haloScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });
  const haloOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0],
  });

  return (
    <View style={styles.headerIconWrap}>
      <Animated.View
        style={[
          styles.headerIconHalo,
          { opacity: haloOpacity, transform: [{ scale: haloScale }] },
        ]}
      />
      <LinearGradient
        colors={["#FBBF24", "#F59E0B", "#D97706"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerIconGradient}
      >
        <Zap size={22} color="#1C0A00" fill="#1C0A00" strokeWidth={0} />
      </LinearGradient>
    </View>
  );
}

/* ============================================================================
 * TIER CARD
 * ========================================================================== */

function TierCard({
  tier,
  index,
  selected,
  onSelect,
  disabled,
}: {
  tier: (typeof TIERS)[number];
  index: number;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  const Icon = tier.Icon;
  const anim = useRef(new Animated.Value(0)).current;
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay: 80 + index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selected, selectAnim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", `${tier.color}88`],
  });

  const backgroundColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.035)", `${tier.color}12`],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable
        onPress={onSelect}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          { opacity: disabled && !selected ? 0.55 : 1 },
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Animated.View
          style={[
            styles.tierCard,
            { borderColor, backgroundColor },
            selected && {
              shadowColor: tier.color,
              shadowOpacity: 0.35,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 8,
            },
          ]}
        >
          {/* Selected glow gradient */}
          {selected ? (
            <LinearGradient
              colors={[`${tier.color}25`, "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          ) : null}

          {/* Popular badge */}
          {tier.popular ? (
            <View
              style={[
                styles.popularBadge,
                {
                  backgroundColor: `${tier.color}24`,
                  borderColor: `${tier.color}55`,
                },
              ]}
            >
              <Star size={9} color={tier.color} fill={tier.color} />
              <Text style={[styles.popularBadgeText, { color: tier.color }]}>
                RECOMMANDÉ
              </Text>
            </View>
          ) : null}

          <View style={styles.tierRow}>
            {/* Icon */}
            <Animated.View
              style={[
                styles.tierIcon,
                {
                  backgroundColor: `${tier.color}24`,
                  borderColor: `${tier.color}55`,
                  transform: [
                    {
                      scale: selectAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.06],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Icon
                size={19}
                color={tier.color}
                fill={selected && tier.key === "elite" ? tier.color : "none"}
              />
            </Animated.View>

            {/* Text */}
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={styles.tierTitleRow}>
                <Text style={styles.tierLabel}>{tier.label}</Text>
                <View
                  style={[
                    styles.daysBadge,
                    { backgroundColor: `${tier.color}22` },
                  ]}
                >
                  <Text style={[styles.daysBadgeText, { color: tier.color }]}>
                    {tier.days} j
                  </Text>
                </View>
              </View>
              <Text style={styles.tierDesc}>{tier.desc}</Text>
              <View style={styles.tierHighlightRow}>
                <TrendingUp size={10} color={tier.color} />
                <Text style={[styles.tierHighlightText, { color: tier.color }]}>
                  {tier.highlight}
                </Text>
              </View>
            </View>

            {/* Price + check */}
            <View style={styles.tierRightCol}>
              <Text style={[styles.tierPrice, { color: tier.color }]}>
                {tier.price}
              </Text>
              <Animated.View
                style={[
                  styles.checkCircle,
                  {
                    backgroundColor: selected
                      ? tier.color
                      : "rgba(255,255,255,0.06)",
                    borderColor: selected
                      ? tier.color
                      : "rgba(255,255,255,0.12)",
                    transform: [
                      {
                        scale: selectAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                {selected ? (
                  <Check size={11} color="#fff" strokeWidth={3.5} />
                ) : null}
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================================
 * SHINE SWEEP
 * ========================================================================== */

function ShineSweep() {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(2400),
        Animated.timing(x, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [x]);

  const translateX = x.interpolate({
    inputRange: [0, 1],
    outputRange: [-220, 560],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.shine,
        { transform: [{ translateX }, { skewX: "-20deg" }] },
      ]}
    />
  );
}

/* ============================================================================
 * LOADING SPINNER
 * ========================================================================== */

function LoadingSpinner({ color = "#1C0A00" }: { color?: string }) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotate]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Loader2 size={17} color={color} />
    </Animated.View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function BoostSheet({
  open,
  onClose,
  publicationId,
  publicationTitle,
}: Props) {
  const { height: SCREEN_HEIGHT } = useWindowDimensions();

  const [selected, setSelected] = useState<BoostTier>("pro");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(open);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const activateBoost = useMutation(api.boosts.activateBoost);

  const selectedTier = useMemo(
    () => TIERS.find((tier) => tier.key === selected) ?? TIERS[1],
    [selected],
  );

  /* ───── entrance / exit ───── */
  useEffect(() => {
    if (open) {
      setMounted(true);
      backdropAnim.setValue(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!mounted) return null;

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  /* ───── actions ───── */
  const handleBoost = async () => {
    if (!publicationId || loading) return;
    setLoading(true);
    try {
      await activateBoost({ publicationId, tier: selected });
      toast.success(`Boost ${selectedTier.label} activé`, {
        description:
          "Votre publication bénéficie maintenant de la mise en avant sélectionnée.",
      });
      onClose();
    } catch {
      toast.error("Impossible d'activer le Boost", {
        description:
          "Vérifiez votre solde ou réessayez dans quelques instants.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    onClose();
  };

  /* ========================================================================
   * RENDER
   * ====================================================================== */

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* ───── BACKDROP ───── */}
      <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
        <Pressable
          onPress={handleClose}
          style={StyleSheet.absoluteFill}
          accessibilityLabel="Fermer"
        />
      </Animated.View>

      {/* ───── SHEET ───── */}
      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: SCREEN_HEIGHT * 0.92,
            transform: [{ translateY }],
          },
        ]}
      >
        {/* Base gradient */}
        <LinearGradient
          colors={["#140A02", "#0F0703", "#0A0401"]}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top ambient glow */}
        <View style={styles.topGlow} pointerEvents="none">
          <LinearGradient
            colors={["rgba(245,158,11,0.22)", "rgba(245,158,11,0)"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={{ flex: 1, borderRadius: 999 }}
          />
        </View>

        {/* Top light line */}
        <View style={styles.topLine} pointerEvents="none" />

        {/* Border ring */}
        <View style={styles.borderRing} pointerEvents="none" />

        {/* ───── HANDLE ───── */}
        <View style={styles.handleWrap}>
          <View style={styles.handleBar} />
        </View>

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <PulsingIcon />
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Booster votre publication</Text>
              <Sparkles size={15} color="rgba(251,191,36,0.85)" />
            </View>
            <Text style={styles.headerSub}>
              Donnez à votre contenu la visibilité qu'il mérite.
            </Text>
            {publicationTitle ? (
              <View style={styles.publicationChip}>
                <Text style={styles.publicationChipText} numberOfLines={1}>
                  {publicationTitle}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ───── SCROLL CONTENT ───── */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Trust chips */}
          <View style={styles.trustRow}>
            {TRUST_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <TrustChip
                  key={item.label}
                  Icon={Icon}
                  label={item.label}
                  delay={60 + i * 60}
                />
              );
            })}
          </View>

          {/* Section header */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>CHOISISSEZ VOTRE NIVEAU</Text>
            <Text style={styles.sectionSub}>Sans engagement</Text>
          </View>

          {/* Tier cards */}
          <View style={{ gap: 12 }}>
            {TIERS.map((tier, index) => (
              <TierCard
                key={tier.key}
                tier={tier}
                index={index}
                selected={selected === tier.key}
                onSelect={() => !loading && setSelected(tier.key)}
                disabled={loading}
              />
            ))}
          </View>

          {/* Selected summary */}
          <SelectedSummary tier={selectedTier} />
        </ScrollView>

        {/* ───── CTA FOOTER ───── */}
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Platform.OS === "android" ? 22 : Math.max(22, 34),
            },
          ]}
        >
          <Pressable
            onPress={() => void handleBoost()}
            disabled={loading || !publicationId}
            accessibilityRole="button"
            accessibilityLabel={`Activer le Boost ${selectedTier.label}`}
            style={({ pressed }) => [
              styles.ctaOuter,
              (loading || !publicationId) && styles.ctaDisabled,
              pressed && !loading && styles.pressed,
            ]}
          >
            <LinearGradient
              colors={["#FBBF24", "#F59E0B", "#D97706"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              {!loading ? <ShineSweep /> : null}
              {loading ? (
                <>
                  <LoadingSpinner />
                  <Text style={styles.ctaText}>Activation en cours…</Text>
                </>
              ) : (
                <>
                  <Zap
                    size={17}
                    color="#1C0A00"
                    fill="#1C0A00"
                    strokeWidth={0}
                  />
                  <Text style={styles.ctaText}>
                    Activer le Boost {selectedTier.label}
                  </Text>
                  <ArrowRight size={16} color="#1C0A00" strokeWidth={2.6} />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.footerNote}>
            <ShieldCheck size={11} color="rgba(52,211,153,0.55)" />
            <Text style={styles.footerNoteText}>
              Le paiement sera débité de votre Wallet ou Mobile Money.
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/* ============================================================================
 * SUB-COMPONENTS
 * ========================================================================== */

function TrustChip({
  Icon,
  label,
  delay,
}: {
  Icon: any;
  label: string;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 420,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        styles.trustChip,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [10, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Icon size={14} color="rgba(251,191,36,0.85)" />
      <Text style={styles.trustChipText}>{label}</Text>
    </Animated.View>
  );
}

function SelectedSummary({ tier }: { tier: (typeof TIERS)[number] }) {
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [tier.key, fade]);

  return (
    <Animated.View
      style={[
        styles.summaryCard,
        {
          opacity: fade,
          borderColor: `${tier.color}44`,
          backgroundColor: `${tier.color}0E`,
        },
      ]}
    >
      <View
        style={[styles.summaryIcon, { backgroundColor: `${tier.color}22` }]}
      >
        <Check size={12} color={tier.color} strokeWidth={3} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.summaryTitle}>
          Offre sélectionnée : {tier.label}
        </Text>
        <Text style={styles.summarySub}>
          {tier.days} jours · {tier.price}
        </Text>
      </View>
      <ArrowRight size={14} color={tier.color} />
    </Animated.View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  pressed: { opacity: 0.92, transform: [{ scale: 0.985 }] },

  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  // Sheet
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    backgroundColor: "#0A0401",
    shadowColor: "#000",
    shadowOpacity: 0.75,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -20 },
    elevation: 24,
  },

  topGlow: {
    position: "absolute",
    top: -140,
    left: "12%",
    right: "12%",
    height: 200,
    opacity: 0.9,
  },

  topLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(251,191,36,0.35)",
  },

  borderRing: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.15)",
  },

  // Handle
  handleWrap: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 6,
    zIndex: 10,
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    zIndex: 10,
  },
  headerIconWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconHalo: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "rgba(251,191,36,0.5)",
  },
  headerIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.9,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.6,
  },
  headerSub: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  publicationChip: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  publicationChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  // Trust
  trustRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 22,
  },
  trustChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  trustChipText: {
    fontSize: 9.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.2,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.8,
    color: "rgba(255,255,255,0.5)",
  },
  sectionSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
  },

  // Tier card
  tierCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
  },
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    zIndex: 2,
  },
  popularBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  tierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tierIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tierTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tierLabel: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  daysBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  daysBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  tierDesc: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.42)",
    fontWeight: "500",
  },
  tierHighlightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 7,
  },
  tierHighlightText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  tierRightCol: {
    alignItems: "flex-end",
    gap: 8,
  },
  tierPrice: {
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },

  // Selected summary
  summaryCard: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  summaryIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryTitle: {
    fontSize: 11.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.1,
  },
  summarySub: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,4,1,0.7)",
    zIndex: 20,
  },
  ctaOuter: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#F59E0B",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  ctaDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 22,
    borderRadius: 20,
    overflow: "hidden",
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#1C0A00",
    letterSpacing: -0.2,
  },
  shine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.55)",
    opacity: 0.55,
  },
  footerNote: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerNoteText: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.35)",
    fontWeight: "500",
    textAlign: "center",
  },
});

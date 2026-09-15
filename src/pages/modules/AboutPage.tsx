// src/pages/home/_components/AboutPage.tsx
"use no memo";

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
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, type ReactNode, type ComponentType } from "react";
import {
  ArrowLeft,
  Globe,
  Heart,
  Star,
  Users,
  Zap,
  Shield,
  Mail,
  ExternalLink,
  Sparkles,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Rocket,
} from "lucide-react-native";
import { useAppearance, ACCENT_PALETTES } from "@/hooks/use-appearance.ts";
import { toast } from "sonner";

/* ============================================================================
 * PROPS
 * ========================================================================== */

interface AboutPageProps {
  onBack: () => void;
}

/* ============================================================================
 * DATA
 * ========================================================================== */

const TEAM = [
  { name: "Équipe Produit", role: "Vision & Stratégie", emoji: "🧭" },
  { name: "Ingénierie", role: "Backend, Mobile & IA", emoji: "⚙️" },
  { name: "Design UX/UI", role: "Expérience utilisateur", emoji: "🎨" },
  { name: "Ops & Support", role: "Kolwezi · Kinshasa", emoji: "🇨🇩" },
];

const STATS: {
  label: string;
  value: string;
  icon: ComponentType<{ size?: number; color?: string }>;
  color: string;
}[] = [
  {
    label: "Utilisateurs actifs",
    value: "50 000+",
    icon: Users,
    color: "#8B5CF6",
  },
  { label: "Modules disponibles", value: "80+", icon: Zap, color: "#F97316" },
  { label: "Note moyenne", value: "4.8 / 5", icon: Star, color: "#F59E0B" },
  { label: "Pays couverts", value: "5", icon: Globe, color: "#10B981" },
];

const CHANGELOG = [
  {
    version: "v2.8.0",
    date: "Juin 2025",
    note: "Accessibilité WCAG AA, mode daltonisme, animations de pages",
  },
  {
    version: "v2.7.0",
    date: "Mai 2025",
    note: "Centre de notifications push, Découverte & Tendances",
  },
  {
    version: "v2.6.0",
    date: "Avril 2025",
    note: "Export & partage de données, thème & personnalisation avancée",
  },
  {
    version: "v2.5.0",
    date: "Mars 2025",
    note: "Backend complet tous modules, modération améliorée",
  },
  {
    version: "v2.0.0",
    date: "Janv. 2025",
    note: "Lancement public · Kolwezi, RDC",
  },
];

const PILLARS = [
  {
    icon: "🌍",
    title: "Pensé pour l'Afrique",
    text: "Une expérience conçue autour des usages, besoins et réalités locales.",
  },
  {
    icon: "⚡",
    title: "Tout au même endroit",
    text: "Emploi, immobilier, santé, transport, services, communauté et bien plus.",
  },
  {
    icon: "🤖",
    title: "Intelligent par nature",
    text: "Recherche, découverte et recommandations évoluent avec votre usage.",
  },
];

const PRINCIPLES = [
  "Simplicité avant complexité",
  "Technologie utile au quotidien",
  "Expérience rapide et accessible",
  "Construire localement, penser globalement",
];

/* ============================================================================
 * REVEAL — entrance animation (native driver, cleanup propre)
 * ========================================================================== */

function Reveal({
  delay = 0,
  distance = 14,
  children,
  style,
}: {
  delay?: number;
  distance?: number;
  children: ReactNode;
  style?: ViewStyle;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [
            {
              translateY: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [distance, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/* ============================================================================
 * AMBIENT BACKGROUND — dégradé + 2 orbes animées
 * ========================================================================== */

function AmbientBackground({ accent }: { accent: string }) {
  const { width: W, height: H } = useWindowDimensions();
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, {
          toValue: -50,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbA, {
          toValue: 0,
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const loopB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, {
          toValue: 55,
          duration: 11000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(orbB, {
          toValue: 0,
          duration: 11000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loopA.start();
    loopB.start();
    return () => {
      loopA.stop();
      loopB.stop();
    };
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#07050F", "#0E0821", "#0A0518", "#120827"]}
        locations={[0, 0.4, 0.75, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(340, W * 0.9),
            height: Math.max(340, W * 0.9),
            top: -170,
            left: -140,
            backgroundColor: `${accent}40`,
            transform: [{ translateY: orbA }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 320,
            height: 320,
            bottom: H * 0.15 - 160,
            right: -120,
            backgroundColor: `${accent}2A`,
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * HEADER
 * ========================================================================== */

function Header({
  onBack,
  topPad,
  accent,
}: {
  onBack: () => void;
  topPad: number;
  accent: string;
}) {
  return (
    <View
      style={[
        styles.header,
        { paddingTop: topPad + 8, borderColor: "rgba(255,255,255,0.07)" },
      ]}
    >
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={10}
        style={({ pressed }) => [
          styles.backBtn,
          pressed && { opacity: 0.75, transform: [{ scale: 0.94 }] },
        ]}
      >
        <ArrowLeft size={18} color="rgba(255,255,255,0.85)" />
      </Pressable>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>À propos</Text>
        <Text style={styles.headerSub}>Débrouille Pro · Made in Congo 🇨🇩</Text>
      </View>

      <View
        style={[
          styles.headerPill,
          {
            backgroundColor: `${accent}1F`,
            borderColor: `${accent}40`,
          },
        ]}
      >
        <Sparkles size={11} color={accent} />
        <Text style={[styles.headerPillText, { color: accent }]}>HISTOIRE</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * SECTION HEADER
 * ========================================================================== */

function SectionHeader({
  eyebrow,
  title,
  accent,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  accent: string;
  icon?: ComponentType<{ size?: number; color?: string }>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionEyebrowRow}>
        {Icon ? <Icon size={12} color={accent} /> : null}
        <Text style={[styles.sectionEyebrow, { color: accent }]}>
          {eyebrow}
        </Text>
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function AboutPage({ onBack }: AboutPageProps) {
  const insets = useSafeAreaInsets();
  const { prefs } = useAppearance();
  const palette = ACCENT_PALETTES[prefs.accent];
  const hex = palette.hex;
  const glow = palette.glow;
  const gradFrom = palette.gradFrom;
  const gradTo = palette.gradTo;

  return (
    <View style={styles.root}>
      <AmbientBackground accent={hex} />

      <Header onBack={onBack} topPad={insets.top} accent={hex} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ───────── HERO ───────── */}
        <Reveal delay={40}>
          <View style={styles.heroWrap}>
            <LinearGradient
              colors={[`${hex}22`, "rgba(15,7,32,0.4)", "rgba(10,6,24,0.6)"]}
              locations={[0, 0.55, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="none"
              style={[styles.heroBorder, { borderColor: `${hex}40` }]}
            />
            <View
              pointerEvents="none"
              style={[
                styles.heroOrb,
                { backgroundColor: `${hex}30`, shadowColor: glow },
              ]}
            />

            <View style={styles.heroInner}>
              <View style={styles.heroTopRow}>
                <LinearGradient
                  colors={[gradFrom, gradTo]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.heroLogo, { shadowColor: glow }]}
                >
                  <Text style={{ fontSize: 34 }}>🌍</Text>
                </LinearGradient>

                <View
                  style={[
                    styles.heroBadge,
                    {
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderColor: "rgba(255,255,255,0.1)",
                    },
                  ]}
                >
                  <Shield size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.heroBadgeText}>CONÇU POUR DURER</Text>
                </View>
              </View>

              <Text style={[styles.heroEyebrow, { color: hex }]}>
                UNE PLATEFORME · UN ÉCOSYSTÈME
              </Text>

              <Text style={styles.heroTitle}>
                Débrouille <Text style={{ color: hex }}>Pro</Text>
              </Text>

              <Text style={styles.heroSub}>
                Le super-app africain pour tout gérer — immobilier, santé,
                emploi, transport et bien plus. Conçu à Kolwezi, pour toute
                l'Afrique.
              </Text>

              <View style={styles.heroMeta}>
                <View
                  style={[
                    styles.heroMetaChip,
                    { backgroundColor: `${hex}1E`, borderColor: `${hex}40` },
                  ]}
                >
                  <Rocket size={12} color={hex} />
                  <Text style={[styles.heroMetaChipText, { color: hex }]}>
                    v2.8.0
                  </Text>
                </View>
                <Text style={styles.heroMetaText}>Juin 2025</Text>
                <View style={styles.heroMetaDot} />
                <Text style={styles.heroMetaText}>Kolwezi · RDC</Text>
              </View>
            </View>
          </View>
        </Reveal>

        {/* ───────── STORY ───────── */}
        <Reveal delay={120}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Pourquoi nous existons"
              title="Une idée simple. Une grande ambition."
              accent={hex}
              icon={Heart}
            />
            <View style={styles.storyCard}>
              <View style={styles.storyRow}>
                <View
                  style={[
                    styles.storyIcon,
                    { backgroundColor: `${hex}18`, borderColor: `${hex}3A` },
                  ]}
                >
                  <Heart size={19} color={hex} fill={hex} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storyText}>
                    Débrouille Pro est né d'un constat simple : les Congolais
                    méritent des outils numériques de qualité mondiale, adaptés
                    à leur réalité locale. Nous construisons la plateforme qui
                    simplifie la vie quotidienne — de trouver un logement à
                    accéder aux soins, en passant par chercher un emploi ou
                    envoyer de l'argent.
                  </Text>
                  <Text style={styles.storyTextMuted}>
                    Notre ambition est de réunir dans une même expérience les
                    services, les opportunités et les personnes qui font vivre
                    nos communautés.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Reveal>

        {/* ───────── PILLARS ───────── */}
        <Reveal delay={160}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="L'expérience Débrouille Pro"
              title="Trois promesses"
              accent={hex}
              icon={Sparkles}
            />
            <View style={{ gap: 10 }}>
              {PILLARS.map((item, i) => (
                <Reveal key={item.title} delay={200 + i * 60}>
                  <View style={styles.pillarCard}>
                    <View
                      style={[
                        styles.pillarIconWrap,
                        {
                          backgroundColor: `${hex}14`,
                          borderColor: `${hex}30`,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                    </View>
                    <Text style={styles.pillarTitle}>{item.title}</Text>
                    <Text style={styles.pillarText}>{item.text}</Text>
                  </View>
                </Reveal>
              ))}
            </View>
          </View>
        </Reveal>

        {/* ───────── STATS ───────── */}
        <Reveal delay={240}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Débrouille en chiffres"
              title="La communauté grandit"
              accent={hex}
              icon={Users}
            />
            <View style={styles.statsGrid}>
              {STATS.map(({ label, value, icon: Icon, color }, i) => (
                <Reveal
                  key={label}
                  delay={280 + i * 50}
                  style={{ width: "48%" }}
                >
                  <View
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: `${color}12`,
                        borderColor: `${color}2E`,
                      },
                    ]}
                  >
                    <View
                      pointerEvents="none"
                      style={[
                        styles.statOrb,
                        { backgroundColor: `${color}1A` },
                      ]}
                    />
                    <View
                      style={[
                        styles.statIcon,
                        {
                          backgroundColor: `${color}22`,
                          borderColor: `${color}40`,
                        },
                      ]}
                    >
                      <Icon size={16} color={color} />
                    </View>
                    <Text style={styles.statValue}>{value}</Text>
                    <Text style={styles.statLabel}>{label}</Text>
                  </View>
                </Reveal>
              ))}
            </View>
          </View>
        </Reveal>

        {/* ───────── PRINCIPLES ───────── */}
        <Reveal delay={320}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Nos principes"
              title="Ce qui nous guide"
              accent={hex}
              icon={CheckCircle2}
            />
            <View style={styles.principlesCard}>
              {PRINCIPLES.map((principle, i) => (
                <View
                  key={principle}
                  style={[
                    styles.principleRow,
                    i < PRINCIPLES.length - 1 && styles.principleRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.principleCheck,
                      { backgroundColor: `${hex}1E` },
                    ]}
                  >
                    <CheckCircle2 size={12} color={hex} />
                  </View>
                  <Text style={styles.principleText}>{principle}</Text>
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        {/* ───────── TEAM ───────── */}
        <Reveal delay={360}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="L'équipe"
              title="Les visages derrière"
              accent={hex}
              icon={Users}
            />
            <View style={styles.listCard}>
              {TEAM.map((member, i) => (
                <View
                  key={member.name}
                  style={[
                    styles.teamRow,
                    i < TEAM.length - 1 && styles.teamRowBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.teamAvatar,
                      {
                        backgroundColor: `${hex}16`,
                        borderColor: `${hex}36`,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{member.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={styles.teamName}>{member.name}</Text>
                    <Text style={styles.teamRole}>{member.role}</Text>
                  </View>
                  <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                </View>
              ))}
            </View>
          </View>
        </Reveal>

        {/* ───────── CHANGELOG ───────── */}
        <Reveal delay={400}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Historique des versions"
              title="Le journal des nouveautés"
              accent={hex}
              icon={Sparkles}
            />
            <View style={styles.listCard}>
              {CHANGELOG.map((change, i) => {
                const isCurrent = i === 0;
                return (
                  <View
                    key={change.version}
                    style={[
                      styles.changelogRow,
                      i < CHANGELOG.length - 1 && styles.teamRowBorder,
                    ]}
                  >
                    <View
                      style={[
                        styles.changelogDot,
                        {
                          backgroundColor: isCurrent
                            ? hex
                            : "rgba(255,255,255,0.15)",
                          shadowColor: isCurrent ? glow : "transparent",
                        },
                      ]}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={styles.changelogHeader}>
                        <Text
                          style={[
                            styles.changelogVersion,
                            {
                              color: isCurrent ? hex : "rgba(255,255,255,0.5)",
                            },
                          ]}
                        >
                          {change.version}
                        </Text>
                        {isCurrent ? (
                          <View
                            style={[
                              styles.changelogBadge,
                              {
                                backgroundColor: `${hex}20`,
                                borderColor: `${hex}4A`,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.changelogBadgeText,
                                { color: hex },
                              ]}
                            >
                              ACTUEL
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.changelogNote}>{change.note}</Text>
                      <Text style={styles.changelogDate}>{change.date}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </Reveal>

        {/* ───────── CONTACT ───────── */}
        <Reveal delay={440}>
          <View style={styles.block}>
            <SectionHeader
              eyebrow="Contact"
              title="Restons en lien"
              accent={hex}
              icon={Mail}
            />
            <View style={styles.listCard}>
              <Pressable
                onPress={() => toast.info("Copié : contact@debrouille.pro")}
                accessibilityRole="button"
                accessibilityLabel="Nous contacter"
                style={({ pressed }) => [
                  styles.contactRow,
                  styles.teamRowBorder,
                  pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
                ]}
              >
                <View
                  style={[
                    styles.contactIcon,
                    {
                      backgroundColor: "rgba(59,130,246,0.15)",
                      borderColor: "rgba(59,130,246,0.32)",
                    },
                  ]}
                >
                  <Mail size={16} color="#60A5FA" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.contactTitle}>Nous contacter</Text>
                  <Text style={styles.contactSub}>contact@debrouille.pro</Text>
                </View>
                <ExternalLink size={13} color="rgba(255,255,255,0.25)" />
              </Pressable>

              <Pressable
                onPress={() => toast.info("Ouverture du site web…")}
                accessibilityRole="button"
                accessibilityLabel="Site officiel"
                style={({ pressed }) => [
                  styles.contactRow,
                  pressed && { backgroundColor: "rgba(255,255,255,0.04)" },
                ]}
              >
                <View
                  style={[
                    styles.contactIcon,
                    {
                      backgroundColor: `${hex}18`,
                      borderColor: `${hex}36`,
                    },
                  ]}
                >
                  <Globe size={16} color={hex} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.contactTitle}>Site officiel</Text>
                  <Text style={styles.contactSub}>www.debrouille.pro</Text>
                </View>
                <ExternalLink size={13} color="rgba(255,255,255,0.25)" />
              </Pressable>
            </View>
          </View>
        </Reveal>

        {/* ───────── SIGNATURE ───────── */}
        <Reveal delay={480}>
          <View style={[styles.signatureCard, { borderColor: `${hex}32` }]}>
            <LinearGradient
              colors={[`${hex}1C`, "rgba(15,7,32,0.5)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.signatureInner}>
              <MapPin size={18} color={hex} />
              <Text style={styles.signatureTitle}>
                Construit à Kolwezi. Pensé pour l'Afrique.
              </Text>
              <Text style={styles.signatureSub}>
                Notre histoire ne fait que commencer.
              </Text>
            </View>
          </View>
        </Reveal>

        {/* ───────── FOOTER LINKS ───────── */}
        <Reveal delay={520}>
          <View style={styles.footerLinks}>
            {["CGU", "Confidentialité", "Licences"].map((label) => (
              <Pressable
                key={label}
                onPress={() => toast.info(`Page ${label} bientôt disponible`)}
                hitSlop={8}
                style={({ pressed }) => pressed && { opacity: 0.6 }}
              >
                <Text style={styles.footerLink}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Reveal>

        <Text style={styles.copyright}>
          © 2025 Débrouille Pro SAS · Kolwezi, RDC · Tous droits réservés
        </Text>
      </ScrollView>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#07050F",
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 28,
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  /* ─── Header ───────────────────────────────────── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    backgroundColor: "rgba(7,5,15,0.85)",
    zIndex: 10,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  headerCenter: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.3,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  headerPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  headerPillText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  /* ─── Hero ─────────────────────────────────────── */
  heroWrap: {
    borderRadius: 26,
    overflow: "hidden",
    position: "relative",
  },
  heroBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    borderWidth: 1,
  },
  heroOrb: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 999,
    opacity: 0.6,
  },
  heroInner: {
    padding: 22,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 22,
  },
  heroLogo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowOpacity: 0.6,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 10 },
      default: {},
    }),
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.65)",
    letterSpacing: 1,
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.4,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.8,
    lineHeight: 36,
  },
  heroSub: {
    marginTop: 12,
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },
  heroMeta: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  heroMetaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  heroMetaChipText: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  heroMetaText: {
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "600",
  },
  heroMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  /* ─── Sections ─────────────────────────────────── */
  block: {
    gap: 0,
  },
  sectionHeader: {
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  sectionEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 4,
  },
  sectionEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.4,
  },

  /* ─── Story ────────────────────────────────────── */
  storyCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },
  storyRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "flex-start",
  },
  storyIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.78)",
    fontWeight: "500",
  },
  storyTextMuted: {
    marginTop: 10,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ─── Pillars ──────────────────────────────────── */
  pillarCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },
  pillarIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  pillarTitle: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  pillarText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
  },

  /* ─── Stats ────────────────────────────────────── */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  statCard: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    minHeight: 120,
    justifyContent: "space-between",
  },
  statOrb: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  statLabel: {
    marginTop: 3,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "600",
  },

  /* ─── Principles ───────────────────────────────── */
  principlesCard: {
    borderRadius: 22,
    padding: 6,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },
  principleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
  },
  principleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  principleCheck: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  principleText: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "600",
  },

  /* ─── Lists (Team / Changelog / Contact) ───────── */
  listCard: {
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.075)",
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  teamRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  teamAvatar: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  teamName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
  },
  teamRole: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  /* ─── Changelog ────────────────────────────────── */
  changelogRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "flex-start",
  },
  changelogDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
    ...Platform.select({
      ios: {
        shadowOpacity: 0.7,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 0 },
      },
      default: {},
    }),
  },
  changelogHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  changelogVersion: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  changelogBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  changelogBadgeText: {
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  changelogNote: {
    marginTop: 5,
    fontSize: 12.5,
    lineHeight: 18,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  changelogDate: {
    marginTop: 5,
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "600",
  },

  /* ─── Contact ──────────────────────────────────── */
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  contactIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  contactTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "rgba(255,255,255,0.9)",
  },
  contactSub: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },

  /* ─── Signature ────────────────────────────────── */
  signatureCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  signatureInner: {
    padding: 22,
    alignItems: "center",
    gap: 6,
  },
  signatureTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.2,
    marginTop: 4,
  },
  signatureSub: {
    fontSize: 11.5,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ─── Footer ───────────────────────────────────── */
  footerLinks: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 20,
    paddingTop: 4,
  },
  footerLink: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
  },
  copyright: {
    textAlign: "center",
    fontSize: 10,
    color: "rgba(255,255,255,0.22)",
    fontWeight: "500",
    paddingBottom: 8,
  },
});

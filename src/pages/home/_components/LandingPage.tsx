// src/pages/home/_components/LandingPage.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  Award,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  Globe2,
  HeartPulse,
  Lock,
  MessageCircle,
  Quote,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { SignInButton } from "@/components/ui/signin";

/* ============================================================
   DATA
============================================================ */

const ROTATING_WORDS = [
  "ta vie",
  "tes projets",
  "tes opportunités",
  "ta communauté",
  "ton quotidien",
];

const PILLARS = [
  {
    icon: Compass,
    eyebrow: "DÉCOUVRIR",
    number: "01",
    title: "Trouve ce dont tu as besoin.",
    desc: "Recherche intelligente, recommandations personnalisées, résultats pertinents dès la première seconde.",
    color: "#818CF8",
  },
  {
    icon: Zap,
    eyebrow: "AGIR",
    number: "02",
    title: "Passe de l'idée à l'action.",
    desc: "Publie, réserve, contacte, paie — sans friction. Toutes les actions essentielles à portée de pouce.",
    color: "#A78BFA",
  },
  {
    icon: Users,
    eyebrow: "CONNECTER",
    number: "03",
    title: "Les bonnes personnes, au bon moment.",
    desc: "Une communauté locale et active. Des rencontres qui deviennent des opportunités.",
    color: "#C084FC",
  },
];

const STATS = [
  { value: 10000, suffix: "+", label: "Utilisateurs actifs", icon: Users },
  { value: 50, suffix: "+", label: "Modules intégrés", icon: Award },
  { value: 24, suffix: "/7", label: "Disponibilité", icon: Zap },
  { value: 49, suffix: "/50", label: "Satisfaction", icon: Star, divide: 10 },
];

const STEPS = [
  {
    number: "01",
    icon: Rocket,
    title: "Crée ton espace",
    desc: "30 secondes pour t'inscrire. Aucune carte bancaire requise.",
    accent: "#818CF8",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Personnalise ton expérience",
    desc: "Choisis tes modules préférés. Ton feed s'adapte en direct.",
    accent: "#A78BFA",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Agis et progresse",
    desc: "Trouve, contacte, publie, gagne. Tout au même endroit.",
    accent: "#C084FC",
  },
];

const MODULES = [
  {
    icon: Briefcase,
    title: "Emploi",
    count: "1 200+ offres",
    color: "#A78BFA",
  },
  {
    icon: Building2,
    title: "Immobilier",
    count: "3 400+ biens",
    color: "#FB923C",
  },
  { icon: HeartPulse, title: "Santé", count: "800+ pros", color: "#F87171" },
  {
    icon: Wallet,
    title: "Finance",
    count: "Paiement intégré",
    color: "#34D399",
  },
  {
    icon: Compass,
    title: "Explorer",
    count: "Carte 3D locale",
    color: "#818CF8",
  },
  {
    icon: MessageCircle,
    title: "Messages",
    count: "Chat chiffré",
    color: "#22D3EE",
  },
];

const TESTIMONIALS = [
  {
    name: "Aminata D.",
    role: "Entrepreneure — Dakar",
    initials: "AD",
    accent: "#A78BFA",
    quote:
      "J'ai trouvé mon premier local commercial en 48h. Et mes clientes me contactent directement via l'app. Un gain de temps énorme.",
  },
  {
    name: "Kwame O.",
    role: "Développeur freelance — Accra",
    initials: "KO",
    accent: "#22D3EE",
    quote:
      "Je facture, je livre, je suis payé. Tout est au même endroit. J'ai arrêté de jongler entre 6 apps différentes.",
  },
  {
    name: "Léa M.",
    role: "Étudiante en médecine — Kinshasa",
    initials: "LM",
    accent: "#FB923C",
    quote:
      "La carte des cliniques et pharmacies m'a sauvée plus d'une fois. Et le chat avec les médecins est ultra réactif.",
  },
];

const TRUST_ITEMS = [
  {
    icon: ShieldCheck,
    accent: "#A78BFA",
    title: "Pensé pour la confiance",
    text: "Identité vérifiée, données chiffrées, transactions sécurisées. Ta vie privée reste la tienne.",
  },
  {
    icon: Globe2,
    accent: "#22D3EE",
    title: "Local et international",
    text: "Commence près de chez toi et garde le monde à portée de main. 15 pays couverts.",
  },
  {
    icon: Lock,
    accent: "#34D399",
    title: "Aucune revente de données",
    text: "Jamais. Ton profil t'appartient. Tu peux l'exporter ou le supprimer à tout moment.",
  },
];

/* ============================================================
   HOOKS
============================================================ */

function useStaggeredEntrance(count: number, staggerMs = 110) {
  const values = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    Animated.stagger(
      staggerMs,
      values.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: 620,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [values, staggerMs]);

  return values;
}

function useHover() {
  const [hovered, setHovered] = useState(false);
  return {
    hovered,
    onHoverIn: () => setHovered(true),
    onHoverOut: () => setHovered(false),
  };
}

function useCountUp(target: number, duration = 1600, delay = 0, divide = 1) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const startTimer = setTimeout(() => {
      const start = Date.now();
      const step = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue((eased * target) / divide);
        if (progress < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(raf);
    };
  }, [target, duration, delay, divide]);

  return value;
}

/* ============================================================
   BACKGROUND — dégradé riche + orbes animées
============================================================ */

function AnimatedBackground() {
  const { width: W, height: H } = useWindowDimensions();

  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;
  const orb3 = useRef(new Animated.Value(0)).current;
  const orb4 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (v: Animated.Value, to: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: to,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: dur,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ).start();

    loop(orb1, -60, 8000);
    loop(orb2, 70, 10000);
    loop(orb3, -50, 9000);
    loop(orb4, 55, 11000);
  }, [orb1, orb2, orb3, orb4]);

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={StyleSheet.absoluteFill}
    >
      <LinearGradient
        colors={["#0B0620", "#160B33", "#0F0525", "#1B0B3D"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(380, W * 0.7),
            height: Math.max(380, W * 0.7),
            top: -160,
            left: -140,
            backgroundColor: "rgba(139,92,246,0.5)",
            transform: [{ translateY: orb1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 340,
            height: 340,
            top: H * 0.22,
            right: -140,
            backgroundColor: "rgba(99,102,241,0.42)",
            transform: [{ translateY: orb2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 360,
            height: 360,
            bottom: H * 0.15,
            left: -140,
            backgroundColor: "rgba(168,85,247,0.4)",
            transform: [{ translateY: orb3 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 340,
            height: 340,
            bottom: -140,
            right: -120,
            backgroundColor: "rgba(124,58,237,0.45)",
            transform: [{ translateY: orb4 }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
   PULSING DOT
============================================================ */

function PulsingDot({ color = "#A78BFA" }: { color?: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.6],
  });
  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 0],
  });

  return (
    <View
      style={{
        width: 8,
        height: 8,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{
          position: "absolute",
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          opacity,
          transform: [{ scale }],
        }}
      />
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </View>
  );
}

/* ============================================================
   ROTATING WORD
============================================================ */

function RotatingWord({
  words,
  color = "#fff",
  fontSize = 15,
}: {
  words: string[];
  color?: string;
  fontSize?: number;
}) {
  const [index, setIndex] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 220,
          useNativeDriver: true,
          easing: Easing.in(Easing.ease),
        }),
      ]).start(() => {
        setIndex((i) => (i + 1) % words.length);
        translateY.setValue(12);
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }),
        ]).start();
      });
    }, 2600);

    return () => clearInterval(interval);
  }, [words.length, opacity, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Text style={{ color, fontSize, fontWeight: "900", letterSpacing: -0.3 }}>
        {words[index]}
      </Text>
    </Animated.View>
  );
}

/* ============================================================
   SCROLL INDICATOR
============================================================ */

function ScrollIndicator() {
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [bounce]);

  const translateY = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });
  const opacity = bounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.7],
  });

  return (
    <Animated.View
      style={[styles.scrollIndicator, { opacity, transform: [{ translateY }] }]}
      pointerEvents="none"
    >
      <View style={styles.scrollIndicatorLine} />
    </Animated.View>
  );
}

/* ============================================================
   LANDING PAGE
============================================================ */

export default function LandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();

  const isDesktop = width >= 768;

  const h1Size = isDesktop ? 76 : 46;
  const h1LineHeight = isDesktop ? 82 : 50;
  const sectionTitleSize = isDesktop ? 42 : 28;
  const sectionTitleLineHeight = isDesktop ? 48 : 34;

  const anims = useStaggeredEntrance(5, 110);
  const [badgeAnim, titleAnim, subtitleAnim, rotatingAnim, ctaAnim] = anims;

  const buildEntrance = (anim: Animated.Value, distance = 22) => ({
    opacity: anim,
    transform: [
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [distance, 0],
        }),
      },
    ],
  });

  return (
    <View style={styles.root}>
      <AnimatedBackground />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════ HERO ═══════════════ */}
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <Animated.View style={buildEntrance(badgeAnim, 14)}>
            <View style={styles.badge}>
              <PulsingDot color="#A78BFA" />
              <Text style={styles.badgeText}>
                UNE NOUVELLE FAÇON DE VIVRE LE QUOTIDIEN
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={buildEntrance(titleAnim, 26)}>
            <Text
              style={[
                styles.h1,
                { fontSize: h1Size, lineHeight: h1LineHeight },
              ]}
            >
              Le monde
            </Text>
            <Text
              style={[
                styles.h1,
                styles.h1Accent,
                { fontSize: h1Size, lineHeight: h1LineHeight },
                Platform.OS === "web" && (styles.h1Gradient as any),
              ]}
            >
              commence ici.
            </Text>
          </Animated.View>

          <Animated.View style={buildEntrance(subtitleAnim, 22)}>
            <Text
              style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}
            >
              Une plateforme pour découvrir, connecter et agir. Emploi,
              logement, services, communauté, opportunités et bien plus — réunis
              dans une expérience simple.
            </Text>
          </Animated.View>

          <Animated.View style={buildEntrance(rotatingAnim, 16)}>
            <View style={styles.rotatingRow}>
              <Sparkles size={15} color="#A78BFA" />
              <Text style={styles.rotatingLabel}>Conçu pour</Text>
              <RotatingWord words={ROTATING_WORDS} color="#fff" fontSize={15} />
            </View>
          </Animated.View>

          <Animated.View style={[buildEntrance(ctaAnim, 22), styles.ctaRow]}>
            <View style={styles.primaryCtaWrap}>
              <SignInButton />
            </View>

            <Pressable
              onPress={() => router.push("/auth?mode=register" as never)}
              style={({ pressed }) => [
                styles.ctaSecondary,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.ctaSecondaryText}>Créer mon espace</Text>
              <ArrowRight size={15} color="#fff" />
            </Pressable>
          </Animated.View>

          <Animated.View style={[buildEntrance(ctaAnim, 12), styles.trustRow]}>
            <View style={styles.trustRowItem}>
              <CheckCircle2 size={13} color="#6EE7B7" />
              <Text style={styles.trustRowText}>Gratuit</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustRowItem}>
              <CheckCircle2 size={13} color="#6EE7B7" />
              <Text style={styles.trustRowText}>Aucun engagement</Text>
            </View>
            <View style={styles.trustDot} />
            <View style={styles.trustRowItem}>
              <CheckCircle2 size={13} color="#6EE7B7" />
              <Text style={styles.trustRowText}>Sécurisé</Text>
            </View>
          </Animated.View>

          <ScrollIndicator />
        </View>

        {/* ═══════════════ STATS BAND ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <View style={styles.statsGrid}>
            {STATS.map((s, idx) => (
              <StatCard
                key={s.label}
                icon={s.icon}
                value={s.value}
                suffix={s.suffix}
                label={s.label}
                divide={s.divide}
                index={idx}
              />
            ))}
          </View>
        </View>

        {/* ═══════════════ PILLARS ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionEyebrow}>UNE SEULE EXPÉRIENCE</Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: sectionTitleSize,
                lineHeight: sectionTitleLineHeight,
              },
            ]}
          >
            Moins d'applications.{"\n"}
            <Text style={styles.sectionTitleAccent}>Plus de possibilités.</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Trois principes qui structurent chaque écran, chaque interaction,
            chaque décision produit.
          </Text>

          {PILLARS.map((p, idx) => {
            const Icon = p.icon;
            return (
              <PillarCard key={p.eyebrow} pillar={p} Icon={Icon} index={idx} />
            );
          })}
        </View>

        {/* ═══════════════ HOW IT WORKS ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionEyebrow}>COMMENT ÇA MARCHE</Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: sectionTitleSize,
                lineHeight: sectionTitleLineHeight,
              },
            ]}
          >
            En 30 secondes,{"\n"}
            <Text style={styles.sectionTitleAccent}>tu es dedans.</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Aucun tutoriel, aucune configuration complexe. Tu commences
            immédiatement.
          </Text>

          <View style={{ marginTop: 20 }}>
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <StepRow
                  key={step.number}
                  step={step}
                  Icon={Icon}
                  index={idx}
                  isLast={idx === STEPS.length - 1}
                />
              );
            })}
          </View>
        </View>

        {/* ═══════════════ MODULES ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionEyebrow}>TON ÉCOSYSTÈME</Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: sectionTitleSize,
                lineHeight: sectionTitleLineHeight,
              },
            ]}
          >
            Tout commence avec{" "}
            <Text style={styles.sectionTitleAccent}>un besoin.</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Un emploi à trouver. Un logement à louer. Un médecin à consulter. Un
            paiement à envoyer. DébrouillePro répond présent.
          </Text>

          <View style={styles.modulesGrid}>
            {MODULES.map((m, idx) => {
              const Icon = m.icon;
              return (
                <ModuleCard key={m.title} module={m} Icon={Icon} index={idx} />
              );
            })}
          </View>
        </View>

        {/* ═══════════════ TESTIMONIALS ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionEyebrow}>ILS NOUS FONT CONFIANCE</Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: sectionTitleSize,
                lineHeight: sectionTitleLineHeight,
              },
            ]}
          >
            Des vies qui{" "}
            <Text style={styles.sectionTitleAccent}>changent.</Text>
          </Text>
          <Text style={styles.sectionSub}>
            Pas d'histoires inventées. Des utilisateurs réels, des résultats
            mesurables.
          </Text>

          {TESTIMONIALS.map((t, idx) => (
            <TestimonialCard key={t.name} t={t} index={idx} />
          ))}
        </View>

        {/* ═══════════════ TRUST ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionEyebrow}>CONSTRUIRE LA CONFIANCE</Text>
          <Text
            style={[
              styles.sectionTitle,
              {
                fontSize: sectionTitleSize,
                lineHeight: sectionTitleLineHeight,
              },
            ]}
          >
            De bonnes bases{" "}
            <Text style={styles.sectionTitleAccent}>pour durer.</Text>
          </Text>

          {TRUST_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <TrustCard
                key={item.title}
                Icon={Icon}
                accent={item.accent}
                title={item.title}
                text={item.text}
                index={idx}
              />
            );
          })}
        </View>

        {/* ═══════════════ FINAL CTA ═══════════════ */}
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <FinalCTA />
        </View>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <View style={styles.footer}>
          <LinearGradient
            colors={[
              "rgba(167,139,250,0)",
              "rgba(167,139,250,0.35)",
              "rgba(167,139,250,0)",
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.footerLine}
          />
          <View style={styles.footerBrand}>
            <View style={styles.footerLogo}>
              <Globe2 size={14} color="#fff" />
            </View>
            <Text style={styles.footerBrandText}>
              Débrouille<Text style={{ color: "#A78BFA" }}>Pro</Text>
            </Text>
          </View>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} Débrouille Pro — Le monde commence ici.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  value,
  suffix,
  label,
  divide = 1,
  index,
}: {
  icon: any;
  value: number;
  suffix: string;
  label: string;
  divide?: number;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const counted = useCountUp(value, 1600, 200 + index * 120, divide);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 520,
      delay: 100 + index * 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  const display =
    divide !== 1
      ? counted.toFixed(1).replace(".0", "")
      : Math.round(counted).toLocaleString("fr-FR");

  return (
    <Animated.View
      style={[
        styles.statCardOuter,
        { opacity: anim, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.statCard}>
        <LinearGradient
          colors={["rgba(167,139,250,0.14)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.statIconWrap}>
          <Icon size={15} color="#C4B5FD" />
        </View>
        <Text style={styles.statValue}>
          {display}
          <Text style={styles.statSuffix}>{suffix}</Text>
        </Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
}

/* ============================================================
   STEP ROW
============================================================ */

function StepRow({
  step,
  Icon,
  index,
  isLast,
}: {
  step: (typeof STEPS)[number];
  Icon: any;
  index: number;
  isLast: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 560,
      delay: 180 + index * 110,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });

  return (
    <Animated.View
      style={[
        styles.stepRowOuter,
        { opacity: anim, transform: [{ translateX }] },
      ]}
    >
      <View style={styles.stepRow}>
        <View style={styles.stepLeft}>
          <LinearGradient
            colors={[`${step.accent}33`, `${step.accent}10`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.stepCircle}
          >
            <Icon size={20} color={step.accent} />
          </LinearGradient>
          {!isLast ? (
            <View
              style={[
                styles.stepConnector,
                { backgroundColor: `${step.accent}33` },
              ]}
            />
          ) : null}
        </View>

        <View style={styles.stepContent}>
          <View style={styles.stepNumberRow}>
            <Text style={[styles.stepNumber, { color: step.accent }]}>
              {step.number}
            </Text>
            <View style={[styles.stepDot, { backgroundColor: step.accent }]} />
          </View>
          <Text style={styles.stepTitle}>{step.title}</Text>
          <Text style={styles.stepDesc}>{step.desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================
   PILLAR CARD
============================================================ */

function PillarCard({
  pillar,
  Icon,
  index,
}: {
  pillar: (typeof PILLARS)[number];
  Icon: any;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const { hovered, onHoverIn, onHoverOut } = useHover();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      delay: 120 + index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [24, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={[
          styles.pillarCard,
          {
            borderColor: hovered
              ? `${pillar.color}66`
              : "rgba(255,255,255,0.08)",
            backgroundColor: hovered
              ? "rgba(255,255,255,0.055)"
              : "rgba(255,255,255,0.028)",
          },
          hovered && {
            shadowColor: pillar.color,
            shadowOpacity: 0.32,
            shadowRadius: 26,
            shadowOffset: { width: 0, height: 16 },
            transform: [{ translateY: -4 }],
          },
        ]}
      >
        <View style={styles.pillarHeader}>
          <LinearGradient
            colors={[`${pillar.color}33`, "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillarIconWrap}
          >
            <Icon size={22} color={pillar.color} />
          </LinearGradient>
          <Text style={[styles.pillarNumber, { color: `${pillar.color}99` }]}>
            {pillar.number}
          </Text>
        </View>

        <Text style={[styles.pillarEyebrow, { color: pillar.color }]}>
          {pillar.eyebrow}
        </Text>
        <Text style={styles.pillarTitle}>{pillar.title}</Text>
        <Text style={styles.pillarDesc}>{pillar.desc}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   MODULE CARD
============================================================ */

function ModuleCard({
  module,
  Icon,
  index,
}: {
  module: (typeof MODULES)[number];
  Icon: any;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const { hovered, onHoverIn, onHoverOut } = useHover();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 500,
      delay: 140 + index * 70,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <Animated.View
      style={[
        styles.moduleCardOuter,
        { opacity: anim, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={[
          styles.moduleCard,
          {
            borderColor: hovered
              ? `${module.color}77`
              : "rgba(255,255,255,0.08)",
            backgroundColor: hovered
              ? `${module.color}14`
              : "rgba(255,255,255,0.028)",
          },
          hovered && {
            shadowColor: module.color,
            shadowOpacity: 0.35,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 14 },
          },
        ]}
      >
        <LinearGradient
          colors={[`${module.color}22`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[styles.moduleIcon, { backgroundColor: `${module.color}22` }]}
        >
          <Icon size={18} color={module.color} />
        </View>
        <Text style={styles.moduleTitle}>{module.title}</Text>
        <Text style={styles.moduleCount}>{module.count}</Text>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   TESTIMONIAL CARD
============================================================ */

function TestimonialCard({
  t,
  index,
}: {
  t: (typeof TESTIMONIALS)[number];
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const { hovered, onHoverIn, onHoverOut } = useHover();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      delay: 160 + index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={[
          styles.testimonialCard,
          {
            borderColor: hovered ? `${t.accent}55` : "rgba(255,255,255,0.08)",
            backgroundColor: hovered
              ? "rgba(255,255,255,0.045)"
              : "rgba(255,255,255,0.028)",
          },
          hovered && {
            shadowColor: t.accent,
            shadowOpacity: 0.3,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
          },
        ]}
      >
        <View style={styles.testimonialHeader}>
          <View style={styles.testimonialQuoteIcon}>
            <Quote size={14} color={t.accent} />
          </View>
          <View style={styles.testimonialStars}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={11} color="#FBBF24" fill="#FBBF24" />
            ))}
          </View>
        </View>

        <Text style={styles.testimonialQuote}>{t.quote}</Text>

        <View style={styles.testimonialFooter}>
          <LinearGradient
            colors={[t.accent, `${t.accent}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.testimonialAvatar}
          >
            <Text style={styles.testimonialAvatarText}>{t.initials}</Text>
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.testimonialName}>{t.name}</Text>
            <Text style={styles.testimonialRole}>{t.role}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   TRUST CARD
============================================================ */

function TrustCard({
  Icon,
  accent,
  title,
  text,
  index,
}: {
  Icon: any;
  accent: string;
  title: string;
  text: string;
  index: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const { hovered, onHoverIn, onHoverOut } = useHover();

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 550,
      delay: 180 + index * 100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim, index]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY }] }}>
      <Pressable
        onHoverIn={onHoverIn}
        onHoverOut={onHoverOut}
        style={[
          styles.trustCard,
          {
            borderColor: hovered ? `${accent}55` : "rgba(255,255,255,0.08)",
            backgroundColor: hovered
              ? "rgba(255,255,255,0.05)"
              : "rgba(255,255,255,0.028)",
          },
          hovered && {
            shadowColor: accent,
            shadowOpacity: 0.28,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
          },
        ]}
      >
        <LinearGradient
          colors={[`${accent}30`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.trustIconWrap}
        >
          <Icon size={22} color={accent} />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.trustTitle}>{title}</Text>
          <Text style={styles.trustText}>{text}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/* ============================================================
   FINAL CTA
============================================================ */

function FinalCTA() {
  const router = useRouter();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 650,
      delay: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  return (
    <Animated.View
      style={{ opacity: anim, transform: [{ translateY }], width: "100%" }}
    >
      <View style={styles.finalCtaCard}>
        <LinearGradient
          colors={[
            "rgba(139,92,246,0.28)",
            "rgba(99,102,241,0.14)",
            "rgba(15,7,32,0.9)",
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.finalCtaOrb} pointerEvents="none" />
        <View style={styles.finalCtaOrb2} pointerEvents="none" />
        <View style={styles.finalCtaBorder} pointerEvents="none" />

        <View style={styles.finalCtaContent}>
          <LinearGradient
            colors={["#A78BFA", "#7C3AED", "#6366F1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finalCtaIconWrap}
          >
            <Rocket size={26} color="#fff" />
          </LinearGradient>

          <Text style={styles.finalCtaEyebrow}>PRÊT À COMMENCER ?</Text>
          <Text style={styles.finalCtaTitle}>
            Rejoins celles et ceux qui{"\n"}
            <Text style={styles.finalCtaTitleAccent}>
              construisent leur avenir.
            </Text>
          </Text>
          <Text style={styles.finalCtaSub}>
            Rejoins DébrouillePro gratuitement. Aucune carte bancaire requise.
            30 secondes pour t'inscrire. Une vie pour en profiter.
          </Text>

          <View style={styles.finalCtaButtons}>
            <Pressable
              onPress={() => router.push("/auth?mode=register" as never)}
              style={({ pressed }) => [
                styles.finalCtaPrimaryOuter,
                pressed && styles.pressed,
              ]}
            >
              <LinearGradient
                colors={["#A78BFA", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.finalCtaPrimary}
              >
                <Text style={styles.finalCtaPrimaryText}>
                  Créer mon espace gratuitement
                </Text>
                <ArrowRight size={16} color="#fff" />
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.finalCtaTrustRow}>
            <CheckCircle2 size={13} color="#6EE7B7" />
            <Text style={styles.finalCtaTrustText}>
              Gratuit · Aucune carte requise · Annulation en 1 clic
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0620",
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingBottom: 48,
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  /* ── HERO ───────────────────────────────────────────── */
  hero: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    position: "relative",
  },
  heroDesktop: {
    paddingTop: 100,
    paddingBottom: 56,
    gap: 22,
  },

  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(139,92,246,0.12)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
  },
  badgeText: {
    color: "#D8CCFC",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  h1: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -1.8,
  },
  h1Accent: {
    color: "#C4B5FD",
    paddingBottom: 6,
  },
  h1Gradient: {
    backgroundImage:
      "linear-gradient(135deg, #C4B5FD 0%, #A78BFA 35%, #8B5CF6 70%, #6366F1 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  },

  subtitle: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 15,
    lineHeight: 24,
    marginTop: 12,
    maxWidth: 580,
  },
  subtitleDesktop: {
    fontSize: 17,
    lineHeight: 28,
  },

  rotatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  rotatingLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 15,
  },

  ctaRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 28,
    flexWrap: "wrap",
    alignItems: "center",
  },
  primaryCtaWrap: {
    borderRadius: 16,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  ctaSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  ctaSecondaryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
  },

  trustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    flexWrap: "wrap",
  },
  trustRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  trustDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  trustRowText: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 11.5,
    fontWeight: "600",
  },

  scrollIndicator: {
    alignSelf: "center",
    marginTop: 40,
    width: 22,
    height: 36,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    paddingTop: 6,
  },
  scrollIndicatorLine: {
    width: 2,
    height: 6,
    borderRadius: 1,
    backgroundColor: "rgba(167,139,250,0.9)",
  },

  /* ── SECTION ──────────────────────────────────────── */
  section: {
    paddingHorizontal: 24,
    paddingTop: 56,
    gap: 14,
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },
  sectionDesktop: {
    paddingTop: 88,
    gap: 18,
  },
  sectionEyebrow: {
    color: "#C4B5FD",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "900",
    letterSpacing: -1.4,
  },
  sectionTitleAccent: {
    color: "#A78BFA",
  },
  sectionSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 620,
    marginTop: -4,
  },

  /* ── STATS BAND ───────────────────────────────────── */
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  statCardOuter: {
    flexBasis: "22%",
    flexGrow: 1,
    minWidth: 140,
  },
  statCard: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.2)",
    backgroundColor: "rgba(255,255,255,0.03)",
    overflow: "hidden",
    gap: 8,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.18)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  statValue: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.2,
    marginTop: 4,
  },
  statSuffix: {
    fontSize: 18,
    color: "#A78BFA",
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  /* ── STEP ROW ─────────────────────────────────────── */
  stepRowOuter: {
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    gap: 18,
  },
  stepLeft: {
    alignItems: "center",
    width: 56,
  },
  stepCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  stepConnector: {
    flex: 1,
    width: 2,
    marginTop: 8,
    marginBottom: -8,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    paddingBottom: 32,
    paddingTop: 2,
  },
  stepNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
  },
  stepDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  stepDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    lineHeight: 21,
    maxWidth: 480,
  },

  /* ── PILLAR ───────────────────────────────────────── */
  pillarCard: {
    padding: 24,
    borderRadius: 26,
    borderWidth: 1,
    marginTop: 12,
    gap: 6,
  },
  pillarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  pillarIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillarNumber: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  pillarEyebrow: {
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 2.2,
  },
  pillarTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  pillarDesc: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
  },

  /* ── MODULES ──────────────────────────────────────── */
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  moduleCardOuter: {
    flexBasis: "31%",
    flexGrow: 1,
    minWidth: 150,
  },
  moduleCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    gap: 10,
    overflow: "hidden",
  },
  moduleIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  moduleTitle: {
    color: "rgba(255,255,255,0.95)",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  moduleCount: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "600",
  },

  /* ── TESTIMONIALS ─────────────────────────────────── */
  testimonialCard: {
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    marginTop: 12,
    gap: 14,
  },
  testimonialHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  testimonialQuoteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  testimonialStars: {
    flexDirection: "row",
    gap: 3,
  },
  testimonialQuote: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "500",
    letterSpacing: -0.2,
  },
  testimonialFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  testimonialAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  testimonialAvatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  testimonialName: {
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  testimonialRole: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 11.5,
    fontWeight: "500",
    marginTop: 2,
  },

  /* ── TRUST ────────────────────────────────────────── */
  trustCard: {
    padding: 22,
    borderRadius: 26,
    borderWidth: 1,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
  },
  trustIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  trustTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  trustText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 5,
  },

  /* ── FINAL CTA ────────────────────────────────────── */
  finalCtaCard: {
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.28)",
    backgroundColor: "#0C0A1E",
    marginTop: 12,
  },
  finalCtaOrb: {
    position: "absolute",
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 9999,
    backgroundColor: "rgba(167,139,250,0.28)",
  },
  finalCtaOrb2: {
    position: "absolute",
    bottom: -160,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 9999,
    backgroundColor: "rgba(99,102,241,0.24)",
  },
  finalCtaBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  finalCtaContent: {
    padding: 36,
    alignItems: "center",
    gap: 14,
  },
  finalCtaIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.75,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    marginBottom: 8,
  },
  finalCtaEyebrow: {
    color: "#C4B5FD",
    fontSize: 10.5,
    fontWeight: "900",
    letterSpacing: 2.4,
  },
  finalCtaTitle: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -1.2,
    textAlign: "center",
    lineHeight: 38,
    marginTop: 4,
  },
  finalCtaTitleAccent: {
    color: "#C4B5FD",
  },
  finalCtaSub: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 520,
    marginTop: 4,
  },
  finalCtaButtons: {
    marginTop: 20,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  finalCtaPrimaryOuter: {
    borderRadius: 18,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.65,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  finalCtaPrimary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  finalCtaPrimaryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  finalCtaTrustRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  finalCtaTrustText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11.5,
    fontWeight: "600",
  },

  /* ── FOOTER ───────────────────────────────────────── */
  footer: {
    marginTop: 56,
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
    gap: 14,
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
  },
  footerLine: {
    width: "100%",
    height: 1,
    marginBottom: 20,
  },
  footerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  footerLogo: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7C3AED",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  footerBrandText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  footerText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 11,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});

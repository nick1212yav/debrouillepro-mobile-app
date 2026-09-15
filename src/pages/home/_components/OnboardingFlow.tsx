// src/pages/home/_components/OnboardingFlow.tsx
import {
  Pressable,
  View,
  Text,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  StyleSheet,
  Platform,
  useWindowDimensions,
  type ViewStyle,
  type TextStyle,
  type ImageStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { toast } from "sonner";
import { useBadges } from "@/hooks/use-badges.ts";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  Dumbbell,
  Factory,
  Globe2,
  GraduationCap,
  Home,
  Leaf,
  MapPin,
  Newspaper,
  Package,
  Plane,
  Radio,
  Scale,
  Search,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Tractor,
  TreePine,
  Truck,
  UserRound,
  Users,
  Wallet,
  Zap,
} from "lucide-react-native";
import Confetti, { useConfetti } from "@/components/Confetti.tsx";

/* ============================================================
   TYPES
============================================================ */

type Role = "particulier" | "professionnel" | "entreprise";

interface OnboardingData {
  city: string;
  country: string;
  role?: Role;
  interests: string[];
  favoriteModules: string[];
}

interface StepProps {
  data: OnboardingData;
  setData: (patch: Partial<OnboardingData>) => void;
}

/* ============================================================
   CONSTANTS
============================================================ */

const isBrowser = typeof window !== "undefined";

/* ============================================================
   COUNTRY ENGINE
============================================================ */

function getWorldCountries(): string[] {
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof (Intl as any).supportedValuesOf === "function"
    ) {
      return ((Intl as any).supportedValuesOf as (key: string) => string[])(
        "region",
      ).filter((code) => /^[A-Z]{2}$/.test(code));
    }
  } catch {}
  return [];
}

function getLanguage(): string {
  if (typeof navigator === "undefined") return "fr";
  return navigator.language?.split("-")[0]?.toLowerCase() || "fr";
}

function getCountryName(code: string): string {
  try {
    const language = getLanguage();
    const names = new Intl.DisplayNames([language], { type: "region" });
    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

function getFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "🌍";
  return String.fromCodePoint(
    ...code.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/* ============================================================
   ROLES
============================================================ */

const ROLES: {
  id: Role;
  label: string;
  desc: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  color: string;
  emoji: string;
}[] = [
  {
    id: "particulier",
    label: "Particulier",
    desc: "Pour ma vie personnelle et familiale",
    Icon: UserRound,
    color: "#60A5FA",
    emoji: "👤",
  },
  {
    id: "professionnel",
    label: "Professionnel",
    desc: "Freelance, artisan, indépendant",
    Icon: Briefcase,
    color: "#A78BFA",
    emoji: "💼",
  },
  {
    id: "entreprise",
    label: "Entreprise",
    desc: "PME, startup ou grande organisation",
    Icon: Factory,
    color: "#FBBF24",
    emoji: "🏢",
  },
];

/* ============================================================
   MODULES
============================================================ */

const MODULES: {
  id: string;
  label: string;
  description: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
  color: string;
  emoji: string;
}[] = [
  {
    id: "immo",
    label: "Immobilier",
    description: "Louer, acheter, vendre",
    Icon: Home,
    color: "#818CF8",
    emoji: "🏠",
  },
  {
    id: "jobs",
    label: "Emploi",
    description: "Jobs & opportunités",
    Icon: Briefcase,
    color: "#34D399",
    emoji: "💼",
  },
  {
    id: "sante",
    label: "Santé",
    description: "Soins & professionnels",
    Icon: Stethoscope,
    color: "#F87171",
    emoji: "❤️",
  },
  {
    id: "agri",
    label: "Agriculture",
    description: "Production & marché",
    Icon: Tractor,
    color: "#4ADE80",
    emoji: "🌾",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Mobilité & déplacements",
    Icon: Truck,
    color: "#60A5FA",
    emoji: "🚕",
  },
  {
    id: "apprendre",
    label: "Éducation",
    description: "Apprendre & progresser",
    Icon: GraduationCap,
    color: "#A78BFA",
    emoji: "📚",
  },
  {
    id: "paiement",
    label: "Paiement",
    description: "Payer & gérer",
    Icon: Wallet,
    color: "#FBBF24",
    emoji: "💳",
  },
  {
    id: "marketplace",
    label: "Marché",
    description: "Acheter & vendre",
    Icon: ShoppingBag,
    color: "#FB923C",
    emoji: "🛍️",
  },
  {
    id: "voyages",
    label: "Voyages",
    description: "Explorer le monde",
    Icon: Plane,
    color: "#2DD4BF",
    emoji: "✈️",
  },
  {
    id: "media",
    label: "Médias",
    description: "Actualités & contenus",
    Icon: Newspaper,
    color: "#F472B6",
    emoji: "📰",
  },
  {
    id: "fitness",
    label: "Fitness",
    description: "Sport & bien-être",
    Icon: Dumbbell,
    color: "#FB7185",
    emoji: "🏋️",
  },
  {
    id: "community",
    label: "Communauté",
    description: "Groupes & rencontres",
    Icon: Users,
    color: "#22D3EE",
    emoji: "👥",
  },
  {
    id: "energie",
    label: "Énergie",
    description: "Énergie & solutions",
    Icon: Zap,
    color: "#FACC15",
    emoji: "⚡",
  },
  {
    id: "environnement",
    label: "Environnement",
    description: "Agir durablement",
    Icon: TreePine,
    color: "#4ADE80",
    emoji: "🌿",
  },
  {
    id: "securite",
    label: "Sécurité",
    description: "Protection & prévention",
    Icon: Shield,
    color: "#818CF8",
    emoji: "🛡️",
  },
  {
    id: "juridique",
    label: "Justice",
    description: "Droit & accompagnement",
    Icon: Scale,
    color: "#C4B5FD",
    emoji: "⚖️",
  },
  {
    id: "evenements",
    label: "Événements",
    description: "Sorties & expériences",
    Icon: CalendarDays,
    color: "#F472B6",
    emoji: "🎫",
  },
  {
    id: "livraison",
    label: "Livraison",
    description: "Colis & courses",
    Icon: Package,
    color: "#FBBF24",
    emoji: "📦",
  },
  {
    id: "live",
    label: "Live",
    description: "Direct & actualités",
    Icon: Radio,
    color: "#FB7185",
    emoji: "📡",
  },
  {
    id: "parrainage",
    label: "Parrainage",
    description: "Inviter & gagner",
    Icon: Star,
    color: "#FB923C",
    emoji: "🎁",
  },
];

/* ============================================================
   STEP META
============================================================ */

const STEP_META = [
  {
    number: "01",
    Icon: Globe2,
    eyebrow: "LOCALISATION",
    title: "Votre monde.",
    subtitle:
      "Dites-nous où vous êtes pour vous montrer ce qui compte vraiment autour de vous.",
    color: "#60A5FA",
  },
  {
    number: "02",
    Icon: Users,
    eyebrow: "IDENTITÉ",
    title: "Votre profil.",
    subtitle:
      "DébrouillePro adapte son expérience à votre façon de vivre, travailler et entreprendre.",
    color: "#A78BFA",
  },
  {
    number: "03",
    Icon: Sparkles,
    eyebrow: "PERSONNALISATION",
    title: "Vos priorités.",
    subtitle: "Choisissez les univers que vous voulez voir en premier.",
    color: "#FBBF24",
  },
  {
    number: "04",
    Icon: Zap,
    eyebrow: "PRÊT",
    title: "Tout est prêt.",
    subtitle: "Votre expérience DébrouillePro vient d'être configurée.",
    color: "#34D399",
  },
];

/* ============================================================
   LOCATION ENGINE
============================================================ */

async function detectLocation(): Promise<{
  country?: string;
  city?: string;
}> {
  if (
    !isBrowser ||
    typeof navigator === "undefined" ||
    !navigator.geolocation
  ) {
    return {};
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 10 * 60 * 1000,
    });
  });

  const { latitude, longitude } = position.coords;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&zoom=10&addressdetails=1&lat=${encodeURIComponent(
      latitude,
    )}&lon=${encodeURIComponent(longitude)}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": getLanguage(),
      },
    },
  );

  if (!response.ok) throw new Error("Geocoding unavailable");

  const result = (await response.json()) as {
    address?: {
      country_code?: string;
      country?: string;
      city?: string;
      town?: string;
      municipality?: string;
      village?: string;
      state?: string;
    };
  };

  const address = result.address;

  return {
    country:
      address?.country ??
      (address?.country_code
        ? getCountryName(address.country_code.toUpperCase())
        : undefined),
    city:
      address?.city ??
      address?.town ??
      address?.municipality ??
      address?.village ??
      address?.state,
  };
}

/* ============================================================
   FADE UP WRAPPER
============================================================ */

function FadeUp({
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
    Animated.timing(anim, {
      toValue: 1,
      duration: 480,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
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

/* ============================================================
   AMBIENT BACKGROUND
============================================================ */

function AmbientBackground() {
  const { width: W, height: H } = useWindowDimensions();

  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

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
    loop(orbA, -50, 9000);
    loop(orbB, 60, 11000);
  }, [orbA, orbB]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={["#0A0616", "#130826", "#0D0519", "#1A0B2E"]}
        locations={[0, 0.4, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(360, W * 0.85),
            height: Math.max(360, W * 0.85),
            top: -160,
            left: -140,
            backgroundColor: "rgba(139,92,246,0.42)",
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
            right: -130,
            backgroundColor: "rgba(99,102,241,0.35)",
            transform: [{ translateY: orbB }],
          },
        ]}
      />
    </View>
  );
}

/* ============================================================
   STEP LOCATION
============================================================ */

function StepLocation({ data, setData }: StepProps) {
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [cityFocused, setCityFocused] = useState(false);
  const [queryFocused, setQueryFocused] = useState(false);

  const spinRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (detecting) {
      spinRotate.setValue(0);
      Animated.loop(
        Animated.timing(spinRotate, {
          toValue: 1,
          duration: 1100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [detecting, spinRotate]);

  const spinRotation = spinRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const countries = useMemo(() => {
    const codes = getWorldCountries();
    return codes
      .map((code) => ({
        code,
        name: getCountryName(code),
        flag: getFlag(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, getLanguage()));
  }, []);

  const filteredCountries = useMemo(() => {
    const q = normalize(query);
    if (!q) return countries;
    return countries.filter(
      (country) =>
        normalize(country.name).includes(q) ||
        normalize(country.code).includes(q),
    );
  }, [countries, query]);

  const detect = async () => {
    if (detecting) return;
    setDetecting(true);
    setLocationError(null);
    try {
      const result = await detectLocation();
      if (result.country) {
        setData({
          country: result.country,
          city: result.city ?? data.city,
        });
        toast.success("Localisation détectée");
      } else {
        toast.info("Choisissez votre pays manuellement.");
      }
    } catch {
      setLocationError(
        "La localisation automatique n'est pas disponible. Vous pouvez choisir votre pays manuellement.",
      );
    } finally {
      setDetecting(false);
    }
  };

  return (
    <View style={{ gap: 20 }}>
      {/* Detect location button */}
      <FadeUp>
        <Pressable
          onPress={() => void detect()}
          disabled={detecting}
          style={({ pressed }) => [
            styles.detectCard,
            pressed && styles.pressed,
            detecting && { opacity: 0.7 },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(96,165,250,0.18)",
              "rgba(15,7,32,0.6)",
              "rgba(10,6,24,0.85)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.detectBorder} pointerEvents="none" />
          <View style={styles.detectOrb} pointerEvents="none" />

          <View style={styles.detectRow}>
            <LinearGradient
              colors={["rgba(96,165,250,0.32)", "rgba(59,130,246,0.12)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detectIcon}
            >
              <Animated.View
                style={
                  detecting
                    ? { transform: [{ rotate: spinRotation }] }
                    : undefined
                }
              >
                <MapPin size={20} color="#93C5FD" strokeWidth={2.4} />
              </Animated.View>
            </LinearGradient>

            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.detectTitle}>
                {detecting
                  ? "Recherche de votre position…"
                  : "Détecter automatiquement"}
              </Text>
              <Text style={styles.detectSub}>
                Nous ne vous déplacerons jamais sans votre permission.
              </Text>
            </View>

            <ArrowRight size={17} color="rgba(255,255,255,0.4)" />
          </View>
        </Pressable>
      </FadeUp>

      {locationError ? (
        <FadeUp distance={8}>
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{locationError}</Text>
          </View>
        </FadeUp>
      ) : null}

      {/* City */}
      <FadeUp delay={80}>
        <Text style={styles.fieldLabel}>VOTRE VILLE</Text>
        <View
          style={[styles.inputWrap, cityFocused && styles.inputWrapFocusedBlue]}
        >
          <MapPin size={17} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={data.city}
            onChangeText={(v) => setData({ city: v })}
            onFocus={() => setCityFocused(true)}
            onBlur={() => setCityFocused(false)}
            placeholder="Dakar, Kinshasa, Paris, Montréal…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            autoCapitalize="words"
          />
        </View>
      </FadeUp>

      {/* Country search */}
      <FadeUp delay={140}>
        <Text style={styles.fieldLabel}>VOTRE PAYS</Text>
        <View
          style={[
            styles.inputWrap,
            queryFocused && styles.inputWrapFocusedBlue,
          ]}
        >
          <Search size={16} color="rgba(255,255,255,0.4)" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setQueryFocused(true)}
            onBlur={() => setQueryFocused(false)}
            placeholder="Rechercher un pays…"
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </FadeUp>

      {/* Country list */}
      <View style={{ maxHeight: 320 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ gap: 8, paddingRight: 4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredCountries.map((country, index) => {
            const selected = data.country === country.name;
            return (
              <FadeUp
                key={country.code}
                delay={Math.min(180 + index * 15, 500)}
                distance={8}
              >
                <Pressable
                  onPress={() => setData({ country: country.name })}
                  style={({ pressed }) => [
                    styles.countryRow,
                    selected && styles.countryRowSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text
                    style={[styles.countryName, selected && { color: "#fff" }]}
                    numberOfLines={1}
                  >
                    {country.name}
                  </Text>
                  {selected ? <CheckCircle2 size={16} color="#93C5FD" /> : null}
                </Pressable>
              </FadeUp>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

/* ============================================================
   STEP ROLE
============================================================ */

function StepRole({ data, setData }: StepProps) {
  return (
    <View style={{ gap: 12 }}>
      {ROLES.map((role, index) => {
        const { id, label, desc, Icon, color, emoji } = role;
        const selected = data.role === id;

        return (
          <FadeUp key={id} delay={index * 90} distance={14}>
            <Pressable
              onPress={() => setData({ role: id })}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  borderColor: selected
                    ? `${color}66`
                    : "rgba(255,255,255,0.08)",
                  backgroundColor: selected
                    ? `${color}14`
                    : "rgba(255,255,255,0.03)",
                },
                selected && {
                  shadowColor: color,
                  shadowOpacity: 0.28,
                  shadowRadius: 22,
                  shadowOffset: { width: 0, height: 12 },
                },
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <LinearGradient
                  colors={[`${color}20`, "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}

              <View style={styles.roleRow}>
                <LinearGradient
                  colors={
                    selected
                      ? [`${color}33`, `${color}10`]
                      : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.03)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.roleIcon,
                    {
                      borderColor: selected
                        ? `${color}55`
                        : "rgba(255,255,255,0.1)",
                    },
                  ]}
                >
                  <Text style={{ fontSize: 24 }}>{emoji}</Text>
                </LinearGradient>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={[styles.roleLabel, selected && { color: "#fff" }]}
                  >
                    {label}
                  </Text>
                  <Text style={styles.roleDesc}>{desc}</Text>
                </View>

                <View
                  style={[
                    styles.roleCheck,
                    {
                      backgroundColor: selected ? color : "transparent",
                      borderColor: selected ? color : "rgba(255,255,255,0.15)",
                    },
                  ]}
                >
                  {selected ? (
                    <Check size={14} color="#fff" strokeWidth={3.5} />
                  ) : null}
                </View>
              </View>
            </Pressable>
          </FadeUp>
        );
      })}

      <Text style={styles.roleHint}>
        Vous pourrez modifier votre profil plus tard.
      </Text>
    </View>
  );
}

/* ============================================================
   STEP MODULES
============================================================ */

function ModuleCard({
  module,
  selected,
  index,
  onToggle,
}: {
  module: (typeof MODULES)[number];
  selected: boolean;
  index: number;
  onToggle: () => void;
}) {
  const { label, description, Icon, color, emoji } = module;
  const scale = useRef(new Animated.Value(1)).current;
  const selectAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(selectAnim, {
      toValue: selected ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selected, selectAnim]);

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
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

  const borderColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.08)", `${color}77`],
  });
  const bgColor = selectAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0.03)", `${color}14`],
  });

  return (
    <FadeUp
      delay={Math.min(index * 25, 400)}
      distance={10}
      style={styles.moduleCardWrap}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onToggle}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
        >
          <Animated.View
            style={[
              styles.moduleCard,
              { borderColor, backgroundColor: bgColor },
              selected && {
                shadowColor: color,
                shadowOpacity: 0.35,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 12 },
              },
            ]}
          >
            {selected ? (
              <LinearGradient
                colors={[`${color}22`, "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : null}

            {selected ? (
              <View
                style={[styles.moduleCheckBadge, { backgroundColor: color }]}
              >
                <Check size={11} color="#fff" strokeWidth={3.5} />
              </View>
            ) : null}

            <View
              style={[
                styles.moduleIcon,
                {
                  backgroundColor: selected
                    ? `${color}28`
                    : "rgba(255,255,255,0.06)",
                  borderColor: selected
                    ? `${color}55`
                    : "rgba(255,255,255,0.1)",
                },
              ]}
            >
              <Icon
                size={19}
                color={selected ? color : "rgba(255,255,255,0.55)"}
              />
            </View>

            <Text style={[styles.moduleLabel, selected && { color: "#fff" }]}>
              {label}
            </Text>

            <Text style={styles.moduleDesc}>{description}</Text>

            <Text style={styles.moduleEmoji}>{emoji}</Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </FadeUp>
  );
}

function StepModules({ data, setData }: StepProps) {
  const toggle = (id: string) => {
    const selected = data.favoriteModules.includes(id);
    const next = selected
      ? data.favoriteModules.filter((m) => m !== id)
      : [...data.favoriteModules, id];
    setData({ favoriteModules: next });
  };

  const count = data.favoriteModules.length;
  const hasEnough = count >= 3;

  return (
    <View style={{ gap: 16 }}>
      {/* Counter */}
      <FadeUp>
        <View style={styles.counterCard}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.counterTitle}>Votre sélection</Text>
            <Text style={styles.counterSub}>
              Choisissez au minimum 3 univers
            </Text>
          </View>
          <View
            style={[
              styles.counterBadge,
              {
                backgroundColor: hasEnough
                  ? "rgba(52,211,153,0.18)"
                  : "rgba(251,191,36,0.16)",
                borderColor: hasEnough
                  ? "rgba(52,211,153,0.4)"
                  : "rgba(251,191,36,0.35)",
              },
            ]}
          >
            <Text
              style={[
                styles.counterBadgeText,
                {
                  color: hasEnough ? "#6EE7B7" : "#FCD34D",
                },
              ]}
            >
              {count}
            </Text>
          </View>
        </View>
      </FadeUp>

      {/* Grid */}
      <View style={styles.moduleGrid}>
        {MODULES.map((module, index) => (
          <ModuleCard
            key={module.id}
            module={module}
            index={index}
            selected={data.favoriteModules.includes(module.id)}
            onToggle={() => toggle(module.id)}
          />
        ))}
      </View>

      {/* Warning */}
      {!hasEnough ? (
        <FadeUp distance={6}>
          <View style={styles.warnRow}>
            <View style={styles.warnDot} />
            <Text style={styles.warnText}>
              Encore {3 - count} sélection{3 - count > 1 ? "s" : ""} pour
              continuer.
            </Text>
          </View>
        </FadeUp>
      ) : null}
    </View>
  );
}

/* ============================================================
   STEP FINISH
============================================================ */

function StepFinish({ data }: { data: OnboardingData }) {
  const selected = data.favoriteModules
    .map((id) => MODULES.find((m) => m.id === id))
    .filter(Boolean) as typeof MODULES;

  const popAnim = useRef(new Animated.Value(0)).current;
  const ringPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(popAnim, {
      toValue: 1,
      stiffness: 220,
      damping: 16,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ringPulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(ringPulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [popAnim, ringPulse]);

  const checkScale = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const checkRotate = popAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-20deg", "0deg"],
  });
  const ringScale = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });
  const ringOpacity = ringPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.15],
  });

  return (
    <View style={styles.finishWrap}>
      <Animated.View
        style={{
          transform: [{ scale: checkScale }, { rotate: checkRotate }],
        }}
      >
        <View style={styles.finishIconWrap}>
          <LinearGradient
            colors={["#34D399", "#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.finishIconGradient}
          >
            <CheckCircle2 size={54} color="#fff" strokeWidth={1.7} />
          </LinearGradient>
          <Animated.View
            style={[
              styles.finishRing,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
            pointerEvents="none"
          />
        </View>
      </Animated.View>

      <FadeUp delay={180}>
        <Text style={styles.finishTitle}>
          Bienvenue dans votre nouveau monde.
        </Text>
        <Text style={styles.finishSub}>
          {data.city && data.country
            ? `${data.city}, ${data.country}`
            : data.country || "Votre expérience personnalisée est prête."}
        </Text>
      </FadeUp>

      <FadeUp delay={320} distance={10}>
        <View style={styles.rewardCard}>
          <LinearGradient
            colors={["rgba(251,191,36,0.2)", "rgba(15,7,32,0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.rewardBorder} pointerEvents="none" />
          <LinearGradient
            colors={["rgba(251,191,36,0.32)", "rgba(245,158,11,0.1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rewardIcon}
          >
            <Zap size={18} color="#FBBF24" fill="#FBBF24" />
          </LinearGradient>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.rewardEyebrow}>RÉCOMPENSE</Text>
            <Text style={styles.rewardTitle}>+100 XP de bienvenue</Text>
          </View>
        </View>
      </FadeUp>

      {selected.length > 0 ? (
        <FadeUp delay={440} distance={10}>
          <View style={styles.selectedCard}>
            <LinearGradient
              colors={["rgba(167,139,250,0.14)", "rgba(15,7,32,0.6)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.selectedBorder} pointerEvents="none" />
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>VOS UNIVERS</Text>
              <Sparkles size={14} color="#C4B5FD" />
            </View>
            <View style={styles.selectedChips}>
              {selected.slice(0, 8).map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.selectedChip,
                    {
                      backgroundColor: `${m.color}18`,
                      borderColor: `${m.color}44`,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 11 }}>{m.emoji}</Text>
                  <Text style={[styles.selectedChipText, { color: m.color }]}>
                    {m.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>
      ) : null}

      <FadeUp delay={520}>
        <Text style={styles.finishFooter}>
          DébrouillePro va maintenant personnaliser votre expérience à partir de
          vos choix.
        </Text>
      </FadeUp>
    </View>
  );
}

/* ============================================================
   MAIN FLOW
============================================================ */

const STEP_COUNT = 4;

export default function OnboardingFlow({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [data, setData] = useState<OnboardingData>({
    city: "",
    country: "",
    role: undefined,
    interests: [],
    favoriteModules: [],
  });

  const { fire, confetti: confettiEl } = useConfetti();
  const { user } = useFirebaseAuth();
  const email = user?.email;

  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const { checkBadges, awardXp } = useBadges();

  /* ───── animations ───── */
  const progressAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;
  const loadingRotate = useRef(new Animated.Value(0)).current;

  /* ───── patch ───── */
  const patchData = useCallback((patch: Partial<OnboardingData>) => {
    setData((current) => ({ ...current, ...patch }));
  }, []);

  /* ───── validation ───── */
  const canNext = useMemo(() => {
    if (step === 0) {
      return data.city.trim().length > 0 && data.country.trim().length > 0;
    }
    if (step === 1) return Boolean(data.role);
    if (step === 2) return data.favoriteModules.length >= 3;
    return true;
  }, [data, step]);

  /* ───── navigation ───── */
  const next = useCallback(() => {
    if (!canNext || loading) return;
    setStep((c) => Math.min(c + 1, STEP_COUNT - 1));
  }, [canNext, loading]);

  const prev = useCallback(() => {
    if (loading) return;
    setStep((c) => Math.max(c - 1, 0));
  }, [loading]);

  /* ───── finish ───── */
  const finish = useCallback(async () => {
    if (loading) return;
    if (!email) {
      toast.error("Utilisateur non connecté");
      return;
    }
    setLoading(true);
    try {
      fire();
      const roles = data.role ? [data.role] : ["particulier"];
      const interests =
        data.interests.length > 0 ? data.interests : data.favoriteModules;

      await completeOnboarding({
        email,
        city: data.city.trim(),
        country: data.country.trim(),
        roles,
        interests,
      });

      await awardXp(100, "Onboarding complété", "onboarding").catch(() => null);
      await checkBadges("onboarding_completed").catch(() => null);

      await new Promise((r) => setTimeout(r, 850));
      onComplete();
    } catch (error) {
      console.error("Onboarding completion error:", error);
      toast.error(
        "Impossible de terminer la configuration. Vérifiez votre connexion puis réessayez.",
      );
      setLoading(false);
    }
  }, [
    awardXp,
    checkBadges,
    completeOnboarding,
    data,
    email,
    fire,
    loading,
    onComplete,
  ]);

  /* ───── keyboard (web only) ───── */
  useEffect(() => {
    if (!isBrowser) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return;
      if (event.key === "Enter" && canNext && !loading) {
        event.preventDefault();
        if (step === STEP_COUNT - 1) void finish();
        else next();
      }
      if (event.key === "ArrowLeft" && step > 0 && !loading) {
        event.preventDefault();
        prev();
      }
      if (event.key === "ArrowRight" && canNext && !loading) {
        event.preventDefault();
        if (step < STEP_COUNT - 1) next();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canNext, finish, loading, next, prev, step]);

  /* ───── progress bar anim ───── */
  useEffect(() => {
    const progress = ((step + 1) / STEP_COUNT) * 100;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [step, progressAnim]);

  /* ───── title entrance ───── */
  useEffect(() => {
    titleAnim.setValue(0);
    Animated.timing(titleAnim, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, titleAnim]);

  /* ───── content cross-fade ───── */
  useEffect(() => {
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, contentAnim]);

  /* ───── shine sweep on CTA ───── */
  useEffect(() => {
    if (canNext && !loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shineAnim, {
            toValue: 1,
            duration: 2600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(shineAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      shineAnim.setValue(0);
    }
  }, [canNext, loading, shineAnim]);

  /* ───── loading spinner ───── */
  useEffect(() => {
    if (loading) {
      loadingRotate.setValue(0);
      Animated.loop(
        Animated.timing(loadingRotate, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    }
  }, [loading, loadingRotate]);

  const meta = STEP_META[step];
  const MetaIcon = meta.Icon;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const titleTranslateY = titleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const contentTranslateX = contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  const shineTranslateX = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 460],
  });

  const loadingRotation = loadingRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.root}>
      {confettiEl}
      <AmbientBackground />

      {/* Top ambient glow per step */}
      <View style={styles.topGlowWrap} pointerEvents="none">
        <LinearGradient
          colors={[`${meta.color}33`, "rgba(0,0,0,0)"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1, borderRadius: 999 }}
        />
      </View>

      {/* ═══════════ HEADER ═══════════ */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? 44 : 54 },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={prev}
            disabled={step === 0 || loading}
            hitSlop={8}
            style={({ pressed }) => [
              styles.backBtn,
              (step === 0 || loading) && { opacity: 0 },
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Étape précédente"
          >
            <ArrowLeft size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>

          <View style={styles.brandRow}>
            <LinearGradient
              colors={["#A78BFA", "#7C3AED", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandIcon}
            >
              <Globe2 size={16} color="#fff" strokeWidth={2.4} />
            </LinearGradient>
            <Text style={styles.brandText}>
              Débrouille<Text style={{ color: "#C4B5FD" }}>Pro</Text>
            </Text>
          </View>

          <View style={styles.stepCounter}>
            <Text style={styles.stepCounterText}>
              {String(step + 1).padStart(2, "0")}/
              {String(STEP_COUNT).padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressWidth,
                backgroundColor: meta.color,
                shadowColor: meta.color,
              },
            ]}
          />
        </View>
      </View>

      {/* ═══════════ TITLE BLOCK ═══════════ */}
      <Animated.View
        style={[
          styles.titleBlock,
          { opacity: titleAnim, transform: [{ translateY: titleTranslateY }] },
        ]}
      >
        <View
          style={[
            styles.titleIconWrap,
            {
              backgroundColor: `${meta.color}22`,
              borderColor: `${meta.color}44`,
              shadowColor: meta.color,
            },
          ]}
        >
          <MetaIcon size={24} color={meta.color} />
        </View>
        <Text style={[styles.titleEyebrow, { color: `${meta.color}DD` }]}>
          {meta.number} · {meta.eyebrow}
        </Text>
        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.titleSub}>{meta.subtitle}</Text>
      </Animated.View>

      {/* ═══════════ CONTENT ═══════════ */}
      <Animated.View
        style={[
          styles.contentWrap,
          {
            opacity: contentAnim,
            transform: [{ translateX: contentTranslateX }],
          },
        ]}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.contentScroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 ? <StepLocation data={data} setData={patchData} /> : null}
          {step === 1 ? <StepRole data={data} setData={patchData} /> : null}
          {step === 2 ? <StepModules data={data} setData={patchData} /> : null}
          {step === 3 ? <StepFinish data={data} /> : null}
        </ScrollView>
      </Animated.View>

      {/* ═══════════ FOOTER CTA ═══════════ */}
      <View style={styles.footer}>
        <Pressable
          onPress={step === STEP_COUNT - 1 ? () => void finish() : next}
          disabled={!canNext || loading}
          accessibilityRole="button"
          accessibilityLabel={
            step === STEP_COUNT - 1 ? "Entrer dans DébrouillePro" : "Continuer"
          }
          style={({ pressed }) => [
            styles.ctaOuter,
            (!canNext || loading) && styles.ctaOuterDisabled,
            pressed && canNext && !loading && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={
              canNext
                ? [meta.color, `${meta.color}DD`, `${meta.color}BB`]
                : ["#22203A", "#1A1828"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaGradient}
          >
            {canNext && !loading ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ctaShine,
                  {
                    transform: [
                      { translateX: shineTranslateX },
                      { skewX: "-20deg" },
                    ],
                  },
                ]}
              />
            ) : null}

            <Text style={styles.ctaText}>
              {loading
                ? "Préparation de votre espace…"
                : step === STEP_COUNT - 1
                  ? "Entrer dans DébrouillePro"
                  : "Continuer"}
            </Text>

            {loading ? (
              <Animated.View
                style={{ transform: [{ rotate: loadingRotation }] }}
              >
                <Sparkles size={18} color="#fff" />
              </Animated.View>
            ) : step === STEP_COUNT - 1 ? (
              <CheckCircle2 size={18} color="#fff" strokeWidth={2.4} />
            ) : (
              <ArrowRight size={18} color="#fff" strokeWidth={2.4} />
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.footerNote}>
          <View style={styles.footerDot} />
          <Text style={styles.footerNoteText}>
            Vos préférences sont enregistrées de manière sécurisée
          </Text>
          <View style={styles.footerDot} />
        </View>
      </View>
    </View>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A0616",
  },

  orb: {
    position: "absolute",
    borderRadius: 9999,
  },

  pressed: { opacity: 0.85 },

  topGlowWrap: {
    position: "absolute",
    top: -120,
    left: "15%",
    right: "15%",
    height: 220,
    opacity: 0.9,
  },

  /* ── Header ─────────────────────────────────────── */
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  brandIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  brandText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  stepCounter: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stepCounterText: {
    fontSize: 10,
    fontWeight: "900",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 1,
  },
  progressTrack: {
    marginTop: 14,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    shadowOpacity: 0.7,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },

  /* ── Title block ────────────────────────────────── */
  titleBlock: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    zIndex: 10,
  },
  titleIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOpacity: 0.55,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    marginBottom: 14,
  },
  titleEyebrow: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 3,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    textAlign: "center",
  },
  titleSub: {
    marginTop: 8,
    maxWidth: 380,
    fontSize: 12.5,
    lineHeight: 19,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
    fontWeight: "500",
  },

  /* ── Content ────────────────────────────────────── */
  contentWrap: {
    flex: 1,
    zIndex: 10,
  },
  contentScroll: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  /* ── Detect card ────────────────────────────────── */
  detectCard: {
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(10,6,24,0.5)",
    padding: 16,
  },
  detectBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.28)",
  },
  detectOrb: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 9999,
    backgroundColor: "rgba(96,165,250,0.2)",
  },
  detectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  detectIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
  },
  detectTitle: {
    fontSize: 13.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.2,
  },
  detectSub: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  /* ── Error box ──────────────────────────────────── */
  errorBox: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.18)",
  },
  errorBoxText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: "rgba(252,211,77,0.85)",
    fontWeight: "500",
  },

  /* ── Field label / input ────────────────────────── */
  fieldLabel: {
    marginBottom: 8,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  inputWrapFocusedBlue: {
    borderColor: "rgba(96,165,250,0.55)",
    backgroundColor: "rgba(96,165,250,0.08)",
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 14,
    color: "#fff",
    fontWeight: "500",
  },

  /* ── Country row ────────────────────────────────── */
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  countryRowSelected: {
    backgroundColor: "rgba(96,165,250,0.18)",
    borderColor: "rgba(96,165,250,0.5)",
  },
  countryFlag: {
    fontSize: 20,
  },
  countryName: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    fontWeight: "800",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: -0.1,
  },

  /* ── Role card ──────────────────────────────────── */
  roleCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    overflow: "hidden",
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: -0.3,
  },
  roleDesc: {
    marginTop: 4,
    fontSize: 11.5,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },
  roleCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  roleHint: {
    textAlign: "center",
    fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "500",
    marginTop: 4,
  },

  /* ── Module grid ────────────────────────────────── */
  counterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  counterTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: -0.2,
  },
  counterSub: {
    marginTop: 2,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  counterBadge: {
    minWidth: 40,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  counterBadgeText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  moduleCardWrap: {
    flexBasis: "48%",
    flexGrow: 1,
    minWidth: 140,
  },
  moduleCard: {
    minHeight: 132,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
  },
  moduleCheckBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 12,
  },
  moduleLabel: {
    fontSize: 12.5,
    fontWeight: "900",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: -0.2,
  },
  moduleDesc: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    fontWeight: "500",
  },
  moduleEmoji: {
    position: "absolute",
    bottom: 10,
    right: 12,
    fontSize: 16,
    opacity: 0.75,
  },
  warnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  warnDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FCD34D",
  },
  warnText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(252,211,77,0.75)",
  },

  /* ── Finish ─────────────────────────────────────── */
  finishWrap: {
    alignItems: "center",
    gap: 20,
    paddingTop: 4,
  },
  finishIconWrap: {
    width: 112,
    height: 112,
    borderRadius: 36,
    position: "relative",
  },
  finishIconGradient: {
    width: 112,
    height: 112,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#10B981",
    shadowOpacity: 0.7,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
  },
  finishRing: {
    position: "absolute",
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: "rgba(52,211,153,0.5)",
  },
  finishTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -1,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  finishSub: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 20,
  },
  rewardCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.32)",
    marginTop: 6,
  },
  rewardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)",
  },
  rewardEyebrow: {
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.6,
    color: "rgba(251,191,36,0.7)",
  },
  rewardTitle: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "900",
    color: "#FCD34D",
    letterSpacing: -0.3,
  },
  selectedCard: {
    width: "100%",
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.25)",
  },
  selectedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  selectedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  selectedTitle: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.4)",
  },
  selectedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  selectedChipText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.1,
  },
  finishFooter: {
    maxWidth: 340,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    fontWeight: "500",
    marginTop: 4,
  },

  /* ── Footer ─────────────────────────────────────── */
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === "android" ? 20 : 30,
    zIndex: 10,
  },
  ctaOuter: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  ctaOuterDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 20,
    overflow: "hidden",
  },
  ctaShine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "rgba(255,255,255,0.22)",
    opacity: 0.85,
  },
  ctaText: {
    fontSize: 14.5,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.2,
  },
  footerNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 12,
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(52,211,153,0.6)",
  },
  footerNoteText: {
    fontSize: 9.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.1,
  },
});

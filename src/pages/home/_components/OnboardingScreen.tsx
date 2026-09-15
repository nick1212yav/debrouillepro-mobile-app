// src/pages/home/_components/OnboardingScreen.tsx
import {
  Pressable,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
  StatusBar,
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
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  BriefcaseBusiness,
  Bus,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Globe2,
  HeartPulse,
  Leaf,
  MapPin,
  MessageCircle,
  Newspaper,
  Package,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
  Zap,
} from "lucide-react-native";

const ONBOARDING_KEY = "debrouille_onboarding_done";
const ONBOARDING_PROFILE_KEY = "debrouille_onboarding_profile";

// ── TYPES ────────────────────────────────────────────────────────────────
interface OnboardingProfile {
  countryCode: string;
  countryName: string;
  city: string;
  modules: string[];
  firstName: string;
  completedAt: number;
}

interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

interface CityOption {
  name: string;
  countryCode: string;
  countryName: string;
  latitude?: number;
  longitude?: number;
}

interface ModuleDefinition {
  id: string;
  label: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    color?: string;
    style?: ViewStyle | TextStyle | ImageStyle;
  }>;
  accent: string;
  accentSoft: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
  onSaveProfile?: (profile: OnboardingProfile) => Promise<void>;
}

// ── DATA ─────────────────────────────────────────────────────────────────
const MODULES: ModuleDefinition[] = [
  {
    id: "immo",
    label: "Immobilier",
    description: "Louer, acheter, vendre",
    icon: Building2,
    accent: "#FB923C",
    accentSoft: "#FB923C22",
  },
  {
    id: "jobs",
    label: "Emploi & Pro",
    description: "Jobs, missions, freelance",
    icon: BriefcaseBusiness,
    accent: "#A78BFA",
    accentSoft: "#A78BFA22",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Déplacements & mobilité",
    icon: Bus,
    accent: "#60A5FA",
    accentSoft: "#60A5FA22",
  },
  {
    id: "sante",
    label: "Santé",
    description: "Soins & professionnels",
    icon: HeartPulse,
    accent: "#F87171",
    accentSoft: "#F8717122",
  },
  {
    id: "paiement",
    label: "Paiements",
    description: "Payer & gérer son argent",
    icon: WalletCards,
    accent: "#34D399",
    accentSoft: "#34D39922",
  },
  {
    id: "livraison",
    label: "Livraison",
    description: "Colis & courses",
    icon: Package,
    accent: "#FBBF24",
    accentSoft: "#FBBF2422",
  },
  {
    id: "agri",
    label: "Agriculture",
    description: "Production & opportunités",
    icon: Leaf,
    accent: "#4ADE80",
    accentSoft: "#4ADE8022",
  },
  {
    id: "media",
    label: "Médias",
    description: "Actualités & contenus",
    icon: Newspaper,
    accent: "#22D3EE",
    accentSoft: "#22D3EE22",
  },
  {
    id: "evenements",
    label: "Événements",
    description: "Sorties & expériences",
    icon: CalendarDays,
    accent: "#F472B6",
    accentSoft: "#F472B622",
  },
  {
    id: "voyages",
    label: "Voyages",
    description: "Explorer le monde",
    icon: Plane,
    accent: "#818CF8",
    accentSoft: "#818CF822",
  },
  {
    id: "community",
    label: "Communauté",
    description: "Groupes & discussions",
    icon: MessageCircle,
    accent: "#C084FC",
    accentSoft: "#C084FC22",
  },
  {
    id: "sos",
    label: "SOS",
    description: "Aide & urgences",
    icon: ShieldCheck,
    accent: "#EF4444",
    accentSoft: "#EF444422",
  },
];

const DEFAULT_MODULES = ["immo", "jobs", "paiement", "sante"];

const WELCOME_CHIPS = [
  { icon: Building2, label: "Habitat", color: "#FB923C" },
  { icon: BriefcaseBusiness, label: "Travail", color: "#A78BFA" },
  { icon: HeartPulse, label: "Santé", color: "#F87171" },
  { icon: WalletCards, label: "Finance", color: "#34D399" },
  { icon: Plane, label: "Voyage", color: "#818CF8" },
  { icon: MessageCircle, label: "Communauté", color: "#C084FC" },
];

/* ============================================================
 * STORAGE HELPERS — 100% safe, cross-platform (RN + web)
 * ============================================================ */

/**
 * Récupère un objet storage compatible (`localStorage`) depuis `globalThis`.
 * Renvoie `null` si :
 *   - `globalThis` n'existe pas
 *   - `localStorage` n'est pas défini
 *   - `localStorage` n'a pas de méthode `getItem` (polyfill incomplet)
 *   - l'accès throw (permissions, sandbox, etc.)
 *
 * Aucun accès direct à `window` ou `localStorage` : tout passe par
 * `globalThis` + try/catch, ce qui évite le crash
 * `ReferenceError: Property 'localStorage' doesn't exist` sur RN.
 */
function getStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const s = (globalThis as { localStorage?: Storage }).localStorage;
    if (!s) return null;
    if (typeof s.getItem !== "function") return null;
    return s;
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding(): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    return storage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(ONBOARDING_KEY, "true");
  } catch {
    /* noop */
  }
}

function saveLocalProfile(profile: OnboardingProfile): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* noop */
  }
}

/* ─────────── Autres helpers (inchangés) ─────────── */

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function countryFlag(code: string): string {
  const normalized = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) return "🌍";
  return String.fromCodePoint(
    ...normalized.split("").map((c) => 127397 + c.charCodeAt(0)),
  );
}

function detectLanguage(): string {
  try {
    if (typeof globalThis === "undefined") return "fr";
    const nav = (globalThis as { navigator?: { language?: string } }).navigator;
    return nav?.language?.split("-")[0]?.toLowerCase() || "fr";
  } catch {
    return "fr";
  }
}

function getCountryDisplayName(code: string, language: string): string {
  try {
    const dn = new Intl.DisplayNames([language], { type: "region" });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

function getAvailableCountryCodes(): string[] {
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.supportedValuesOf === "function"
    ) {
      const values = (
        Intl.supportedValuesOf as unknown as (k: string) => string[]
      )("region");
      return values.filter((v) => /^[A-Z]{2}$/.test(v)).sort();
    }
  } catch {}
  return [];
}

// ── LOCATION API (inchangé) ──────────────────────────────────────────────
async function reverseGeocode(latitude: number, longitude: number) {
  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=json&lat=${encodeURIComponent(latitude)}` +
    `&lon=${encodeURIComponent(longitude)}` +
    "&zoom=10&addressdetails=1";
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": detectLanguage(),
    },
  });
  if (!res.ok) throw new Error("Reverse geocoding unavailable");
  const data = (await res.json()) as {
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
  const a = data.address;
  return {
    countryCode: a?.country_code?.toUpperCase(),
    countryName: a?.country,
    city: a?.city ?? a?.town ?? a?.municipality ?? a?.village ?? a?.state,
  };
}

async function searchCities(
  query: string,
  countryCode: string,
): Promise<CityOption[]> {
  if (query.trim().length < 2) return [];
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&addressdetails=1&limit=8` +
    `&q=${encodeURIComponent(query)}` +
    `&countrycodes=${encodeURIComponent(countryCode.toLowerCase())}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": detectLanguage(),
    },
  });
  if (!res.ok) throw new Error("City search unavailable");
  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: {
      city?: string;
      town?: string;
      municipality?: string;
      village?: string;
      state?: string;
      country?: string;
      country_code?: string;
    };
  }>;
  return data
    .map((item) => {
      const a = item.address;
      return {
        name:
          a?.city ??
          a?.town ??
          a?.municipality ??
          a?.village ??
          a?.state ??
          item.display_name.split(",")[0],
        countryCode: a?.country_code?.toUpperCase() ?? countryCode,
        countryName: a?.country ?? "",
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      };
    })
    .filter(
      (item, i, arr) =>
        arr.findIndex(
          (c) => normalizeText(c.name) === normalizeText(item.name),
        ) === i,
    );
}

// ── LOCATION HOOK ────────────────────────────────────────────────────────
function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    try {
      if (typeof globalThis === "undefined") {
        setLocationError(
          "La géolocalisation n'est pas disponible sur cet appareil.",
        );
        return null;
      }
      const nav = (
        globalThis as {
          navigator?: { geolocation?: Geolocation };
        }
      ).navigator;
      if (!nav?.geolocation) {
        setLocationError(
          "La géolocalisation n'est pas disponible sur cet appareil.",
        );
        return null;
      }
      setLocating(true);
      setLocationError(null);
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            nav.geolocation!.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000,
            });
          },
        );
        return await reverseGeocode(
          position.coords.latitude,
          position.coords.longitude,
        );
      } catch {
        setLocationError(
          "Impossible de déterminer votre position. Vous pouvez la choisir manuellement.",
        );
        return null;
      } finally {
        setLocating(false);
      }
    } catch {
      setLocationError(
        "Impossible de déterminer votre position. Vous pouvez la choisir manuellement.",
      );
      return null;
    }
  }, []);

  return { locate, locating, locationError };
}

// ── BACKGROUND — dégradé plein écran + orbes animées ─────────────────────
function AnimatedBackground() {
  const { height: H, width: W } = useWindowDimensions();

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
    loop(orb1, -60, 7000);
    loop(orb2, 70, 9000);
    loop(orb3, -50, 8000);
    loop(orb4, 55, 10000);
  }, [orb1, orb2, orb3, orb4]);

  return (
    <View
      pointerEvents="none"
      collapsable={false}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <LinearGradient
        colors={["#0B0620", "#1A0B3D", "#0F0525", "#17093A"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, width: "100%", height: "100%" }}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(320, W * 0.9),
            height: Math.max(320, W * 0.9),
            top: -120,
            left: -100,
            backgroundColor: "rgba(139,92,246,0.5)",
            transform: [{ translateY: orb1 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 300,
            height: 300,
            top: H * 0.28,
            right: -120,
            backgroundColor: "rgba(99,102,241,0.42)",
            transform: [{ translateY: orb2 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 340,
            height: 340,
            bottom: H * 0.05,
            left: -120,
            backgroundColor: "rgba(168,85,247,0.4)",
            transform: [{ translateY: orb3 }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: 320,
            height: 320,
            bottom: -120,
            right: -100,
            backgroundColor: "rgba(124,58,237,0.45)",
            transform: [{ translateY: orb4 }],
          },
        ]}
      />
    </View>
  );
}

// ── UI PRIMITIVES (inchangé) ─────────────────────────────────────────────
function GlassIconButton({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={10}
      style={({ pressed }) => [
        styles.glassIconButton,
        pressed && { opacity: 0.7, transform: [{ scale: 0.94 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

function GradientButton({
  children,
  onPress,
  disabled,
  loading,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
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

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }], width: "100%" }}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: isDisabled }}
        style={styles.gradientButtonOuter}
      >
        <LinearGradient
          colors={
            isDisabled
              ? ["#3A3550", "#2B2740"]
              : ["#8B5CF6", "#6366F1", "#A855F7"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          {loading ? <ActivityIndicator size="small" color="#fff" /> : children}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {Array.from({ length: total }, (_, i) => i + 1).map((item) => {
        const active = current === item;
        const complete = current > item;
        return (
          <View
            key={item}
            style={{
              height: 6,
              width: active ? 28 : 7,
              borderRadius: 3,
              opacity: complete || active ? 1 : 0.3,
              backgroundColor: complete ? "#34D399" : "#A78BFA",
            }}
          />
        );
      })}
    </View>
  );
}

function SectionTitle({
  icon,
  eyebrow,
  title,
  subtitle,
  accent,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <View style={{ paddingTop: 20, paddingBottom: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginBottom: 6,
        }}
      >
        {icon}
        <Text
          style={{
            fontSize: 11,
            fontWeight: "800",
            letterSpacing: 1.6,
            color: accent,
          }}
        >
          {eyebrow.toUpperCase()}
        </Text>
      </View>
      <Text
        style={{
          fontSize: 26,
          fontWeight: "900",
          color: "#fff",
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: 6,
          fontSize: 14,
          lineHeight: 20,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        {subtitle}
      </Text>
    </View>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
      }}
    >
      <View style={styles.summaryIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 10,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "700",
            color: "rgba(255,255,255,0.9)",
          }}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

// ── MAIN COMPONENT (inchangé sauf helpers) ───────────────────────────────
export default function OnboardingScreen({
  onComplete,
  onSaveProfile,
}: OnboardingScreenProps) {
  const [step, setStep] = useState(0);
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [city, setCity] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [cityOptions, setCityOptions] = useState<CityOption[]>([]);
  const [selectedModules, setSelectedModules] =
    useState<string[]>(DEFAULT_MODULES);
  const [firstName, setFirstName] = useState("");
  const [saving, setSaving] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  const { locate, locating, locationError } = useDeviceLocation();
  const language = detectLanguage();

  const heroAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    heroAnim.setValue(0);
    contentAnim.setValue(0);
    Animated.sequence([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [step, heroAnim, contentAnim]);

  const countries = useMemo<CountryOption[]>(() => {
    const codes = getAvailableCountryCodes();
    return codes
      .map((code) => ({
        code,
        name: getCountryDisplayName(code, language),
        flag: countryFlag(code),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, language));
  }, [language]);

  const filteredCountries = useMemo(() => {
    const q = normalizeText(countrySearch);
    if (!q) return countries;
    return countries.filter((c) => normalizeText(c.name).includes(q));
  }, [countries, countrySearch]);

  useEffect(() => {
    let cancelled = false;
    void locate().then((result) => {
      if (cancelled || !result?.countryCode) return;
      setCountryCode(result.countryCode);
      setCountryName(
        result.countryName ??
          getCountryDisplayName(result.countryCode, language),
      );
      if (result.city) setCity(result.city);
      setLocationNotice(
        "Votre position a été détectée. Vous pouvez la modifier.",
      );
    });
    return () => {
      cancelled = true;
    };
  }, [language, locate]);

  useEffect(() => {
    if (!countryCode || citySearch.trim().length < 2) {
      setCityOptions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setCityLoading(true);
      void searchCities(citySearch, countryCode)
        .then((r) => {
          if (!controller.signal.aborted) setCityOptions(r);
        })
        .catch(() => {
          if (!controller.signal.aborted) setCityOptions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setCityLoading(false);
        });
    }, 350);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [citySearch, countryCode]);

  const totalSteps = 3;
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);
  const canContinue =
    step === 1
      ? Boolean(countryCode)
      : step === 2
        ? selectedModules.length > 0
        : true;

  const goNext = useCallback(() => {
    if (!canContinue || step >= totalSteps) return;
    setStep((v) => v + 1);
  }, [canContinue, step]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    setStep((v) => v - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    markOnboardingDone();
    onComplete();
  }, [onComplete]);

  const toggleModule = useCallback((id: string) => {
    setSelectedModules((cur) =>
      cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id],
    );
  }, []);

  const handleCountrySelect = useCallback((c: CountryOption) => {
    setCountryCode(c.code);
    setCountryName(c.name);
    setCity("");
    setCitySearch("");
    setCityOptions([]);
  }, []);

  const handleUseLocation = useCallback(() => {
    void locate().then((result) => {
      if (!result?.countryCode) return;
      setCountryCode(result.countryCode);
      setCountryName(
        result.countryName ??
          getCountryDisplayName(result.countryCode, language),
      );
      if (result.city) setCity(result.city);
      setLocationNotice("Position détectée avec succès.");
    });
  }, [language, locate]);

  const handleComplete = useCallback(async () => {
    if (saving) return;
    const profile: OnboardingProfile = {
      countryCode,
      countryName,
      city: city.trim(),
      modules: selectedModules,
      firstName: firstName.trim(),
      completedAt: Date.now(),
    };
    setSaving(true);
    try {
      if (onSaveProfile) await onSaveProfile(profile);
      saveLocalProfile(profile);
      markOnboardingDone();
      onComplete();
    } catch (error) {
      console.error("Impossible d'enregistrer l'onboarding :", error);
      setLocationNotice(
        "Vos préférences n'ont pas pu être enregistrées. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setSaving(false);
    }
  }, [
    city,
    countryCode,
    countryName,
    firstName,
    onComplete,
    onSaveProfile,
    saving,
    selectedModules,
  ]);

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <AnimatedBackground />

      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "android" ? 48 : 56 },
        ]}
      >
        <View style={{ width: 44 }}>
          {step > 0 ? (
            <GlassIconButton
              onPress={goBack}
              accessibilityLabel="Étape précédente"
            >
              <ArrowLeft size={18} color="rgba(255,255,255,0.85)" />
            </GlassIconButton>
          ) : null}
        </View>

        {step > 0 ? (
          <StepIndicator current={step} total={totalSteps} />
        ) : (
          <View />
        )}

        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="Passer l'onboarding"
          hitSlop={10}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 0.4,
            }}
          >
            Passer
          </Text>
        </Pressable>
      </View>

      {step > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {step === 0 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.welcomeScroll}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={{
                opacity: heroAnim,
                transform: [
                  {
                    scale: heroAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 1],
                    }),
                  },
                ],
              }}
            >
              <LinearGradient
                colors={["#A855F7", "#7C3AED", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.globeWrapper}
              >
                <Globe2 size={48} color="#fff" strokeWidth={2.2} />
              </LinearGradient>
            </Animated.View>

            <Animated.View
              style={{ opacity: contentAnim, alignItems: "center" }}
            >
              <Text style={styles.heroTitle}>
                Bienvenue sur{"\n"}
                <Text style={{ color: "#C4B5FD" }}>DébrouillePro</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                Une seule expérience pour trouver, connecter, travailler,
                voyager, apprendre et faire avancer vos projets — où que vous
                soyez dans le monde.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.chipsRow, { opacity: contentAnim }]}>
              {WELCOME_CHIPS.map((chip) => {
                const Icon = chip.icon;
                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => {
                      const moduleMap: Record<string, string> = {
                        Habitat: "immo",
                        Travail: "jobs",
                        Santé: "sante",
                        Finance: "paiement",
                        Voyage: "voyages",
                        Communauté: "community",
                      };
                      const mod = moduleMap[chip.label];
                      if (mod && !selectedModules.includes(mod)) {
                        setSelectedModules((cur) => [...cur, mod]);
                      }
                      goNext();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={chip.label}
                    hitSlop={6}
                    style={({ pressed }) => [
                      styles.chip,
                      {
                        borderColor: `${chip.color}66`,
                        backgroundColor: `${chip.color}18`,
                      },
                      pressed && {
                        transform: [{ scale: 0.94 }],
                        opacity: 0.85,
                      },
                    ]}
                  >
                    <Icon size={14} color={chip.color} />
                    <Text style={[styles.chipText, { color: chip.color }]}>
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>

            <Animated.View
              style={{
                opacity: contentAnim,
                width: "100%",
                maxWidth: 400,
                marginTop: 36,
              }}
            >
              <GradientButton
                onPress={goNext}
                accessibilityLabel="Personnaliser mon expérience"
              >
                <Text style={styles.ctaText}>Personnaliser mon expérience</Text>
                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
              </GradientButton>

              <Pressable
                onPress={handleSkip}
                accessibilityRole="button"
                accessibilityLabel="Découvrir d'abord"
                hitSlop={10}
                style={({ pressed }) => [
                  styles.skipLink,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.4)",
                    letterSpacing: 0.3,
                  }}
                >
                  Je préfère découvrir d'abord
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        ) : null}

        {step === 1 ? (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle
                icon={<MapPin size={16} color="#A78BFA" />}
                eyebrow="Étape 1 · Localisation"
                title="Où êtes-vous ?"
                subtitle="Votre localisation nous aide à adapter les services, contenus et opportunités."
                accent="#A78BFA"
              />
            </View>

            <View style={{ paddingHorizontal: 20 }}>
              <Pressable
                onPress={handleUseLocation}
                disabled={locating}
                accessibilityRole="button"
                accessibilityLabel="Utiliser ma position actuelle"
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                  locating && { opacity: 0.6 },
                ]}
              >
                <View style={styles.locationIcon}>
                  {locating ? (
                    <ActivityIndicator size="small" color="#A78BFA" />
                  ) : (
                    <Zap size={18} color="#A78BFA" strokeWidth={2.4} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: "800", color: "#fff" }}
                  >
                    {locating
                      ? "Localisation en cours…"
                      : "Utiliser ma position"}
                  </Text>
                  <Text
                    style={{
                      marginTop: 2,
                      fontSize: 11,
                      color: "rgba(255,255,255,0.45)",
                    }}
                  >
                    Aucun déplacement automatique sans votre permission
                  </Text>
                </View>
                <ArrowRight size={16} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {locationNotice || locationError ? (
                <Text
                  style={{
                    fontSize: 11,
                    marginBottom: 12,
                    paddingHorizontal: 4,
                    color: locationError
                      ? "rgba(251,191,36,0.9)"
                      : "rgba(52,211,153,0.9)",
                  }}
                >
                  {locationError ?? locationNotice}
                </Text>
              ) : null}

              <View style={styles.searchWrapper}>
                <Search
                  size={16}
                  color="rgba(255,255,255,0.4)"
                  style={styles.searchIcon}
                />
                <TextInput
                  value={countrySearch}
                  onChangeText={setCountrySearch}
                  placeholder="Rechercher votre pays…"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  style={[styles.input, { paddingLeft: 44 }]}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredCountries.map((country) => {
                const selected = country.code === countryCode;
                return (
                  <Pressable
                    key={country.code}
                    onPress={() => handleCountrySelect(country)}
                    accessibilityRole="button"
                    accessibilityLabel={`Sélectionner ${country.name}`}
                    style={({ pressed }) => [
                      styles.countryRow,
                      selected && styles.countryRowSelected,
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{country.flag}</Text>
                    <Text
                      style={{
                        flex: 1,
                        fontSize: 14,
                        fontWeight: "700",
                        color: "rgba(255,255,255,0.92)",
                      }}
                      numberOfLines={1}
                    >
                      {country.name}
                    </Text>
                    {selected ? (
                      <CheckCircle2 size={18} color="#A78BFA" />
                    ) : null}
                  </Pressable>
                );
              })}

              {filteredCountries.length === 0 ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <Globe2 size={30} color="rgba(255,255,255,0.2)" />
                  <Text
                    style={{
                      marginTop: 12,
                      fontSize: 14,
                      fontWeight: "700",
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    Pays introuvable
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    Essayez une autre recherche.
                  </Text>
                </View>
              ) : null}

              {countryCode ? (
                <View style={{ marginTop: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "800",
                          letterSpacing: 1,
                          color: "rgba(255,255,255,0.45)",
                        }}
                      >
                        VILLE
                      </Text>
                      <Text
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        Facultatif
                      </Text>
                    </View>
                    {city ? (
                      <Pressable
                        onPress={() => {
                          setCity("");
                          setCitySearch("");
                        }}
                        hitSlop={8}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            color: "rgba(255,255,255,0.5)",
                          }}
                        >
                          Modifier
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View style={styles.searchWrapper}>
                    <MapPin
                      size={16}
                      color="rgba(255,255,255,0.35)"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      value={citySearch || city}
                      onChangeText={(v) => {
                        setCity(v);
                        setCitySearch(v);
                      }}
                      placeholder={`Rechercher une ville en ${countryName}`}
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, { paddingLeft: 44 }]}
                      autoCapitalize="words"
                      autoCorrect={false}
                    />
                    {cityLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="#A78BFA"
                        style={{ position: "absolute", right: 16, top: 16 }}
                      />
                    ) : null}
                  </View>

                  {cityOptions.length > 0 ? (
                    <View style={styles.cityDropdown}>
                      {cityOptions.map((option) => (
                        <Pressable
                          key={`${option.name}-${option.latitude}-${option.longitude}`}
                          onPress={() => {
                            setCity(option.name);
                            setCitySearch(option.name);
                            setCityOptions([]);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Sélectionner ${option.name}`}
                          style={({ pressed }) => [
                            styles.cityRow,
                            pressed && {
                              backgroundColor: "rgba(167,139,250,0.12)",
                            },
                          ]}
                        >
                          <MapPin size={15} color="#A78BFA" />
                          <Text
                            style={{
                              fontSize: 14,
                              color: "rgba(255,255,255,0.9)",
                            }}
                          >
                            {option.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                onPress={goNext}
                disabled={!countryCode}
                accessibilityLabel="Continuer vers la personnalisation"
              >
                <Text style={styles.ctaText}>Continuer</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </GradientButton>
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionTitle
                icon={<Sparkles size={16} color="#A5B4FC" />}
                eyebrow="Étape 2 · Personnalisation"
                title="Qu'est-ce qui compte pour vous ?"
                subtitle="DébrouillePro adaptera votre accueil à vos priorités."
                accent="#A5B4FC"
              />
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  {selectedModules.length} module
                  {selectedModules.length > 1 ? "s" : ""} sélectionné
                  {selectedModules.length > 1 ? "s" : ""}
                </Text>
                <View style={styles.countBadge}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "800",
                      color: "#C4B5FD",
                    }}
                  >
                    {selectedModules.length}/{MODULES.length}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {MODULES.map((module) => {
                const Icon = module.icon;
                const selected = selectedModules.includes(module.id);
                return (
                  <Pressable
                    key={module.id}
                    onPress={() => toggleModule(module.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={module.label}
                    style={({ pressed }) => [
                      styles.moduleCard,
                      {
                        backgroundColor: selected
                          ? module.accentSoft
                          : "rgba(255,255,255,0.04)",
                        borderColor: selected
                          ? `${module.accent}88`
                          : "rgba(255,255,255,0.09)",
                        shadowColor: selected ? module.accent : "transparent",
                        shadowOpacity: selected ? 0.35 : 0,
                        shadowRadius: 16,
                        shadowOffset: { width: 0, height: 8 },
                        elevation: selected ? 6 : 0,
                      },
                      pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[
                          styles.moduleCheck,
                          { backgroundColor: module.accent },
                        ]}
                      >
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </View>
                    ) : null}

                    <View
                      style={[
                        styles.moduleIcon,
                        {
                          backgroundColor: selected
                            ? `${module.accent}25`
                            : "rgba(255,255,255,0.06)",
                        },
                      ]}
                    >
                      <Icon
                        size={22}
                        color={
                          selected ? module.accent : "rgba(255,255,255,0.5)"
                        }
                        strokeWidth={2.2}
                      />
                    </View>

                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "800",
                        color: selected ? "#fff" : "rgba(255,255,255,0.8)",
                      }}
                    >
                      {module.label}
                    </Text>
                    <Text
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        lineHeight: 15,
                        color: "rgba(255,255,255,0.45)",
                      }}
                    >
                      {module.description}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                onPress={goNext}
                disabled={selectedModules.length === 0}
                accessibilityLabel="Continuer vers le profil"
              >
                <Text style={styles.ctaText}>Continuer</Text>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </GradientButton>
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.profileScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <SectionTitle
              icon={<UserRound size={16} color="#34D399" />}
              eyebrow="Étape 3 · Profil"
              title="Une dernière touche"
              subtitle="Comment souhaitez-vous être accueilli ?"
              accent="#34D399"
            />

            <View style={{ alignItems: "center", marginBottom: 28 }}>
              <LinearGradient
                colors={["#8B5CF6", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarWrapper}
              >
                <Text
                  style={{ fontSize: 38, fontWeight: "900", color: "#fff" }}
                >
                  {firstName ? firstName.trim().charAt(0).toUpperCase() : "?"}
                </Text>
              </LinearGradient>
              <View style={styles.avatarCamera}>
                <Camera size={15} color="#fff" strokeWidth={2.4} />
              </View>
              <Text
                style={{
                  marginTop: 14,
                  fontSize: 11,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                Votre photo pourra être ajoutée depuis votre profil.
              </Text>
            </View>

            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  marginBottom: 8,
                  fontSize: 11,
                  fontWeight: "800",
                  letterSpacing: 1,
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                PRÉNOM
              </Text>
              <TextInput
                value={firstName}
                onChangeText={(v) => setFirstName(v.slice(0, 60))}
                placeholder="Comment devons-nous vous appeler ?"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            <View style={styles.summaryCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "800",
                    letterSpacing: 1,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  VOTRE CONFIGURATION
                </Text>
                <Sparkles size={15} color="#A78BFA" />
              </View>

              {countryCode ? (
                <SummaryRow
                  icon={<MapPin size={15} color="#A78BFA" />}
                  label="Localisation"
                  value={city ? `${city}, ${countryName}` : countryName}
                />
              ) : null}
              <SummaryRow
                icon={<Sparkles size={15} color="#A78BFA" />}
                label="Centres d'intérêt"
                value={`${selectedModules.length} module${selectedModules.length > 1 ? "s" : ""}`}
              />
              <SummaryRow
                icon={<Globe2 size={15} color="#A78BFA" />}
                label="Expérience"
                value="Personnalisée"
              />
            </View>

            <GradientButton
              onPress={() => void handleComplete()}
              loading={saving}
              disabled={saving}
              accessibilityLabel="Entrer dans DébrouillePro"
            >
              <CheckCircle2 size={19} color="#fff" strokeWidth={2.4} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "900",
                  color: "#fff",
                  letterSpacing: 0.3,
                }}
              >
                Entrer dans DébrouillePro
              </Text>
            </GradientButton>

            <Text
              style={{
                marginTop: 14,
                textAlign: "center",
                fontSize: 10,
                lineHeight: 15,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              Vous pourrez modifier ces préférences à tout moment dans votre
              profil.
            </Text>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

// ── STYLES (inchangés) ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0620",
  },

  orb: {
    position: "absolute",
    borderRadius: 999,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 10,
  },
  glassIconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },

  progressTrack: {
    height: 2,
    marginHorizontal: 20,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    zIndex: 10,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#A78BFA",
  },

  welcomeScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
    minHeight: "100%",
  },
  globeWrapper: {
    width: 108,
    height: 108,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.55,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 22 },
    elevation: 14,
  },
  heroTitle: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -1,
    lineHeight: 44,
  },
  heroSubtitle: {
    marginTop: 16,
    maxWidth: 380,
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 32,
    paddingHorizontal: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  gradientButtonOuter: {
    width: "100%",
    borderRadius: 18,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 18,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },
  skipLink: {
    marginTop: 18,
    paddingVertical: 10,
    alignItems: "center",
  },

  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    backgroundColor: "rgba(139,92,246,0.12)",
    marginBottom: 16,
  },
  locationIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.22)",
  },
  searchWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  searchIcon: {
    position: "absolute",
    left: 16,
    top: 17,
    zIndex: 2,
  },
  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontSize: 14,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
    gap: 8,
  },
  countryRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  countryRowSelected: {
    backgroundColor: "rgba(139,92,246,0.22)",
    borderColor: "rgba(167,139,250,0.6)",
  },
  cityDropdown: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(20,10,44,0.98)",
    overflow: "hidden",
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },

  moduleCard: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  moduleCheck: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  moduleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },

  profileScroll: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  avatarWrapper: {
    width: 104,
    height: 104,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#8B5CF6",
    shadowOpacity: 0.45,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 20 },
    elevation: 12,
  },
  avatarCamera: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderWidth: 3,
    borderColor: "#0B0620",
  },
  summaryCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.15)",
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },
});

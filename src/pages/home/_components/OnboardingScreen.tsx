// src/pages/home/_components/OnboardingScreen.tsx

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import {
  useCallback,
  useEffect,
  useMemo,
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

/* ============================================================================
 * CONSTANTS
 * ========================================================================== */

const ONBOARDING_KEY = "debrouille_onboarding_done";
const ONBOARDING_PROFILE_KEY = "debrouille_onboarding_profile";

const TOTAL_STEPS = 3;

const COUNTRY_CODES = `
AF AX AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ
BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW
BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW
`
  .trim()
  .split(/\s+/)
  .filter((code) => /^[A-Z]{2}$/.test(code));

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface OnboardingProfile {
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
    strokeWidth?: number;
  }>;
  accent: string;
  accentSoft: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
  onSaveProfile?: (profile: OnboardingProfile) => Promise<void>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/* ============================================================================
 * MODULE DATA
 * ========================================================================== */

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
  { icon: Building2, label: "Habitat", color: "#FB923C", module: "immo" },
  {
    icon: BriefcaseBusiness,
    label: "Travail",
    color: "#A78BFA",
    module: "jobs",
  },
  { icon: HeartPulse, label: "Santé", color: "#F87171", module: "sante" },
  {
    icon: WalletCards,
    label: "Finance",
    color: "#34D399",
    module: "paiement",
  },
  { icon: Plane, label: "Voyage", color: "#818CF8", module: "voyages" },
  {
    icon: MessageCircle,
    label: "Communauté",
    color: "#C084FC",
    module: "community",
  },
];

/* ============================================================================
 * STORAGE
 * ========================================================================== */

function getStorage(): StorageLike | null {
  try {
    if (Platform.OS !== "web") {
      return null;
    }

    const runtime = globalThis as typeof globalThis & {
      localStorage?: StorageLike;
    };

    const storage = runtime.localStorage;

    if (
      !storage ||
      typeof storage.getItem !== "function" ||
      typeof storage.setItem !== "function"
    ) {
      return null;
    }

    return storage;
  } catch {
    return null;
  }
}

export function hasCompletedOnboarding(): boolean {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    return storage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(ONBOARDING_KEY, "true");
  } catch {
    // Le backend reste la source de vérité.
  }
}

function saveLocalProfile(profile: OnboardingProfile): void {
  const storage = getStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Cache UX uniquement.
  }
}

/* ============================================================================
 * TEXT / COUNTRY HELPERS
 * ========================================================================== */

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function countryFlag(code: string): string {
  const normalized = code.toUpperCase();

  if (!/^[A-Z]{2}$/.test(normalized)) {
    return "🌍";
  }

  return String.fromCodePoint(
    ...normalized
      .split("")
      .map((character) => 127397 + character.charCodeAt(0)),
  );
}

function detectLanguage(): string {
  try {
    const runtime = globalThis as typeof globalThis & {
      navigator?: {
        language?: string;
      };
    };

    const language = runtime.navigator?.language;

    return language?.split("-")[0]?.toLowerCase() || "fr";
  } catch {
    return "fr";
  }
}

function getCountryDisplayName(code: string, language: string): string {
  try {
    const displayNames = new Intl.DisplayNames([language], {
      type: "region",
    });

    return displayNames.of(code) ?? code;
  } catch {
    try {
      const displayNames = new Intl.DisplayNames(["en"], {
        type: "region",
      });

      return displayNames.of(code) ?? code;
    } catch {
      return code;
    }
  }
}

function getCountries(language: string): CountryOption[] {
  return COUNTRY_CODES.map((code) => ({
    code,
    name: getCountryDisplayName(code, language),
    flag: countryFlag(code),
  })).sort((a, b) => a.name.localeCompare(b.name, language));
}

/* ============================================================================
 * LOCATION
 * ========================================================================== */

interface LocationResult {
  countryCode?: string;
  countryName?: string;
  city?: string;
}

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<LocationResult | null> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const address = addresses[0];

    if (!address) {
      return null;
    }

    return {
      countryCode: address.isoCountryCode?.toUpperCase() || undefined,
      countryName: address.country || undefined,
      city:
        address.city ||
        address.district ||
        address.subregion ||
        address.region ||
        undefined,
    };
  } catch {
    return null;
  }
}

async function searchCityWithDeviceGeocoder(
  query: string,
  countryCode: string,
): Promise<CityOption[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 3) {
    return [];
  }

  try {
    if (Platform.OS === "android") {
      const permission = await Location.getForegroundPermissionsAsync();

      if (!permission.granted) {
        return [];
      }
    }

    const countryName = getCountryDisplayName(countryCode, detectLanguage());

    const results = await Location.geocodeAsync(
      `${normalizedQuery}, ${countryName}`,
    );

    const candidates: CityOption[] = [];

    for (const result of results.slice(0, 3)) {
      const address = await reverseGeocode(result.latitude, result.longitude);

      const name = address?.city || address?.countryName || normalizedQuery;

      const resolvedCountryCode = address?.countryCode || countryCode;

      if (resolvedCountryCode.toUpperCase() !== countryCode.toUpperCase()) {
        continue;
      }

      candidates.push({
        name,
        countryCode: resolvedCountryCode,
        countryName: address?.countryName || countryName,
        latitude: result.latitude,
        longitude: result.longitude,
      });
    }

    const unique = candidates.filter(
      (candidate, index, array) =>
        array.findIndex(
          (item) => normalizeText(item.name) === normalizeText(candidate.name),
        ) === index,
    );

    return unique;
  } catch {
    return [];
  }
}

function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locate = useCallback(async (): Promise<LocationResult | null> => {
    if (locating) {
      return null;
    }

    setLocating(true);
    setLocationError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();

      if (!permission.granted) {
        setLocationError(
          "La permission de localisation a été refusée. Vous pouvez choisir votre pays et votre ville manuellement.",
        );

        return null;
      }

      const providerEnabled = await Location.hasServicesEnabledAsync();

      if (!providerEnabled) {
        setLocationError(
          "Les services de localisation sont désactivés sur cet appareil.",
        );

        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true,
      });

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
  }, [locating]);

  const hydrateFromExistingPermission =
    useCallback(async (): Promise<LocationResult | null> => {
      try {
        const permission = await Location.getForegroundPermissionsAsync();

        if (!permission.granted) {
          return null;
        }

        const lastKnown = await Location.getLastKnownPositionAsync({
          maxAge: 300000,
          requiredAccuracy: 1000,
        });

        if (!lastKnown) {
          return null;
        }

        return await reverseGeocode(
          lastKnown.coords.latitude,
          lastKnown.coords.longitude,
        );
      } catch {
        return null;
      }
    }, []);

  return {
    locate,
    hydrateFromExistingPermission,
    locating,
    locationError,
  };
}

/* ============================================================================
 * BACKGROUND
 * ========================================================================== */

function AnimatedBackground() {
  const { height: heightValue, width } = useWindowDimensions();

  const orb1 = useSharedValue(0);
  const orb2 = useSharedValue(0);
  const orb3 = useSharedValue(0);
  const orb4 = useSharedValue(0);

  useEffect(() => {
    orb1.value = withRepeat(
      withSequence(
        withTiming(-60, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 7000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );

    orb2.value = withRepeat(
      withSequence(
        withTiming(70, {
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 9000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );

    orb3.value = withRepeat(
      withSequence(
        withTiming(-50, {
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );

    orb4.value = withRepeat(
      withSequence(
        withTiming(55, {
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
        }),
        withTiming(0, {
          duration: 10000,
          easing: Easing.inOut(Easing.sin),
        }),
      ),
      -1,
      false,
    );
  }, [orb1, orb2, orb3, orb4]);

  const orb1Style = useAnimatedStyle(
    () => ({
      transform: [{ translateY: orb1.value }],
    }),
    [orb1],
  );

  const orb2Style = useAnimatedStyle(
    () => ({
      transform: [{ translateY: orb2.value }],
    }),
    [orb2],
  );

  const orb3Style = useAnimatedStyle(
    () => ({
      transform: [{ translateY: orb3.value }],
    }),
    [orb3],
  );

  const orb4Style = useAnimatedStyle(
    () => ({
      transform: [{ translateY: orb4.value }],
    }),
    [orb4],
  );

  return (
    <View pointerEvents="none" collapsable={false} style={styles.background}>
      <LinearGradient
        colors={["#0B0620", "#1A0B3D", "#0F0525", "#17093A"]}
        locations={[0, 0.35, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: Math.max(320, width * 0.9),
            height: Math.max(320, width * 0.9),
            top: -120,
            left: -100,
            backgroundColor: "rgba(139,92,246,0.5)",
          },
          orb1Style,
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: 300,
            height: 300,
            top: heightValue * 0.28,
            right: -120,
            backgroundColor: "rgba(99,102,241,0.42)",
          },
          orb2Style,
        ]}
      />

      <Animated.View
        style={[
          styles.orb,
          {
            width: 340,
            height: 340,
            bottom: heightValue * 0.05,
            left: -120,
            backgroundColor: "rgba(168,85,247,0.4)",
          },
          orb3Style,
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
          },
          orb4Style,
        ]}
      />
    </View>
  );
}

/* ============================================================================
 * UI PRIMITIVES
 * ========================================================================== */

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
        pressed && {
          opacity: 0.7,
          transform: [{ scale: 0.94 }],
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

function GradientButton({
  children,
  onPress,
  disabled = false,
  loading = false,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
    }),
    [scale],
  );

  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, {
      damping: 18,
      stiffness: 320,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 18,
      stiffness: 320,
    });
  }, [scale]);

  return (
    <Animated.View
      style={[
        {
          width: "100%",
        },
        animatedStyle,
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
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
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }, (_, index) => index + 1).map((item) => {
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
    <View style={styles.sectionTitle}>
      <View style={styles.sectionEyebrow}>
        {icon}

        <Text style={[styles.sectionEyebrowText, { color: accent }]}>
          {eyebrow.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.sectionTitleText}>{title}</Text>

      <Text style={styles.sectionSubtitle}>{subtitle}</Text>
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
    <View style={styles.summaryRow}>
      <View style={styles.summaryIcon}>{icon}</View>

      <View style={styles.summaryRowContent}>
        <Text style={styles.summaryLabel}>{label}</Text>

        <Text style={styles.summaryValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

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

  const { locate, hydrateFromExistingPermission, locating, locationError } =
    useDeviceLocation();

  const language = detectLanguage();

  /* --------------------------------------------------------------------------
   * PAGE ANIMATION
   * ------------------------------------------------------------------------ */

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.86);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(24);

  useEffect(() => {
    heroOpacity.value = 0;
    heroScale.value = 0.86;

    contentOpacity.value = 0;
    contentTranslateY.value = 24;

    heroOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    heroScale.value = withSpring(1, {
      damping: 18,
      stiffness: 180,
    });

    contentOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    contentTranslateY.value = withTiming(0, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [contentOpacity, contentTranslateY, heroOpacity, heroScale, step]);

  const heroAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: heroOpacity.value,
      transform: [{ scale: heroScale.value }],
    }),
    [heroOpacity, heroScale],
  );

  const contentAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: contentOpacity.value,
      transform: [{ translateY: contentTranslateY.value }],
    }),
    [contentOpacity, contentTranslateY],
  );

  /* --------------------------------------------------------------------------
   * COUNTRIES
   * ------------------------------------------------------------------------ */

  const countries = useMemo(() => getCountries(language), [language]);

  const filteredCountries = useMemo(() => {
    const query = normalizeText(countrySearch);

    if (!query) {
      return countries;
    }

    return countries.filter((country) =>
      normalizeText(country.name).includes(query),
    );
  }, [countries, countrySearch]);

  /* --------------------------------------------------------------------------
   * LOCATION — NEVER AUTO-PROMPT
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    void hydrateFromExistingPermission().then((result) => {
      if (cancelled || !result?.countryCode) {
        return;
      }

      setCountryCode(result.countryCode);

      setCountryName(
        result.countryName ??
          getCountryDisplayName(result.countryCode, language),
      );

      if (result.city) {
        setCity(result.city);
      }

      setLocationNotice(
        "Votre dernière position autorisée a été utilisée. Vous pouvez la modifier.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [hydrateFromExistingPermission, language]);

  /* --------------------------------------------------------------------------
   * CITY SEARCH
   * ------------------------------------------------------------------------ */

  useEffect(() => {
    let cancelled = false;

    if (!countryCode || citySearch.trim().length < 3) {
      setCityOptions([]);
      setCityLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setCityLoading(true);

      void searchCityWithDeviceGeocoder(citySearch, countryCode)
        .then((results) => {
          if (!cancelled) {
            setCityOptions(results);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCityOptions([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setCityLoading(false);
          }
        });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [citySearch, countryCode]);

  /* --------------------------------------------------------------------------
   * NAVIGATION
   * ------------------------------------------------------------------------ */

  const progress = step === 0 ? 0 : Math.round((step / TOTAL_STEPS) * 100);

  const canContinue =
    step === 1
      ? Boolean(countryCode)
      : step === 2
        ? selectedModules.length > 0
        : true;

  const goNext = useCallback(() => {
    if (!canContinue || step >= TOTAL_STEPS) {
      return;
    }

    setStep((current) => current + 1);
  }, [canContinue, step]);

  const goBack = useCallback(() => {
    if (step <= 0 || saving) {
      return;
    }

    setStep((current) => current - 1);
  }, [saving, step]);

  /* --------------------------------------------------------------------------
   * SKIP
   * ------------------------------------------------------------------------ */

  const handleSkip = useCallback(() => {
    if (saving) {
      return;
    }

    markOnboardingDone();
    onComplete();
  }, [onComplete, saving]);

  /* --------------------------------------------------------------------------
   * MODULES
   * ------------------------------------------------------------------------ */

  const toggleModule = useCallback((id: string) => {
    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((moduleId) => moduleId !== id)
        : [...current, id],
    );
  }, []);

  /* --------------------------------------------------------------------------
   * COUNTRY
   * ------------------------------------------------------------------------ */

  const handleCountrySelect = useCallback((country: CountryOption) => {
    setCountryCode(country.code);
    setCountryName(country.name);

    setCity("");
    setCitySearch("");
    setCityOptions([]);
  }, []);

  /* --------------------------------------------------------------------------
   * DEVICE LOCATION
   * ------------------------------------------------------------------------ */

  const handleUseLocation = useCallback(() => {
    if (locating || saving) {
      return;
    }

    void locate().then((result) => {
      if (!result?.countryCode) {
        return;
      }

      setCountryCode(result.countryCode);

      setCountryName(
        result.countryName ??
          getCountryDisplayName(result.countryCode, language),
      );

      if (result.city) {
        setCity(result.city);
        setCitySearch(result.city);
      }

      setCityOptions([]);

      setLocationNotice(
        "Position détectée avec succès. Vous pouvez encore modifier votre localisation.",
      );
    });
  }, [language, locate, locating, saving]);

  /* --------------------------------------------------------------------------
   * COMPLETE
   * ------------------------------------------------------------------------ */

  const handleComplete = useCallback(async () => {
    if (saving) {
      return;
    }

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
      /*
       * Le parent conserve la responsabilité de brancher
       * le contrat Convex existant.
       *
       * Le backend actuel attend notamment :
       * city / country / roles / interests.
       *
       * On ne crée aucune mutation parallèle ici.
       */
      if (onSaveProfile) {
        await onSaveProfile(profile);
      }

      /*
       * Cache UX uniquement.
       * La source de vérité applicative reste le backend.
       */
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

  /* ==========================================================================
   * RENDER
   * ======================================================================== */

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <AnimatedBackground />

      {/* ----------------------------------------------------------------------
       * HEADER
       * -------------------------------------------------------------------- */}

      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "android" ? 48 : 56,
          },
        ]}
      >
        <View style={styles.headerSide}>
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
          <StepIndicator current={step} total={TOTAL_STEPS} />
        ) : (
          <View />
        )}

        <Pressable
          onPress={handleSkip}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel="Passer l'onboarding"
          hitSlop={10}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && { opacity: 0.6 },
            saving && { opacity: 0.35 },
          ]}
        >
          <Text style={styles.skipButtonText}>Passer</Text>
        </Pressable>
      </View>

      {step > 0 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      ) : null}

      {/* ----------------------------------------------------------------------
       * CONTENT
       * -------------------------------------------------------------------- */}

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* ====================================================================
         * STEP 0 — WELCOME
         * ================================================================== */}

        {step === 0 ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.welcomeScroll}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={heroAnimatedStyle}>
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
              style={[styles.welcomeContent, contentAnimatedStyle]}
            >
              <Text style={styles.heroTitle}>
                Bienvenue sur{"\n"}
                <Text style={styles.heroTitleAccent}>DébrouillePro</Text>
              </Text>

              <Text style={styles.heroSubtitle}>
                Une seule expérience pour trouver, connecter, travailler,
                voyager, apprendre et faire avancer vos projets — où que vous
                soyez dans le monde.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.chipsRow, contentAnimatedStyle]}>
              {WELCOME_CHIPS.map((chip) => {
                const Icon = chip.icon;

                return (
                  <Pressable
                    key={chip.label}
                    onPress={() => {
                      if (!selectedModules.includes(chip.module)) {
                        setSelectedModules((current) => [
                          ...current,
                          chip.module,
                        ]);
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
              style={[styles.welcomeButtonContainer, contentAnimatedStyle]}
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
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Découvrir d'abord"
                hitSlop={10}
                style={({ pressed }) => [
                  styles.skipLink,
                  pressed && { opacity: 0.6 },
                ]}
              >
                <Text style={styles.skipLinkText}>
                  Je préfère découvrir d'abord
                </Text>
              </Pressable>
            </Animated.View>
          </ScrollView>
        ) : null}

        {/* ====================================================================
         * STEP 1 — LOCATION
         * ================================================================== */}

        {step === 1 ? (
          <View style={styles.flex}>
            <View style={styles.horizontalPadding}>
              <SectionTitle
                icon={<MapPin size={16} color="#A78BFA" />}
                eyebrow="Étape 1 · Localisation"
                title="Où êtes-vous ?"
                subtitle="Votre localisation nous aide à adapter les services, contenus et opportunités."
                accent="#A78BFA"
              />
            </View>

            <View style={styles.horizontalPadding}>
              <Pressable
                onPress={handleUseLocation}
                disabled={locating || saving}
                accessibilityRole="button"
                accessibilityLabel="Utiliser ma position actuelle"
                accessibilityState={{
                  disabled: locating || saving,
                }}
                style={({ pressed }) => [
                  styles.locationButton,
                  pressed && {
                    transform: [{ scale: 0.98 }],
                    opacity: 0.9,
                  },
                  (locating || saving) && {
                    opacity: 0.6,
                  },
                ]}
              >
                <View style={styles.locationIcon}>
                  {locating ? (
                    <ActivityIndicator size="small" color="#A78BFA" />
                  ) : (
                    <Zap size={18} color="#A78BFA" strokeWidth={2.4} />
                  )}
                </View>

                <View style={styles.locationText}>
                  <Text style={styles.locationTitle}>
                    {locating
                      ? "Localisation en cours…"
                      : "Utiliser ma position"}
                  </Text>

                  <Text style={styles.locationDescription}>
                    Votre position n'est utilisée qu'après votre autorisation
                  </Text>
                </View>

                <ArrowRight size={16} color="rgba(255,255,255,0.35)" />
              </Pressable>

              {locationNotice || locationError ? (
                <Text
                  style={[
                    styles.locationNotice,
                    {
                      color: locationError
                        ? "rgba(251,191,36,0.9)"
                        : "rgba(52,211,153,0.9)",
                    },
                  ]}
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
                  style={[styles.input, styles.inputWithLeftIcon]}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
              </View>
            </View>

            <ScrollView
              style={styles.flex}
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
                    accessibilityState={{
                      selected,
                    }}
                    style={({ pressed }) => [
                      styles.countryRow,
                      selected && styles.countryRowSelected,
                      pressed && {
                        opacity: 0.85,
                        transform: [{ scale: 0.99 }],
                      },
                    ]}
                  >
                    <Text style={styles.countryFlag}>{country.flag}</Text>

                    <Text style={styles.countryName} numberOfLines={1}>
                      {country.name}
                    </Text>

                    {selected ? (
                      <CheckCircle2 size={18} color="#A78BFA" />
                    ) : null}
                  </Pressable>
                );
              })}

              {filteredCountries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Globe2 size={30} color="rgba(255,255,255,0.2)" />

                  <Text style={styles.emptyStateTitle}>Pays introuvable</Text>

                  <Text style={styles.emptyStateDescription}>
                    Essayez une autre recherche.
                  </Text>
                </View>
              ) : null}

              {countryCode ? (
                <View style={styles.citySection}>
                  <View style={styles.cityHeader}>
                    <View>
                      <Text style={styles.cityEyebrow}>VILLE</Text>

                      <Text style={styles.cityOptional}>Facultatif</Text>
                    </View>

                    {city ? (
                      <Pressable
                        onPress={() => {
                          setCity("");
                          setCitySearch("");
                          setCityOptions([]);
                        }}
                        hitSlop={8}
                        accessibilityRole="button"
                        accessibilityLabel="Modifier la ville"
                      >
                        <Text style={styles.modifyText}>Modifier</Text>
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
                      onChangeText={(value) => {
                        setCity(value);
                        setCitySearch(value);
                      }}
                      placeholder={`Rechercher une ville en ${countryName}`}
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={[styles.input, styles.inputWithLeftIcon]}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="done"
                    />

                    {cityLoading ? (
                      <ActivityIndicator
                        size="small"
                        color="#A78BFA"
                        style={styles.cityLoader}
                      />
                    ) : null}
                  </View>

                  {cityOptions.length > 0 ? (
                    <View style={styles.cityDropdown}>
                      {cityOptions.map((option) => (
                        <Pressable
                          key={`${option.name}-${option.latitude ?? 0}-${option.longitude ?? 0}`}
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

                          <Text style={styles.cityRowText}>{option.name}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  <Text style={styles.cityHint}>
                    Vous pouvez aussi saisir directement votre ville sans
                    sélectionner une suggestion.
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                onPress={goNext}
                disabled={!countryCode || saving}
                accessibilityLabel="Continuer vers la personnalisation"
              >
                <Text style={styles.ctaText}>Continuer</Text>

                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </GradientButton>
            </View>
          </View>
        ) : null}

        {/* ====================================================================
         * STEP 2 — MODULES
         * ================================================================== */}

        {step === 2 ? (
          <View style={styles.flex}>
            <View style={styles.horizontalPadding}>
              <SectionTitle
                icon={<Sparkles size={16} color="#A5B4FC" />}
                eyebrow="Étape 2 · Personnalisation"
                title="Qu'est-ce qui compte pour vous ?"
                subtitle="DébrouillePro adaptera votre accueil à vos priorités."
                accent="#A5B4FC"
              />

              <View style={styles.selectionHeader}>
                <Text style={styles.selectionText}>
                  {selectedModules.length} module
                  {selectedModules.length > 1 ? "s" : ""} sélectionné
                  {selectedModules.length > 1 ? "s" : ""}
                </Text>

                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {selectedModules.length}/{MODULES.length}
                  </Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.flex}
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
                    accessibilityState={{
                      checked: selected,
                    }}
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
                        shadowOffset: {
                          width: 0,
                          height: 8,
                        },
                        elevation: selected ? 6 : 0,
                      },
                      pressed && {
                        transform: [{ scale: 0.98 }],
                        opacity: 0.9,
                      },
                    ]}
                  >
                    {selected ? (
                      <View
                        style={[
                          styles.moduleCheck,
                          {
                            backgroundColor: module.accent,
                          },
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
                      style={[
                        styles.moduleLabel,
                        {
                          color: selected ? "#fff" : "rgba(255,255,255,0.8)",
                        },
                      ]}
                    >
                      {module.label}
                    </Text>

                    <Text style={styles.moduleDescription}>
                      {module.description}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <GradientButton
                onPress={goNext}
                disabled={selectedModules.length === 0 || saving}
                accessibilityLabel="Continuer vers le profil"
              >
                <Text style={styles.ctaText}>Continuer</Text>

                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </GradientButton>
            </View>
          </View>
        ) : null}

        {/* ====================================================================
         * STEP 3 — PROFILE
         * ================================================================== */}

        {step === 3 ? (
          <ScrollView
            style={styles.flex}
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

            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={["#8B5CF6", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarWrapper}
              >
                <Text style={styles.avatarLetter}>
                  {firstName ? firstName.trim().charAt(0).toUpperCase() : "?"}
                </Text>
              </LinearGradient>

              <View style={styles.avatarCamera}>
                <Camera size={15} color="#fff" strokeWidth={2.4} />
              </View>

              <Text style={styles.avatarHint}>
                Votre photo pourra être ajoutée depuis votre profil.
              </Text>
            </View>

            <View style={styles.firstNameContainer}>
              <Text style={styles.fieldLabel}>PRÉNOM</Text>

              <TextInput
                value={firstName}
                onChangeText={(value) => setFirstName(value.slice(0, 60))}
                placeholder="Comment devons-nous vous appeler ?"
                placeholderTextColor="rgba(255,255,255,0.35)"
                style={styles.input}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={60}
                returnKeyType="done"
              />
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryHeaderText}>
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
                value={`${selectedModules.length} module${
                  selectedModules.length > 1 ? "s" : ""
                }`}
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

              <Text style={styles.finalButtonText}>
                Entrer dans DébrouillePro
              </Text>
            </GradientButton>

            <Text style={styles.disclaimer}>
              Vous pourrez modifier ces préférences à tout moment dans votre
              profil.
            </Text>
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0620",
  },

  flex: {
    flex: 1,
  },

  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  backgroundGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
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

  headerSide: {
    width: 60,
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

  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    minWidth: 60,
    alignItems: "center",
  },

  skipButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
    letterSpacing: 0.4,
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

  keyboardContainer: {
    flex: 1,
  },

  welcomeScroll: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  welcomeContent: {
    alignItems: "center",
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
    shadowOffset: {
      width: 0,
      height: 22,
    },
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

  heroTitleAccent: {
    color: "#C4B5FD",
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

  welcomeButtonContainer: {
    width: "100%",
    maxWidth: 400,
    marginTop: 36,
  },

  gradientButtonOuter: {
    width: "100%",
    borderRadius: 18,
    shadowColor: "#7C3AED",
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: {
      width: 0,
      height: 16,
    },
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

  skipLinkText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    letterSpacing: 0.3,
  },

  horizontalPadding: {
    paddingHorizontal: 20,
  },

  sectionTitle: {
    paddingTop: 20,
    paddingBottom: 18,
  },

  sectionEyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  sectionEyebrowText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },

  sectionTitleText: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(255,255,255,0.5)",
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

  locationText: {
    flex: 1,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },

  locationDescription: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
  },

  locationNotice: {
    fontSize: 11,
    marginBottom: 12,
    paddingHorizontal: 4,
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

  inputWithLeftIcon: {
    paddingLeft: 44,
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

  countryFlag: {
    fontSize: 20,
  },

  countryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.92)",
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },

  emptyStateTitle: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.55)",
  },

  emptyStateDescription: {
    marginTop: 4,
    fontSize: 12,
    color: "rgba(255,255,255,0.35)",
  },

  citySection: {
    marginTop: 20,
  },

  cityHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  cityEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
  },

  cityOptional: {
    marginTop: 2,
    fontSize: 11,
    color: "rgba(255,255,255,0.35)",
  },

  modifyText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },

  cityLoader: {
    position: "absolute",
    right: 16,
    top: 16,
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

  cityRowText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },

  cityHint: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.3)",
  },

  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 22,
  },

  selectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  selectionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
  },

  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },

  countBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#C4B5FD",
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

  moduleLabel: {
    fontSize: 14,
    fontWeight: "800",
  },

  moduleDescription: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.45)",
  },

  profileScroll: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  avatarContainer: {
    alignItems: "center",
    marginBottom: 28,
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
    shadowOffset: {
      width: 0,
      height: 20,
    },
    elevation: 12,
  },

  avatarLetter: {
    fontSize: 38,
    fontWeight: "900",
    color: "#fff",
  },

  avatarCamera: {
    position: "absolute",
    bottom: 28,
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    borderWidth: 3,
    borderColor: "#0B0620",
  },

  avatarHint: {
    marginTop: 14,
    fontSize: 11,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },

  firstNameContainer: {
    marginBottom: 24,
  },

  fieldLabel: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
  },

  summaryCard: {
    marginBottom: 24,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  summaryHeaderText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.5)",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  summaryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.15)",
  },

  summaryRowContent: {
    flex: 1,
  },

  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
  },

  finalButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 0.3,
  },

  disclaimer: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
    color: "rgba(255,255,255,0.3)",
  },
});

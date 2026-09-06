import { Pressable, View, Text, TextInput, ViewStyle, TextStyle, ImageStyle } from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType
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
  ChevronDown,
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
  X,
  Zap,
} from "lucide-react-native";

/**
 * ============================================================
 * DÉBROUILLEPRO
 * OnboardingScreen — GLOBAL / PRODUCTION
 * ============================================================
 *
 * Objectifs :
 *
 * - expérience mondiale
 * - aucun pays codé en dur dans l'UI
 * - géolocalisation intelligente
 * - recherche pays
 * - sélection ville
 * - personnalisation des modules
 * - expérience clavier / accessibilité
 * - reduced motion
 * - persistance locale de secours
 * - aucune donnée métier fictive
 *
 * La persistance backend doit être branchée sur la mutation
 * Convex déjà présente dans le projet.
 *
 * Ce composant ne suppose volontairement aucun nom de mutation
 * qui n'est pas présent dans le fichier fourni.
 * ============================================================
 */

const ONBOARDING_KEY = "debrouille_onboarding_done";
const ONBOARDING_PROFILE_KEY = "debrouille_onboarding_profile";

/* ============================================================
 * TYPES
 * ============================================================ */

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
    className?: string;
    style?: ViewStyle | TextStyle | ImageStyle;
  }>;
  accent: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;

  /**
   * Optionnel :
   * permet au parent de brancher la vraie mutation backend
   * sans que ce composant invente un contrat Convex.
   */
  onSaveProfile?: (profile: OnboardingProfile) => Promise<void>;
}

/* ============================================================
 * GLOBAL REFERENCE DATA
 * ============================================================ */

/**
 * Les modules sont des capacités de l'application.
 * Ce ne sont pas des données utilisateur mockées.
 */
const MODULES: ModuleDefinition[] = [
  {
    id: "immo",
    label: "Immobilier",
    description: "Louer, acheter, vendre",
    icon: Building2,
    accent: "#F97316",
  },
  {
    id: "jobs",
    label: "Emploi & Pro",
    description: "Jobs, missions, freelance",
    icon: BriefcaseBusiness,
    accent: "#8B5CF6",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Déplacements & mobilité",
    icon: Bus,
    accent: "#3B82F6",
  },
  {
    id: "sante",
    label: "Santé",
    description: "Soins & professionnels",
    icon: HeartPulse,
    accent: "#EF4444",
  },
  {
    id: "paiement",
    label: "Paiements",
    description: "Payer & gérer son argent",
    icon: WalletCards,
    accent: "#10B981",
  },
  {
    id: "livraison",
    label: "Livraison",
    description: "Colis & courses",
    icon: Package,
    accent: "#F59E0B",
  },
  {
    id: "agri",
    label: "Agriculture",
    description: "Production & opportunités",
    icon: Leaf,
    accent: "#22C55E",
  },
  {
    id: "media",
    label: "Médias",
    description: "Actualités & contenus",
    icon: Newspaper,
    accent: "#06B6D4",
  },
  {
    id: "evenements",
    label: "Événements",
    description: "Sorties & expériences",
    icon: CalendarDays,
    accent: "#EC4899",
  },
  {
    id: "voyages",
    label: "Voyages",
    description: "Explorer le monde",
    icon: Plane,
    accent: "#6366F1",
  },
  {
    id: "community",
    label: "Communauté",
    description: "Groupes & discussions",
    icon: MessageCircle,
    accent: "#A855F7",
  },
  {
    id: "sos",
    label: "SOS",
    description: "Aide & urgences",
    icon: ShieldCheck,
    accent: "#DC2626",
  },
];

/**
 * Sélection initiale :
 * seulement des capacités génériques, pas des données fictives.
 */
const DEFAULT_MODULES = ["immo", "jobs", "paiement", "sante"];

/* ============================================================
 * HELPERS
 * ============================================================ */

export function hasCompletedOnboarding(): boolean {
  if (typeof undefined === "undefined") {
    return false;
  }

  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function markOnboardingDone(): void {
  if (typeof undefined === "undefined") {
    return;
  }

  localStorage.setItem(ONBOARDING_KEY, "true");
}

function saveLocalProfile(profile: OnboardingProfile): void {
  if (typeof undefined === "undefined") {
    return;
  }

  localStorage.setItem(ONBOARDING_PROFILE_KEY, JSON.stringify(profile));
}

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
    ...normalized.split("").map((char) => 127397 + char.charCodeAt(0)),
  );
}

function detectLanguage(): string {
  if (typeof undefined === "undefined") {
    return "fr";
  }

  return "en"?.split("-")[0]?.toLowerCase() || "fr";
}

function getCountryDisplayName(code: string, language: string): string {
  try {
    const displayNames = new Intl.DisplayNames([language], { type: "region" });

    return displayNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Liste ISO minimale issue de la plateforme via Intl.
 *
 * Nous ne codons pas 8 pays :
 * l'interface tente de récupérer l'ensemble des régions
 * reconnues par le runtime.
 *
 * Si le runtime ne supporte pas supportedValuesOf("region"),
 * on retombe sur le pays détecté.
 */
function getAvailableCountryCodes(): string[] {
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.supportedValuesOf === "function"
    ) {
      const values = (
        Intl.supportedValuesOf as unknown as (key: string) => string[]
      )("region");

      return values.filter((value) => /^[A-Z]{2}$/.test(value)).sort();
    }
  } catch {
    // Fallback handled below.
  }

  return [];
}

/* ============================================================
 * LOCATION API
 * ============================================================ */

async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<{
  countryCode?: string;
  countryName?: string;
  city?: string;
}> {
  const url =
    "https://nominatim.openstreetmap.org/reverse" +
    `?format=json&lat=${encodeURIComponent(latitude)}` +
    `&lon=${encodeURIComponent(longitude)}` +
    "&zoom=10&addressdetails=1";

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": detectLanguage(),
    },
  });

  if (!response.ok) {
    throw new Error("Reverse geocoding unavailable");
  }

  const data = (await response.json()) as {
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

  const address = data.address;

  return {
    countryCode: address?.country_code?.toUpperCase(),
    countryName: address?.country,
    city:
      address?.city ??
      address?.town ??
      address?.municipality ??
      address?.village ??
      address?.state,
  };
}

async function searchCities(
  query: string,
  countryCode: string,
): Promise<CityOption[]> {
  if (query.trim().length < 2) {
    return [];
  }

  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?format=json&addressdetails=1&limit=8` +
    `&q=${encodeURIComponent(query)}` +
    `&countrycodes=${encodeURIComponent(countryCode.toLowerCase())}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": detectLanguage(),
    },
  });

  if (!response.ok) {
    throw new Error("City search unavailable");
  }

  const data = (await response.json()) as Array<{
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
      const address = item.address;

      return {
        name:
          address?.city ??
          address?.town ??
          address?.municipality ??
          address?.village ??
          address?.state ??
          item.display_name.split(",")[0],
        countryCode: address?.country_code?.toUpperCase() ?? countryCode,
        countryName: address?.country ?? "",
        latitude: Number(item.lat),
        longitude: Number(item.lon),
      };
    })
    .filter(
      (item, index, array) =>
        array.findIndex(
          (candidate) =>
            normalizeText(candidate.name) === normalizeText(item.name),
        ) === index,
    );
}

/* ============================================================
 * LOCATION HOOK
 * ============================================================ */

function useDeviceLocation() {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    if (typeof undefined === "undefined" || !undefined) {
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
          undefined.getCurrentPosition(resolve, reject, {
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
  }, []);

  return {
    locate,
    locating,
    locationError,
  };
}

/* ============================================================
 * UI HELPERS
 * ============================================================ */

const pageVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 48 : -48,
    scale: 0.985,
  }),

  center: {
    opacity: 1,
    x: 0,
    scale: 1,
  },

  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -48 : 48,
    scale: 0.985,
  }),
};

function GlassButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <Pressable
      type={type}
      onPress={onClick}
      disabled={disabled}
      className={[
        "rounded-2xl border border-white/10",
        "bg-white/[0.055]",
        "text-white",
        "transition-all",
        "hover:bg-white/[0.09]",
        "disabled:cursor-not-allowed disabled:opacity-35",
        className,
      ].join(" ")}
    >
      {children}
    </Pressable>
  );
}

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function OnboardingScreen({
  onComplete,
  onSaveProfile,
}: OnboardingScreenProps) {
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

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

  /* ----------------------------------------------------------
   * COUNTRIES
   * ---------------------------------------------------------- */

  const countries = useMemo<CountryOption[]>(() => {
    const codes = getAvailableCountryCodes();

    const options = codes.map((code) => ({
      code,
      name: getCountryDisplayName(code, language),
      flag: countryFlag(code),
    }));

    return options.sort((a, b) => a.name.localeCompare(b.name, language));
  }, [language]);

  const filteredCountries = useMemo(() => {
    const query = normalizeText(countrySearch);

    if (!query) {
      return countries;
    }

    return countries.filter((country) =>
      normalizeText(country.name).includes(query),
    );
  }, [countries, countrySearch]);

  /* ----------------------------------------------------------
   * DEFAULT DEVICE LOCATION
   * ---------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    void locate().then((result) => {
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
        "Votre position a été détectée. Vous pouvez la modifier.",
      );
    });

    return () => {
      cancelled = true;
    };
  }, [language, locate]);

  /* ----------------------------------------------------------
   * CITY SEARCH
   * ---------------------------------------------------------- */

  useEffect(() => {
    if (!countryCode || citySearch.trim().length < 2) {
      setCityOptions([]);
      return;
    }

    const controller = new AbortController();

    const timer = undefined;

    return () => {
      controller.abort();
      undefined;
    };
  }, [citySearch, countryCode]);

  /* ----------------------------------------------------------
   * NAVIGATION
   * ---------------------------------------------------------- */

  const totalSteps = 3;

  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);

  const canContinue =
    step === 1
      ? Boolean(countryCode)
      : step === 2
        ? selectedModules.length > 0
        : true;

  const goNext = useCallback(() => {
    if (!canContinue || step >= totalSteps) {
      return;
    }

    setDirection(1);
    setStep((value) => value + 1);
  }, [canContinue, step]);

  const goBack = useCallback(() => {
    if (step <= 0) {
      return;
    }

    setDirection(-1);
    setStep((value) => value - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    markOnboardingDone();
    onComplete();
  }, [onComplete]);

  const toggleModule = useCallback((id: string) => {
    setSelectedModules((current) =>
      current.includes(id)
        ? current.filter((moduleId) => moduleId !== id)
        : [...current, id],
    );
  }, []);

  /* ----------------------------------------------------------
   * COUNTRY
   * ---------------------------------------------------------- */

  const handleCountrySelect = useCallback((country: CountryOption) => {
    setCountryCode(country.code);
    setCountryName(country.name);
    setCity("");
    setCitySearch("");
    setCityOptions([]);
  }, []);

  /* ----------------------------------------------------------
   * COMPLETE
   * ---------------------------------------------------------- */

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
      /**
       * Backend réel fourni par le parent.
       *
       * Exemple côté HomePage :
       *
       * const saveOnboarding = useMutation(
       *   api.users.completeOnboarding
       * );
       *
       * <OnboardingScreen
       *   onSaveProfile={(profile) =>
       *     saveOnboarding(profile)
       *   }
       * />
       *
       * On ne fabrique volontairement pas ce contrat ici.
       */
      if (onSaveProfile) {
        await onSaveProfile(profile);
      }

      /**
       * Fallback local :
       * garantit que l'utilisateur ne revoit pas
       * l'onboarding si le backend n'est pas encore branché
       * dans le parent.
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

  /* ----------------------------------------------------------
   * ANIMATION CONFIG
   * ---------------------------------------------------------- */

  const transition = reducedMotion
    ? { duration: 0 }
    : {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      };

  /* ----------------------------------------------------------
   * RENDER
   * ---------------------------------------------------------- */

  return (
    <View
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
      style={{  }}
      accessibilityRole="dialog"
      aria-modal="true"
      accessibilityLabel="Configuration de votre expérience DébrouillePro"
    >
      {/* ======================================================
          AMBIENT SYSTEM
      ====================================================== */}

      <View
        className="absolute -left-24 -top-24 h-80 w-80 rounded-full"
        style={{  }}
      />

      <View
        className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full"
        style={{  }}
      />

      <View
        className="absolute left-1/2 top-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{  }}
      />

      {/* ======================================================
          TOP BAR
      ====================================================== */}

      <View className="relative z-10 flex shrink-0 items-center justify-between px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <View className="w-10">
          {step > 0 && (
            <GlassButton
              onPress={goBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl"
            >
              <ArrowLeft size={18} className="text-white/75" />
            </GlassButton>
          )}
        </View>

        {step > 0 && (
          <View
            className="flex items-center gap-1.5"
            accessibilityLabel={`Étape ${step} sur ${totalSteps}`}
          >
            {Array.from({ length: totalSteps }, (_, index) => index + 1).map(
              (item) => {
                const active = step === item;
                const complete = step > item;

                return (
                  <View
                    key={item}
                    className="h-1.5 rounded-full"
                    style={{  }}
                  />
                );
              },
            )}
          </View>
        )}

        <Pressable
         
          onPress={handleSkip}
          className="rounded-xl px-3 py-2 text-xs font-semibold text-white/35"
        >
          <Text>Passer</Text></Pressable>
      </View>

      {/* ======================================================
          PROGRESS
      ====================================================== */}

      {step > 0 && (
        <View className="relative z-10 mx-5 h-px overflow-hidden rounded-full bg-white/[0.06]">
          <View
            className="h-full rounded-full"
            style={{  }}
          />
        </View>
      )}

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <View className="relative min-h-0 flex-1 overflow-hidden">
        <>
          {/* ==================================================
              STEP 0 — WELCOME
          ================================================== */}

          {step === 0 && (
            <View
              key="welcome"
              custom={direction}
              className="absolute inset-0 flex flex-col items-center justify-center overflow-y-auto px-6 py-10 text-center"
            >
              <View
                className="relative mb-7 flex h-24 w-24 items-center justify-center rounded-[2rem]"
                style={{  }}
              >
                <Globe2 size={46} strokeWidth={1.7} className="text-white" />

                <View
                  className="absolute inset-[-8px] rounded-[2.3rem] border border-white/10"
                />
              </View>

              <Text className="max-w-xl text-4xl font-black tracking-tight text-white sm:text-5xl">
                Bienvenue sur{" "}
                <Text
                  style={{ WebkitBackgroundClip: "text" }}
                >
                  DébrouillePro
                </Text>
              </Text>

              <Text className="mt-4 max-w-md text-base leading-relaxed text-white/45">
                Une seule expérience pour trouver, connecter, travailler,
                voyager, apprendre et faire avancer vos projets — où que vous
                soyez dans le monde.
              </Text>

              <View className="mt-8 flex max-w-md flex-wrap justify-center gap-2">
                {[
                  "🏠 Habitat",
                  "💼 Travail",
                  "❤️ Santé",
                  "💳 Finance",
                  "✈️ Voyage",
                  "🤝 Communauté",
                ].map((item) => (
                  <Text
                    key={item}
                    className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/55"
                  >
                    {item}
                  </Text>
                ))}
              </View>

              <Pressable
                type="button"
                onPress={goNext}
                className="mt-10 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white"
                style={{  }}
              >
                <Text>Personnaliser mon expérience</Text><ArrowRight size={19} />
              </Pressable>

              <Pressable
               
                onPress={handleSkip}
                className="mt-4 px-4 py-2 text-xs text-white/25"
              >
                <Text>Je préfère découvrir d'abord</Text></Pressable>
            </View>
          )}

          {/* ==================================================
              STEP 1 — LOCATION
          ================================================== */}

          {step === 1 && (
            <View
              key="location"
              custom={direction}
              className="absolute inset-0 flex flex-col overflow-hidden px-5"
            >
              <View className="shrink-0 pb-4 pt-5">
                <View className="mb-1 flex items-center gap-2">
                  <MapPin size={17} className="text-violet-400" />

                  <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-400">
                    Étape 1 · Localisation
                  </Text>
                </View>

                <Text className="text-2xl font-black text-white">
                  Où êtes-vous ?
                </Text>

                <Text className="mt-1 text-sm text-white/40">
                  Votre localisation nous aide à adapter les services, contenus
                  et opportunités.
                </Text>
              </View>

              {/* Auto location */}
              <Pressable
                type="button"
                onPress={() => {
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
                    }

                    setLocationNotice("Position détectée avec succès.");
                  });
                }}
                disabled={locating}
                className="mb-4 flex shrink-0 items-center gap-3 rounded-2xl border border-violet-400/20 bg-violet-500/[0.08] px-4 py-3 text-left disabled:opacity-60"
              >
                <View className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15">
                  {locating ? (
                    <View
                    >
                      <MapPin size={18} className="text-violet-300" />
                    </View>
                  ) : (
                    <Zap size={18} className="text-violet-300" />
                  )}
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-bold text-white">
                    {locating
                      ? "Localisation en cours..."
                      : "Utiliser ma position"}
                  </Text>

                  <Text className="mt-0.5 text-xs text-white/35">
                    Aucun déplacement automatique sans votre permission
                  </Text>
                </View>

                <ArrowRight size={16} className="text-white/25" />
              </Pressable>

              {(locationNotice || locationError) && (
                <Text className={cnLocationMessage(Boolean(locationError))}>
                  {locationError ?? locationNotice}
                </Text>
              )}

              {/* Country search */}
              <View className="relative mb-3 shrink-0">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <TextInput
                  value={countrySearch}
                  onChangeText={(text) => setCountrySearch(text)}
                  placeholder="Rechercher votre pays..."
                  accessibilityLabel="Rechercher un pays"
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] py-3.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/25"
                />
              </View>

              {/* Countries */}
              <View
                className="min-h-0 flex-1 overflow-y-auto pb-4"
                style={{  }}
              >
                <View className="gap-2">
                  {filteredCountries.map((country, index) => {
                    const selected = country.code === countryCode;

                    return (
                      <Pressable
                        key={country.code}
                        type="button"
                        onPress={() => handleCountrySelect(country)}
                        className="relative flex min-h-[62px] items-center gap-2 rounded-2xl border px-3 text-left"
                        style={{ backgroundColor: selected
                                                    ? "rgba(139,92,246,.16)"
                                                    : "rgba(255,255,255,.035)", borderColor: selected
                                                    ? "rgba(139,92,246,.48)"
                                                    : "rgba(255,255,255,.07)" }}
                      >
                        <Text className="text-xl">{country.flag}</Text>

                        <Text className="min-w-0 flex-1 truncate text-xs font-semibold text-white/75">
                          {country.name}
                        </Text>

                        {selected && (
                          <CheckCircle2
                            size={15}
                            className="shrink-0 text-violet-400"
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>

                {filteredCountries.length === 0 && (
                  <View className="py-12 text-center">
                    <Globe2 size={30} className="mx-auto mb-3 text-white/15" />

                    <Text className="text-sm font-semibold text-white/50">
                      Pays introuvable
                    </Text>

                    <Text className="mt-1 text-xs text-white/25">
                      Essayez une autre recherche.
                    </Text>
                  </View>
                )}

                {/* City */}
                {countryCode && (
                  <View
                    className="mt-5"
                  >
                    <View className="mb-2 flex items-center justify-between">
                      <View>
                        <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">
                          Ville
                        </Text>

                        <Text className="mt-0.5 text-xs text-white/25">
                          Facultatif
                        </Text>
                      </View>

                      {city && (
                        <Pressable
                         
                          onPress={() => {
                            setCity("");
                            setCitySearch("");
                          }}
                          className="text-xs text-white/30"
                        >
                          <Text>Modifier</Text></Pressable>
                      )}
                    </View>

                    <View className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                      />

                      <TextInput
                        value={citySearch || city}
                        onChangeText={(text) => {
                          setCity(text);
                          setCitySearch(text);
                        }}
                        placeholder={`Rechercher une ville en ${countryName}`}
                        accessibilityLabel="Rechercher une ville"
                        className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] py-3.5 pl-11 pr-10 text-sm text-white outline-none placeholder:text-white/25"
                      />

                      {cityLoading && (
                        <View
                          className="absolute right-4 top-1/2 -translate-y-1/2"
                        >
                          <Sparkles size={15} className="text-violet-400" />
                        </View>
                      )}
                    </View>

                    {cityOptions.length > 0 && (
                      <View className="mt-2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d0d20]/95 shadow-2xl">
                        {cityOptions.map((option) => (
                          <Pressable
                            key={`${option.name}-${option.latitude}-${option.longitude}`}
                           
                            onPress={() => {
                              setCity(option.name);
                              setCitySearch(option.name);
                              setCityOptions([]);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-left"
                          >
                            <MapPin size={15} className="text-violet-400" />

                            <Text className="text-sm text-white/75">
                              {option.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View className="shrink-0 py-4">
                <PrimaryButton onPress={goNext} disabled={!countryCode}>
                  <Text>Continuer</Text><ArrowRight size={18} />
                </PrimaryButton>
              </View>
            </View>
          )}

          {/* ==================================================
              STEP 2 — MODULES
          ================================================== */}

          {step === 2 && (
            <View
              key="modules"
              custom={direction}
              className="absolute inset-0 flex flex-col overflow-hidden px-5"
            >
              <View className="shrink-0 pb-5 pt-5">
                <View className="mb-1 flex items-center gap-2">
                  <Sparkles size={17} className="text-indigo-400" />

                  <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-indigo-400">
                    Étape 2 · Personnalisation
                  </Text>
                </View>

                <View className="flex items-end justify-between gap-4">
                  <View>
                    <Text className="text-2xl font-black text-white">
                      Qu'est-ce qui compte pour vous ?
                    </Text>

                    <Text className="mt-1 text-sm text-white/40">
                      DébrouillePro adaptera votre accueil à vos priorités.
                    </Text>
                  </View>

                  <Text className="shrink-0 rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-300">
                    {selectedModules.length}
                  </Text>
                </View>
              </View>

              <View
                className="min-h-0 flex-1 overflow-y-auto pb-4"
                style={{  }}
              >
                <View className="gap-2.5">
                  {MODULES.map((module, index) => {
                    const Icon = module.icon;

                    const selected = selectedModules.includes(module.id);

                    return (
                      <Pressable
                        key={module.id}
                        type="button"
                        onPress={() => toggleModule(module.id)}
                        aria-pressed={selected}
                        className="relative flex min-h-[132px] flex-col items-start rounded-3xl border p-4 text-left"
                        style={{ backgroundColor: selected
                                                    ? `${module.accent}14`
                                                    : "rgba(255,255,255,.035)", borderColor: selected
                                                    ? `${module.accent}55`
                                                    : "rgba(255,255,255,.07)" }}
                      >
                        {selected && (
                          <View
                            className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                            style={{ backgroundColor: module.accent }}
                          >
                            <Check
                              size={12}
                              strokeWidth={3}
                              className="text-white"
                            />
                          </View>
                        )}

                        <View
                          className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ backgroundColor: selected
                                                        ? `${module.accent}20`
                                                        : "rgba(255,255,255,.055)" }}
                        >
                          <Icon
                            size={20}
                            className={selected ? "" : "text-white/40"}
                            style={{
                              color: selected ? module.accent : undefined,
                            }}
                          />
                        </View>

                        <Text
                          className="text-sm font-bold"
                          style={{
                            color: selected ? "#fff" : "rgba(255,255,255,.65)",
                          }}
                        >
                          {module.label}
                        </Text>

                        <Text className="mt-1 text-[11px] leading-relaxed text-white/30">
                          {module.description}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="shrink-0 py-4">
                <PrimaryButton
                  onPress={goNext}
                  disabled={selectedModules.length === 0}
                >
                  <Text>Continuer</Text><ArrowRight size={18} />
                </PrimaryButton>
              </View>
            </View>
          )}

          {/* ==================================================
              STEP 3 — PROFILE
          ================================================== */}

          {step === 3 && (
            <View
              key="profile"
              custom={direction}
              className="absolute inset-0 flex flex-col overflow-y-auto px-5"
            >
              <View className="pb-5 pt-5">
                <View className="mb-1 flex items-center gap-2">
                  <UserRound size={17} className="text-emerald-400" />

                  <Text className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                    Étape 3 · Profil
                  </Text>
                </View>

                <Text className="text-2xl font-black text-white">
                  Une dernière touche
                </Text>

                <Text className="mt-1 text-sm text-white/40">
                  Comment souhaitez-vous être accueilli ?
                </Text>
              </View>

              {/* Avatar visual */}
              <View className="mb-7 flex flex-col items-center">
                <View
                  className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] text-4xl font-black text-white"
                  style={{  }}
                >
                  {firstName ? firstName.trim().charAt(0).toUpperCase() : "?"}

                  <View className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#050616] bg-violet-600">
                    <Camera size={15} className="text-white" />
                  </View>
                </View>

                <Text className="mt-3 text-xs text-white/25">
                  Votre photo pourra être ajoutée depuis votre profil.
                </Text>
              </View>

              {/* Name */}
              <View className="mb-6">
                <Text
                  htmlFor="onboarding-first-name"
                  className="mb-2 block text-[11px] font-bold uppercase tracking-[0.12em] text-white/35"
                >
                  Prénom
                </Text>

                <TextInput
                  id="onboarding-first-name"
                  value={firstName}
                  onChangeText={(text) =>
                    setFirstName(text.slice(0, 60))
                  }
                  placeholder="Comment devons-nous vous appeler ?"
                 
                  className="w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none placeholder:text-white/25"
                />
              </View>

              {/* Summary */}
              <View
                className="mb-6 rounded-3xl border border-white/[0.07] p-4"
                style={{  }}
              >
                <View className="mb-4 flex items-center justify-between">
                  <Text className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">
                    Votre configuration
                  </Text>

                  <Sparkles size={15} className="text-violet-400" />
                </View>

                <View className="space-y-3">
                  {countryCode && (
                    <SummaryRow
                      icon={<MapPin size={15} />}
                      label="Localisation"
                      value={city ? `${city}, ${countryName}` : countryName}
                    />
                  )}

                  <SummaryRow
                    icon={<Sparkles size={15} />}
                    label="Centres d'intérêt"
                    value={`${selectedModules.length} module${
                      selectedModules.length > 1 ? "s" : ""
                    }`}
                  />

                  <SummaryRow
                    icon={<Globe2 size={15} />}
                    label="Expérience"
                    value="Personnalisée"
                  />
                </View>
              </View>

              <View className="mt-auto pb-6">
                <Pressable
                  type="button"
                  onPress={() => void handleComplete()}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-black text-white disabled:cursor-wait disabled:opacity-60"
                  style={{  }}
                >
                  {saving ? (
                    <>
                      <View
                      >
                        <Sparkles size={19} />
                      </View>
                      <Text>Préparation de votre espace...</Text></>
                  ) : (
                    <>
                      <CheckCircle2 size={19} />
                      <Text>Entrer dans DébrouillePro</Text></>
                  )}
                </Pressable>

                <Text className="mt-3 text-center text-[10px] leading-relaxed text-white/20">
                  Vous pourrez modifier ces préférences à tout moment dans votre
                  profil.
                </Text>
              </View>
            </View>
          )}
        </>
      </View>
    </View>
  );
}

/* ============================================================
 * SMALL UI COMPONENTS
 * ============================================================ */

function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      type="button"
      onPress={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-30"
      style={{  }}
    >
      {children}
    </Pressable>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex items-center gap-3">
      <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-violet-400">
        {icon}
      </View>

      <View className="min-w-0">
        <Text className="text-[10px] uppercase tracking-[0.1em] text-white/25">
          {label}
        </Text>

        <Text className="truncate text-sm font-semibold text-white/70">{value}</Text>
      </View>
    </View>
  );
}

function cnLocationMessage(error: boolean): string {
  return [
    "mb-3 px-1 text-[11px]",
    error ? "text-amber-400/70" : "text-emerald-400/70",
  ].join(" ");
}

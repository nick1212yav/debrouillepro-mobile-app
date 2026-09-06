import { UIService } from "@/core/sdk/ui/UIService";
import { Pressable, View, Text, TextInput } from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useBadges } from "@/hooks/use-badges";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Bus,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  Factory,
  Globe2,
  GraduationCap,
  HeartPulse,
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
  X,
  Zap,
} from "lucide-react-native";
import Confetti, { useConfetti } from "@/components/Confetti";

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
   GLOBAL COUNTRY ENGINE
============================================================ */

/**
 * On ne limite plus DébrouillePro à une liste de pays.
 *
 * Le runtime fournit les régions ISO disponibles.
 * Le nom est ensuite traduit selon la langue du navigateur.
 */
function getWorldCountries(): string[] {
  try {
    if (
      typeof Intl !== "undefined" &&
      typeof Intl.supportedValuesOf === "function"
    ) {
      return (Intl.supportedValuesOf as (key: string) => string[])(
        "region",
      ).filter((code) => /^[A-Z]{2}$/.test(code));
    }
  } catch {
    // fallback
  }

  return [];
}

function getLanguage(): string {
  if (typeof undefined === "undefined") return "fr";

  return "en"?.split("-")[0]?.toLowerCase() || "fr";
}

function getCountryName(code: string): string {
  try {
    const language = getLanguage();

    const names = new Intl.DisplayNames([language], {
      type: "region",
    });

    return names.of(code) ?? code;
  } catch {
    return code;
  }
}

function getFlag(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) {
    return "🌍";
  }

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
  Icon: ElementType;
  color: string;
  emoji: string;
}[] = [
  {
    id: "particulier",
    label: "Particulier",
    desc: "Pour ma vie personnelle et familiale",
    Icon: UserRound,
    color: "#3B82F6",
    emoji: "👤",
  },
  {
    id: "professionnel",
    label: "Professionnel",
    desc: "Freelance, artisan, indépendant",
    Icon: Briefcase,
    color: "#8B5CF6",
    emoji: "💼",
  },
  {
    id: "entreprise",
    label: "Entreprise",
    desc: "PME, startup ou grande organisation",
    Icon: Factory,
    color: "#F59E0B",
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
  Icon: ElementType;
  color: string;
  emoji: string;
}[] = [
  {
    id: "immo",
    label: "Immobilier",
    description: "Louer, acheter, vendre",
    Icon: Home,
    color: "#6366F1",
    emoji: "🏠",
  },
  {
    id: "jobs",
    label: "Emploi",
    description: "Jobs & opportunités",
    Icon: Briefcase,
    color: "#10B981",
    emoji: "💼",
  },
  {
    id: "sante",
    label: "Santé",
    description: "Soins & professionnels",
    Icon: Stethoscope,
    color: "#EF4444",
    emoji: "❤️",
  },
  {
    id: "agri",
    label: "Agriculture",
    description: "Production & marché",
    Icon: Tractor,
    color: "#22C55E",
    emoji: "🌾",
  },
  {
    id: "transport",
    label: "Transport",
    description: "Mobilité & déplacements",
    Icon: Truck,
    color: "#3B82F6",
    emoji: "🚕",
  },
  {
    id: "apprendre",
    label: "Éducation",
    description: "Apprendre & progresser",
    Icon: GraduationCap,
    color: "#8B5CF6",
    emoji: "📚",
  },
  {
    id: "paiement",
    label: "Paiement",
    description: "Payer & gérer",
    Icon: Wallet,
    color: "#F59E0B",
    emoji: "💳",
  },
  {
    id: "marketplace",
    label: "Marché",
    description: "Acheter & vendre",
    Icon: ShoppingBag,
    color: "#F97316",
    emoji: "🛍️",
  },
  {
    id: "voyages",
    label: "Voyages",
    description: "Explorer le monde",
    Icon: Plane,
    color: "#14B8A6",
    emoji: "✈️",
  },
  {
    id: "media",
    label: "Médias",
    description: "Actualités & contenus",
    Icon: Newspaper,
    color: "#EC4899",
    emoji: "📰",
  },
  {
    id: "fitness",
    label: "Fitness",
    description: "Sport & bien-être",
    Icon: Dumbbell,
    color: "#F43F5E",
    emoji: "🏋️",
  },
  {
    id: "community",
    label: "Communauté",
    description: "Groupes & rencontres",
    Icon: Users,
    color: "#06B6D4",
    emoji: "👥",
  },
  {
    id: "energie",
    label: "Énergie",
    description: "Énergie & solutions",
    Icon: Zap,
    color: "#EAB308",
    emoji: "⚡",
  },
  {
    id: "environnement",
    label: "Environnement",
    description: "Agir durablement",
    Icon: TreePine,
    color: "#16A34A",
    emoji: "🌿",
  },
  {
    id: "securite",
    label: "Sécurité",
    description: "Protection & prévention",
    Icon: Shield,
    color: "#6366F1",
    emoji: "🛡️",
  },
  {
    id: "juridique",
    label: "Justice",
    description: "Droit & accompagnement",
    Icon: Scale,
    color: "#A78BFA",
    emoji: "⚖️",
  },
  {
    id: "evenements",
    label: "Événements",
    description: "Sorties & expériences",
    Icon: CalendarDays,
    color: "#EC4899",
    emoji: "🎫",
  },
  {
    id: "livraison",
    label: "Livraison",
    description: "Colis & courses",
    Icon: Package,
    color: "#F59E0B",
    emoji: "📦",
  },
  {
    id: "live",
    label: "Live",
    description: "Direct & actualités",
    Icon: Radio,
    color: "#F43F5E",
    emoji: "📡",
  },
  {
    id: "parrainage",
    label: "Parrainage",
    description: "Inviter & gagner",
    Icon: Star,
    color: "#F97316",
    emoji: "🎁",
  },
];

/* ============================================================
   STEP META
============================================================ */

const STEP_META = [
  {
    number: "01",
    icon: Globe2,
    eyebrow: "LOCALISATION",
    title: "Votre monde.",
    subtitle:
      "Dites-nous où vous êtes pour vous montrer ce qui compte vraiment autour de vous.",
    color: "#3B82F6",
  },
  {
    number: "02",
    icon: Users,
    eyebrow: "IDENTITÉ",
    title: "Votre profil.",
    subtitle:
      "DébrouillePro adapte son expérience à votre façon de vivre, travailler et entreprendre.",
    color: "#8B5CF6",
  },
  {
    number: "03",
    icon: Sparkles,
    eyebrow: "PERSONNALISATION",
    title: "Vos priorités.",
    subtitle: "Choisissez les univers que vous voulez voir en premier.",
    color: "#F59E0B",
  },
  {
    number: "04",
    icon: Zap,
    eyebrow: "PRÊT",
    title: "Tout est prêt.",
    subtitle: "Votre expérience DébrouillePro vient d'être configurée.",
    color: "#10B981",
  },
];

/* ============================================================
   LOCATION ENGINE
============================================================ */

async function detectLocation(): Promise<{
  country?: string;
  city?: string;
}> {
  if (typeof undefined === "undefined" || !undefined) {
    return {};
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    undefined.getCurrentPosition(resolve, reject, {
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

  if (!response.ok) {
    throw new Error("Geocoding unavailable");
  }

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
   STEP LOCATION
============================================================ */

function StepLocation({ data, setData }: StepProps) {
  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

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

    if (!q) {
      return countries;
    }

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

        UIService.openToast("Localisation détectée", "success");
      } else {
        UIService.openToast("Choisissez votre pays manuellement.", "info");
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
    <View className="space-y-5">
      {/* Smart location */}
      <Pressable
        type="button"
        onPress={() => void detect()}
        disabled={detecting}
        className="group relative w-full overflow-hidden rounded-3xl border border-blue-400/20 p-4 text-left"
        style={{  }}
      >
        <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-blue-500/10" />

        <View className="relative flex items-center gap-3">
          <View className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
            {detecting ? (
              <View
              >
                <MapPin size={20} className="text-blue-300" />
              </View>
            ) : (
              <MapPin size={20} className="text-blue-300" />
            )}
          </View>

          <View className="min-w-0 flex-1">
            <Text className="font-bold text-white">
              {detecting
                ? "Recherche de votre position..."
                : "Détecter automatiquement"}
            </Text>

            <Text className="mt-0.5 text-xs text-white/35">
              Nous ne vous déplacerons jamais sans votre permission.
            </Text>
          </View>

          <ArrowRight
            size={17}
            className="text-white/25"
          />
        </View>
      </Pressable>

      {locationError && (
        <View className="rounded-2xl border border-amber-400/10 bg-amber-400/5 px-4 py-3 text-xs leading-relaxed text-amber-300/70">
          {locationError}
        </View>
      )}

      {/* City */}
      <View>
        <Text
          htmlFor="onboarding-city"
          className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/30"
        >
          Votre ville
        </Text>

        <View className="relative">
          <MapPin
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
          />

          <TextInput
            id="onboarding-city"
            value={data.city}
            onChangeText={(text) =>
              setData({
                city: text,
              })
            }
            placeholder="Dakar, Kinshasa, Paris, Montréal..."
            className="h-13 w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
          />
        </View>
      </View>

      {/* Country search */}
      <View>
        <Text className="mb-2 block text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
          Votre pays
        </Text>

        <View className="relative">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
          />

          <TextInput
            value={query}
            onChangeText={(text) => setQuery(text)}
            placeholder="Rechercher un pays..."
            className="h-12 w-full rounded-2xl border border-white/[0.08] bg-white/[0.045] pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/20"
          />
        </View>
      </View>

      {/* World */}
      <View
        className="max-h-[270px] overflow-y-auto pr-1"
        style={{  }}
      >
        <View className="gap-2">
          {filteredCountries.map((country) => {
            const selected = data.country === country.name;

            return (
              <Pressable
                key={country.code}
                type="button"
                onPress={() =>
                  setData({
                    country: country.name,
                  })
                }
                className={cn(
                  "relative flex min-h-[58px] items-center gap-2.5 rounded-2xl border px-3 text-left transition-all",
                  selected
                    ? "border-blue-400/45 bg-blue-500/[0.14]"
                    : "border-white/[0.07] bg-white/[0.035] hover:bg-white/[0.06]",
                )}
              >
                <Text className="text-xl">{country.flag}</Text>

                <Text className="min-w-0 flex-1 truncate text-xs font-semibold text-white/70">
                  {country.name}
                </Text>

                {selected && (
                  <CheckCircle2 size={15} className="shrink-0 text-blue-400" />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/* ============================================================
   STEP ROLE
============================================================ */

function StepRole({ data, setData }: StepProps) {
  return (
    <View className="space-y-3">
      {ROLES.map(({ id, label, desc, Icon, color, emoji }) => {
        const selected = data.role === id;

        return (
          <Pressable
            key={id}
            type="button"
            onPress={() =>
              setData({
                role: id,
              })
            }
            className="relative w-full overflow-hidden rounded-3xl border p-5 text-left"
            style={{ backgroundColor: selected ? `${color}12` : "rgba(255,255,255,.035)", borderColor: selected ? `${color}55` : "rgba(255,255,255,.07)" }}
          >
            {selected && (
              <View
                className="absolute inset-0"
                style={{  }}
              />
            )}

            <View className="relative flex items-center gap-4">
              <View
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: selected
                                    ? `${color}20`
                                    : "rgba(255,255,255,.055)" }}
              >
                <Text className="text-2xl">{emoji}</Text>
              </View>

              <View className="min-w-0 flex-1">
                <View
                  className="text-base font-black"
                  style={{  }}
                >
                  {label}
                </View>

                <View className="mt-1 text-xs text-white/35">{desc}</View>
              </View>

              <View
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border"
                style={{ backgroundColor: selected ? color : "transparent", borderColor: selected ? color : "rgba(255,255,255,.12)" }}
              >
                {selected && (
                  <Check size={14} strokeWidth={3} className="text-white" />
                )}
              </View>
            </View>
          </Pressable>
        );
      })}

      <Text className="pt-3 text-center text-[11px] text-white/20">
        Vous pourrez modifier votre profil plus tard.
      </Text>
    </View>
  );
}

/* ============================================================
   STEP MODULES
============================================================ */

function StepModules({ data, setData }: StepProps) {
  const toggle = (id: string) => {
    const selected = data.favoriteModules.includes(id);

    const next = selected
      ? data.favoriteModules.filter((module) => module !== id)
      : [...data.favoriteModules, id];

    setData({
      favoriteModules: next,
    });
  };

  return (
    <View className="space-y-4">
      {/* Counter */}
      <View className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.035] px-4 py-3">
        <View>
          <Text className="text-xs font-bold text-white/60">Votre sélection</Text>

          <Text className="mt-0.5 text-[10px] text-white/25">
            Choisissez au minimum 3 univers
          </Text>
        </View>

        <View
          className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-black"
          style={{ backgroundColor: data.favoriteModules.length >= 3
                          ? "rgba(16,185,129,.15)"
                          : "rgba(245,158,11,.12)" }}
        >
          {data.favoriteModules.length}
        </View>
      </View>

      <View
        className="gap-2.5"
        style={{ maxHeight: 390, overflowY: "auto" }}
      >
        {MODULES.map(
          ({ id, label, description, Icon, color, emoji }, index) => {
            const selected = data.favoriteModules.includes(id);

            return (
              <Pressable
                key={id}
                type="button"
                onPress={() => toggle(id)}
                aria-pressed={selected}
                className="relative flex min-h-[122px] flex-col items-start overflow-hidden rounded-3xl border p-4 text-left"
                style={{ backgroundColor: selected
                                    ? `${color}12`
                                    : "rgba(255,255,255,.035)", borderColor: selected
                                    ? `${color}55`
                                    : "rgba(255,255,255,.07)" }}
              >
                {selected && (
                  <View
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full"
                    style={{ backgroundColor: color }}
                  >
                    <Check size={11} strokeWidth={3} className="text-white" />
                  </View>
                )}

                <View
                  className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: selected
                                        ? `${color}20`
                                        : "rgba(255,255,255,.055)" }}
                >
                  <Icon
                    size={20}
                    style={{
                      color: selected ? color : "rgba(255,255,255,.38)",
                    }}
                  />
                </View>

                <Text
                  className="text-xs font-black"
                  style={{
                    color: selected ? "#fff" : "rgba(255,255,255,.6)",
                  }}
                >
                  {label}
                </Text>

                <Text className="mt-1 text-[9px] leading-relaxed text-white/25">
                  {description}
                </Text>

                <Text className="absolute bottom-3 right-3 text-sm opacity-70">
                  {emoji}
                </Text>
              </Pressable>
            );
          },
        )}
      </View>

      <>
        {data.favoriteModules.length < 3 && (
          <Text
            className="text-center text-[11px] text-amber-400/60"
          >
            <Text>Encore</Text>{3 - data.favoriteModules.length} <Text>sélection</Text>{3 - data.favoriteModules.length > 1 ? "s" : ""} <Text>pour continuer.</Text></Text>
        )}
      </>
    </View>
  );
}

/* ============================================================
   FINISH
============================================================ */

function StepFinish({ data }: { data: OnboardingData }) {
  const selected = data.favoriteModules
    .map((id) => MODULES.find((module) => module.id === id))
    .filter(Boolean);

  return (
    <View className="flex flex-col items-center space-y-6 text-center">
      <View
        className="relative flex h-28 w-28 items-center justify-center rounded-[2.25rem]"
        style={{  }}
      >
        <CheckCircle2 size={54} strokeWidth={1.7} className="text-white" />

        <View
          className="absolute inset-[-12px] rounded-[2.6rem] border border-emerald-400/20"
        />
      </View>

      <View>
        <Text className="text-2xl font-black text-white">
          Bienvenue dans votre nouveau monde.
        </Text>

        <Text className="mt-2 text-sm leading-relaxed text-white/40">
          {data.city && data.country
            ? `${data.city}, ${data.country}`
            : data.country || "Votre expérience personnalisée est prête."}
        </Text>
      </View>

      {/* XP */}
      <View
        className="flex items-center gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/[0.08] px-5 py-3"
      >
        <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15">
          <Zap size={18} className="text-amber-400" />
        </View>

        <View className="text-left">
          <Text className="text-[9px] font-bold uppercase tracking-widest text-amber-400/50">
            Récompense
          </Text>

          <Text className="text-sm font-black text-amber-300">
            +100 XP de bienvenue
          </Text>
        </View>
      </View>

      {/* Summary */}
      {selected.length > 0 && (
        <View className="w-full rounded-3xl border border-white/[0.07] bg-white/[0.035] p-4">
          <View className="mb-3 flex items-center justify-between">
            <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
              Vos univers
            </Text>

            <Sparkles size={14} className="text-violet-400" />
          </View>

          <View className="flex flex-wrap justify-center gap-2">
            {selected.slice(0, 8).map((module) =>
              module ? (
                <Text
                  key={module.id}
                  className="rounded-full border px-3 py-1.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${module.color}12`, color: module.color, borderColor: `${module.color}30` }}
                >
                  {module.emoji} {module.label}
                </Text>
              ) : null,
            )}
          </View>
        </View>
      )}

      <Text className="max-w-sm text-xs leading-relaxed text-white/20">
        DébrouillePro va maintenant personnaliser votre expérience à partir de
        vos choix.
      </Text>
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
  const reducedMotion = useReducedMotion();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
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

  /**
   * VRAIE MUTATION CONVEX EXISTANTE
   */
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const { checkBadges, awardXp } = useBadges();

  /* ----------------------------------------------------------
     PATCH
  ---------------------------------------------------------- */

  const patchData = useCallback((patch: Partial<OnboardingData>) => {
    setData((current) => ({
      ...current,
      ...patch,
    }));
  }, []);

  /* ----------------------------------------------------------
     VALIDATION
  ---------------------------------------------------------- */

  const canNext = useMemo(() => {
    if (step === 0) {
      return data.city.trim().length > 0 && data.country.trim().length > 0;
    }

    if (step === 1) {
      return Boolean(data.role);
    }

    if (step === 2) {
      return data.favoriteModules.length >= 3;
    }

    return true;
  }, [data, step]);

  /* ----------------------------------------------------------
     NAVIGATION
  ---------------------------------------------------------- */

  const next = useCallback(() => {
    if (!canNext || loading) {
      return;
    }

    setDirection(1);

    setStep((current) => Math.min(current + 1, STEP_COUNT - 1));
  }, [canNext, loading]);

  const prev = useCallback(() => {
    if (loading) {
      return;
    }

    setDirection(-1);

    setStep((current) => Math.max(current - 1, 0));
  }, [loading]);

  /* ----------------------------------------------------------
     FINISH — BACKEND
  ---------------------------------------------------------- */

  const finish = useCallback(async () => {
    if (loading) {
      return;
    }

    if (!email) {
      UIService.openToast("Utilisateur non connecté", "error");

      return;
    }

    setLoading(true);

    try {
      fire();

      /**
       * Le rôle reste compatible avec le backend existant :
       * tableau de rôles.
       */
      const roles = data.role ? [data.role] : ["particulier"];

      /**
       * Les intérêts sont ceux définis par l'utilisateur.
       * Si aucun intérêt séparé n'existe encore,
       * les modules choisis deviennent les intérêts.
       */
      const interests =
        data.interests.length > 0 ? data.interests : data.favoriteModules;

      await completeOnboarding({
        email,
        city: data.city.trim(),
        country: data.country.trim(),
        roles,
        interests,
      });

      /**
       * Récompense réelle du système existant.
       */
      await awardXp(100, "Onboarding complété", "onboarding").catch(() => null);

      /**
       * Badge réel du système existant.
       */
      await checkBadges("onboarding_completed").catch(() => null);

      /**
       * Petite respiration UX.
       * Pas nécessaire au backend :
       * uniquement pour laisser l'animation de réussite
       * exister avant le changement d'écran.
       */
      if (!reducedMotion) {
        await new Promise((resolve) => setTimeout(resolve, 850));
      }

      onComplete();
    } catch (error) {
      console.error("Onboarding completion error:", error);

      UIService.openToast("Impossible de terminer la configuration. Vérifiez votre connexion puis réessayez.", "error");

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
    reducedMotion,
  ]);

  /* ----------------------------------------------------------
     KEYBOARD
  ---------------------------------------------------------- */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        return;
      }

      if (event.key === "Enter" && canNext && !loading) {
        if (step === STEP_COUNT - 1) {
          void finish();
        } else {
          next();
        }
      }

      if (event.key === "ArrowLeft" && step > 0 && !loading) {
        prev();
      }

      if (event.key === "ArrowRight" && canNext && !loading) {
        if (step < STEP_COUNT - 1) {
          next();
        }
      }
    };

    undefined;

    return () => undefined;
  }, [canNext, finish, loading, next, prev, step]);

  const meta = STEP_META[step];
  const Icon = meta.icon;

  const progress = ((step + 1) / STEP_COUNT) * 100;

  /* ----------------------------------------------------------
     MOTION
  ---------------------------------------------------------- */

  const variants = {
    enter: (dir: number) => ({
      x: reducedMotion ? 0 : dir > 0 ? 70 : -70,
      opacity: 0,
    }),

    center: {
      x: 0,
      opacity: 1,
    },

    exit: (dir: number) => ({
      x: reducedMotion ? 0 : dir > 0 ? -70 : 70,
      opacity: 0,
    }),
  };

  return (
    <View
      className="fixed inset-0 z-50 flex flex-col overflow-hidden text-white"
      style={{  }}
    >
      {confettiEl}

      {/* ======================================================
          AMBIENT LIGHT
      ====================================================== */}

      <View
        key={`glow-${step}`}
        className="absolute inset-0"
        style={{  }}
      />

      <View
        className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30"
        style={{  }}
      />

      {/* ======================================================
          HEADER
      ====================================================== */}

      <View className="relative z-10 shrink-0 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
        <View className="flex items-center justify-between">
          <Pressable
           
            onPress={prev}
            disabled={step === 0 || loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.035] disabled:pointer-events-none disabled:opacity-0"
            accessibilityLabel="Étape précédente"
          >
            <ArrowLeft size={18} className="text-white/65" />
          </Pressable>

          {/* Logo */}
          <View className="flex items-center gap-2">
            <View
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{  }}
            >
              <Globe2 size={17} className="text-white" />
            </View>

            <Text className="text-sm font-black tracking-tight">
              Débrouille
              <Text className="text-violet-400">Pro</Text>
            </Text>
          </View>

          <View className="flex h-10 w-10 items-center justify-center">
            <Text className="text-[10px] font-bold text-white/25">
              {String(step + 1).padStart(2, "0")}/
              {String(STEP_COUNT).padStart(2, "0")}
            </Text>
          </View>
        </View>

        {/* Progress */}
        <View className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <View
            className="h-full rounded-full"
            style={{  }}
          />
        </View>
      </View>

      {/* ======================================================
          STEP HEADER
      ====================================================== */}

      <View
        key={`title-${step}`}
        className="relative z-10 shrink-0 px-6 pb-5 pt-5 text-center"
      >
        <View
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border"
          style={{ backgroundColor: `${meta.color}12`, borderColor: `${meta.color}25` }}
        >
          <Icon
            size={26}
            style={{
              color: meta.color,
            }}
          />
        </View>

        <Text
          className="text-[9px] font-black tracking-[0.25em]"
          style={{
            color: `${meta.color}cc`,
          }}
        >
          {meta.number} · {meta.eyebrow}
        </Text>

        <Text className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {meta.title}
        </Text>

        <Text className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-white/35">
          {meta.subtitle}
        </Text>
      </View>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <View className="relative z-10 min-h-0 flex-1 overflow-hidden px-5 sm:px-6">
        <>
          <View
            key={step}
            custom={direction}
            className="h-full overflow-y-auto pb-4"
            style={{  }}
          >
            {step === 0 && <StepLocation data={data} setData={patchData} />}

            {step === 1 && <StepRole data={data} setData={patchData} />}

            {step === 2 && <StepModules data={data} setData={patchData} />}

            {step === 3 && <StepFinish data={data} />}
          </View>
        </>
      </View>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <View className="relative z-10 shrink-0 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 sm:px-6">
        <Pressable
          type="button"
          onPress={step === STEP_COUNT - 1 ? () => void finish() : next}
          disabled={!canNext || loading}
          className="relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-sm font-black disabled:cursor-not-allowed"
          style={
            canNext
              ? {  }
              : { backgroundColor: "rgba(255,255,255,.06)" }
          }
        >
          {canNext && !loading && (
            <View
              className="absolute inset-y-0 w-20 -skew-x-12 bg-white/10"
            />
          )}

          <Text className="relative z-10">
            {loading
              ? "Préparation de votre espace..."
              : step === STEP_COUNT - 1
                ? "Entrer dans DébrouillePro"
                : "Continuer"}
          </Text>

          <Text className="relative z-10">
            {loading ? (
              <Text
              >
                <Sparkles size={18} />
              </Text>
            ) : step === STEP_COUNT - 1 ? (
              <CheckCircle2 size={18} />
            ) : (
              <ArrowRight size={18} />
            )}
          </Text>
        </Pressable>

        <View className="mt-3 flex items-center justify-center gap-2">
          <Text className="h-1 w-1 rounded-full bg-emerald-400/60" />

          <Text className="text-[9px] font-medium text-white/20">
            <Text>Vos préférences sont enregistrées de manière sécurisée</Text></Text>

          <Text className="h-1 w-1 rounded-full bg-emerald-400/60" />
        </View>
      </View>
    </View>
  );
}

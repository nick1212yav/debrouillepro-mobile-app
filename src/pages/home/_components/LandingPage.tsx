import { Link } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Globe2,
  HeartPulse,
  Lightbulb,
  MapPin,
  Menu,
  MessageCircle,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
  Zap,
} from "lucide-react-native";

import { SignInButton } from "@/components/ui/signin";

/* ============================================================================
 * PRODUCT POSITIONING
 *
 * Ces données décrivent les capacités du produit.
 * Elles ne prétendent pas représenter des statistiques réelles.
 * ========================================================================== */

const PILLARS = [
  {
    id: "discover",
    icon: Compass,
    eyebrow: "DÉCOUVRIR",
    title: "Trouve ce dont tu as besoin.",
    description:
      "Explore les services, opportunités, personnes, commerces et ressources qui comptent vraiment pour toi.",
    color: "#818cf8",
    glow: "rgba(129,140,248,.22)",
  },
  {
    id: "act",
    icon: Zap,
    eyebrow: "AGIR",
    title: "Passe de l'idée à l'action.",
    description:
      "Publie, recherche, contacte, réserve, candidate ou lance ton projet depuis un même espace.",
    color: "#a78bfa",
    glow: "rgba(167,139,250,.22)",
  },
  {
    id: "connect",
    icon: Users,
    eyebrow: "CONNECTER",
    title: "Les bonnes personnes, au bon moment.",
    description:
      "Une communauté conçue pour créer des connexions utiles, locales et internationales.",
    color: "#c084fc",
    glow: "rgba(192,132,252,.20)",
  },
];

const MODULES = [
  {
    icon: Briefcase,
    title: "Emploi",
    description: "Opportunités et carrière",
    color: "#8b5cf6",
  },
  {
    icon: Building2,
    title: "Immobilier",
    description: "Logement et propriétés",
    color: "#f97316",
  },
  {
    icon: HeartPulse,
    title: "Santé",
    description: "Services et ressources",
    color: "#ef4444",
  },
  {
    icon: Wallet,
    title: "Finance",
    description: "Gérer et développer",
    color: "#10b981",
  },
  {
    icon: Compass,
    title: "Explorer",
    description: "Découvrir autour de soi",
    color: "#6366f1",
  },
  {
    icon: MessageCircle,
    title: "Messages",
    description: "Rester connecté",
    color: "#06b6d4",
  },
];

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: "Pensé pour la confiance",
    description:
      "Tes interactions et ton identité restent au cœur de l'expérience.",
  },
  {
    icon: Globe2,
    title: "Local et international",
    description:
      "Commence près de chez toi et garde le monde à portée de main.",
  },
  {
    icon: Lightbulb,
    title: "Une expérience qui évolue",
    description:
      "Une plateforme conçue pour accueillir de nouveaux services sans te perdre.",
  },
];

const ROTATING_WORDS = [
  "ta vie",
  "tes projets",
  "tes opportunités",
  "ta communauté",
  "ton quotidien",
];

/* ============================================================================
 * COMPONENT
 * ========================================================================== */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(0 > 24);
    };

    undefined;

    return () => {
      undefined;
    };
  }, []);

  useEffect(() => {
    const timer = undefined;

    return () => undefined;
  }, []);

  const currentWord = useMemo(() => ROTATING_WORDS[wordIndex], [wordIndex]);

  return (
    <View className="relative min-h-screen overflow-x-hidden bg-[#05050d] text-white selection:bg-violet-500/30">
      {/* =====================================================================
          BACKGROUND SYSTEM
      ====================================================================== */}

      <BackgroundAtmosphere />

      {/* =====================================================================
          NAVIGATION
      ====================================================================== */}

      <View
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled
            ? "border-b border-white/[0.07] bg-[#05050d]/80 backdrop-blur-2xl"
            : "bg-transparent",
        ].join(" ")}
      >
        <View className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />

          {/* Desktop navigation */}

          <View className="hidden items-center gap-8 md:flex">
            <Anchor href="#vision"><Text>Vision</Text></Anchor>
            <Anchor href="#modules"><Text>Modules</Text></Anchor>
            <Anchor href="#experience"><Text>Expérience</Text></Anchor>
            <Anchor href="#trust"><Text>Confiance</Text></Anchor>
          </View>

          <View className="hidden items-center gap-3 md:flex">
            <SignInButton className="!rounded-xl !px-4 !py-2 !text-xs" />

            <Link
              href="/auth?mode=register"
              className="group flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-[#09090f]"
            >
              <Text>Commencer</Text><ArrowUpRight
                size={13}
                className=""
              />
            </Link>
          </View>

          {/* Mobile menu */}

          <Pressable
           
            onPress={() => setMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] md:hidden"
            accessibilityLabel="Ouvrir le menu"
          >
            <Menu size={18} />
          </Pressable>
        </View>
      </View>

      <>
        {menuOpen && <MobileMenu onClose={() => setMenuOpen(false)} />}
      </>

      {/* =====================================================================
          HERO
      ====================================================================== */}

      <View className="relative z-10 px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
        <View className="mx-auto max-w-7xl">
          <View className="items-center gap-14 lg:gap-20">
            {/* Hero copy */}

            <View className="max-w-3xl">
              <View
                className="mb-7 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3.5 py-2"
              >
                <Text className="relative flex h-2 w-2">
                  <Text className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
                  <Text className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
                </Text>

                <Text className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
                  Une nouvelle façon de vivre le quotidien
                </Text>
              </View>

              <Text
                className="text-balance text-[clamp(3.1rem,8vw,6.8rem)] font-black leading-[0.92] tracking-[-0.055em]"
              >
                <Text>Le monde</Text><br />
                <Text className="relative inline-block">
                  <Text className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    commence ici.
                  </Text>

                  <Text
                    className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 opacity-60"
                  />
                </Text>
              </Text>

              <Text
                className="mt-7 max-w-xl text-base leading-7 text-white/50 sm:text-lg sm:leading-8"
              >
                <Text>Une plateforme pour découvrir, connecter et agir. Emploi, logement, services, communauté, opportunités et bien plus — réunis dans une expérience simple.</Text></Text>

              {/* Dynamic sentence */}

              <View
                className="mt-7 flex min-h-8 items-center gap-2 text-sm text-white/35"
              >
                <Sparkles size={15} className="shrink-0 text-violet-400" />

                <Text>Conçu pour</Text>

                <>
                  <Text
                    key={currentWord}
                    className="font-bold text-white"
                  >
                    {currentWord}
                  </Text>
                </>
              </View>

              {/* CTA */}

              <View
                className="mt-9 flex flex-col gap-3 sm:flex-row"
              >
                <SignInButton className="!h-12 !rounded-2xl !px-7 !text-sm sm:!h-13" />

                <Link
                  href="/auth?mode=register"
                  className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-7 text-sm font-bold text-white sm:h-13"
                >
                  <Text>Créer mon espace</Text><ArrowRight
                    size={15}
                    className=""
                  />
                </Link>
              </View>

              <View
                className="mt-5 flex flex-wrap gap-x-5 gap-y-2"
              >
                <MiniTrust text="Aucun engagement" />
                <MiniTrust text="Expérience sécurisée" />
                <MiniTrust text="Pensé pour tous" />
              </View>
            </View>

            {/* Hero visual */}

            <HeroVisual />
          </View>
        </View>
      </View>

      {/* =====================================================================
          VISION
      ====================================================================== */}

      <View
        id="vision"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <View className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="UNE SEULE EXPÉRIENCE"
            title={
              <>
                <Text>Moins d'applications.</Text><br />
                <Text className="text-white/35">Plus de possibilités.</Text>
              </>
            }
            description="Débrouille Pro rassemble les expériences essentielles du quotidien dans une plateforme qui s'adapte à tes besoins."
          />

          <View className="mt-12 gap-4">
            {PILLARS.map((pillar, index) => (
              <PillarCard key={pillar.id} pillar={pillar} index={index} />
            ))}
          </View>
        </View>
      </View>

      {/* =====================================================================
          MODULES
      ====================================================================== */}

      <View
        id="modules"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <View className="mx-auto max-w-7xl">
          <View className="items-end gap-8">
            <SectionHeading
              eyebrow="TON ÉCOSYSTÈME"
              title={
                <>
                  <Text>Tout commence</Text><br />
                  <Text className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    avec un besoin.
                  </Text>
                </>
              }
              description="Chaque module répond à un usage concret. Et l'expérience reste unifiée."
            />

            <Link
              href="/auth?mode=register"
              className="group hidden items-center gap-2 text-sm font-bold text-violet-300 lg:flex"
            >
              <Text>Découvrir la plateforme</Text><ArrowRight
                size={15}
                className=""
              />
            </Link>
          </View>

          <View className="mt-12 gap-3">
            {MODULES.map((module, index) => (
              <ModuleCard key={module.title} module={module} index={index} />
            ))}
          </View>
        </View>
      </View>

      {/* =====================================================================
          EXPERIENCE
      ====================================================================== */}

      <View
        id="experience"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <View className="mx-auto max-w-7xl">
          <View className="overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.025]">
            <View className="">
              <View className="relative overflow-hidden p-7 sm:p-10 lg:p-14">
                <View className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-600/15" />

                <Text className="relative text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                  L'expérience
                </Text>

                <Text className="relative mt-5 max-w-xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                  Une plateforme qui
                  <Text className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                    {" "}
                    comprend le contexte.
                  </Text>
                </Text>

                <Text className="relative mt-5 max-w-lg text-sm leading-7 text-white/45 sm:text-base">
                  Au lieu de te faire naviguer entre une multitude d'outils,
                  Débrouille Pro cherche à rapprocher ce dont tu as besoin, là
                  où tu en as besoin.
                </Text>

                <View className="relative mt-8 space-y-3">
                  <ExperiencePoint
                    number="01"
                    title="Découvre"
                    text="Explore les possibilités disponibles autour de toi."
                  />

                  <ExperiencePoint
                    number="02"
                    title="Choisis"
                    text="Compare et trouve ce qui correspond réellement à ton besoin."
                  />

                  <ExperiencePoint
                    number="03"
                    title="Agis"
                    text="Passe directement à l'action depuis la même expérience."
                  />
                </View>
              </View>

              <ExperienceVisual />
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================================
          TRUST
      ====================================================================== */}

      <View
        id="trust"
        className="relative z-10 scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28"
      >
        <View className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="CONSTRUIRE LA CONFIANCE"
            title={
              <>
                <Text>Une grande plateforme</Text><br />
                <Text className="text-white/35">
                  commence par de bonnes bases.
                </Text>
              </>
            }
            description="La simplicité ne doit jamais sacrifier la confiance. L'expérience est pensée autour de la sécurité, de la clarté et du contrôle."
          />

          <View className="mt-12 gap-4">
            {TRUST_POINTS.map((point, index) => (
              <TrustCard key={point.title} point={point} index={index} />
            ))}
          </View>
        </View>
      </View>

      {/* =====================================================================
          FINAL CTA
      ====================================================================== */}

      <View className="relative z-10 px-5 pb-10 pt-20 sm:px-8 sm:pb-16 sm:pt-28">
        <View className="mx-auto max-w-5xl">
          <View
            className="relative overflow-hidden rounded-[2rem] border border-violet-400/20 bg-gradient-to-br from-indigo-500/[0.14] via-violet-500/[0.10] to-fuchsia-500/[0.08] px-6 py-14 text-center sm:px-12 sm:py-20"
          >
            <View className="absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/20" />

            <View className="relative">
              <View
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.07]"
              >
                <Globe2 size={25} className="text-violet-300" />
              </View>

              <Text className="mx-auto mt-6 max-w-2xl text-3xl font-black tracking-tight text-white sm:text-5xl">
                Le prochain chapitre
                <br />
                <Text className="bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  commence avec toi.
                </Text>
              </Text>

              <Text className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
                Rejoins l'expérience et découvre une nouvelle façon de trouver,
                connecter et agir.
              </Text>

              <View className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <SignInButton className="!h-12 !rounded-2xl !px-7 !text-sm" />

                <Link
                  href="/auth?mode=register"
                  className="group flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-7 text-sm font-bold text-white"
                >
                  <Text>Créer mon compte</Text><ArrowRight
                    size={15}
                    className=""
                  />
                </Link>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* =====================================================================
          FOOTER
      ====================================================================== */}

      <View className="relative z-10 border-t border-white/[0.06] px-5 py-8 sm:px-8">
        <View className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Brand compact />

          <View className="flex flex-wrap items-center gap-5 text-[10px] font-medium text-white/30">
            <Link
              href="/privacy"
              className=""
            >
              <Text>Confidentialité</Text></Link>

            <Link href="/terms" className="">
              <Text>Conditions</Text></Link>

            <Text>© {new Date().getFullYear()} Débrouille Pro</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * BACKGROUND
 * ========================================================================== */

function BackgroundAtmosphere() {
  return (
    <View
     
      className="fixed inset-0 z-0 overflow-hidden"
    >
      <View className="absolute left-1/2 top-[-20rem] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-indigo-600/[0.12]" />

      <View className="absolute right-[-15rem] top-[20%] h-[30rem] w-[30rem] rounded-full bg-violet-600/[0.10]" />

      <View className="absolute bottom-[-15rem] left-[-10rem] h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/[0.07]" />

      <View
        className="absolute inset-0 opacity-[0.025]"
        style={{  }}
      />
    </View>
  );
}

/* ============================================================================
 * BRAND
 * ========================================================================== */

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5"
      accessibilityLabel="Débrouille Pro"
    >
      <View
        className={[
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20",
          compact ? "h-8 w-8" : "h-9 w-9",
        ].join(" ")}
      >
        <Globe2
          size={compact ? 16 : 18}
          strokeWidth={2.2}
          className="text-white"
        />

        <Text className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
      </View>

      <Text
        className={[
          "font-black tracking-[-0.03em] text-white",
          compact ? "text-sm" : "text-base",
        ].join(" ")}
      >
        Débrouille
        <Text className="text-violet-400">Pro</Text>
      </Text>
    </Link>
  );
}

/* ============================================================================
 * ANCHOR
 * ========================================================================== */

function Anchor({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
     
      className="text-xs font-semibold text-white/45"
     data-href={href}>
      {children}
    </Pressable>
  );
}

/* ============================================================================
 * HERO VISUAL
 * ========================================================================== */

function HeroVisual() {
  return (
    <View
      className="relative mx-auto w-full max-w-[570px]"
    >
      {/* Outer glow */}

      <View className="absolute inset-10 rounded-full bg-violet-500/20" />

      {/* Main device */}

      <View className="relative mx-auto w-full max-w-[480px]">
        <View className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0b0b18]/90 p-2 shadow-[0_35px_100px_rgba(0,0,0,.55)]">
          {/* Top bar */}

          <View className="flex items-center justify-between px-4 py-3">
            <View className="flex items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emerald-400" />

              <Text className="text-[9px] font-bold text-white/35">
                DÉBROUILLE PRO
              </Text>
            </View>

            <View className="flex gap-1">
              <Text className="h-1.5 w-1.5 rounded-full bg-white/15" />
              <Text className="h-1.5 w-1.5 rounded-full bg-white/15" />
              <Text className="h-1.5 w-1.5 rounded-full bg-white/15" />
            </View>
          </View>

          {/* App surface */}

          <View className="relative overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#080812] p-4">
            <View className="mb-5 flex items-center justify-between">
              <View>
                <Text className="text-[9px] font-medium text-white/30">BONJOUR</Text>

                <Text className="mt-1 text-lg font-black text-white">
                  Qu'allons-nous
                  <br />
                  faire aujourd'hui ?
                </Text>
              </View>

              <View className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10">
                <Sparkles size={17} className="text-violet-300" />
              </View>
            </View>

            {/* Search */}

            <View className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] px-3 py-3">
              <Search size={14} className="text-white/30" />

              <Text className="text-[10px] text-white/25">
                Que cherches-tu ?
              </Text>
            </View>

            {/* Context cards */}

            <View className="mt-4 gap-2">
              <VisualCard
                icon={Briefcase}
                title="Opportunités"
                subtitle="Près de vous"
                color="#8b5cf6"
              />

              <VisualCard
                icon={Building2}
                title="Immobilier"
                subtitle="À découvrir"
                color="#f97316"
              />

              <VisualCard
                icon={Users}
                title="Communauté"
                subtitle="Connecter"
                color="#06b6d4"
              />

              <VisualCard
                icon={MapPin}
                title="À proximité"
                subtitle="Explorer"
                color="#10b981"
              />
            </View>

            {/* Bottom navigation */}

            <View className="mt-5 flex items-center justify-around border-t border-white/[0.06] pt-4">
              <VisualNav icon={Compass} active />

              <VisualNav icon={Search} />

              <View className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-violet-500/20">
                <Text className="text-lg font-light text-white">+</Text>
              </View>

              <VisualNav icon={MessageCircle} />

              <VisualNav icon={Users} />
            </View>
          </View>
        </View>

        {/* Floating cards */}

        <FloatingCard
          className="-left-8 top-[18%] sm:-left-16"
          icon={Zap}
          title="Action"
          subtitle="En quelques secondes"
          color="#a78bfa"
          delay={0}
        />

        <FloatingCard
          className="-right-6 bottom-[18%] sm:-right-12"
          icon={Globe2}
          title="Partout"
          subtitle="Local · National · Monde"
          color="#22d3ee"
          delay={0.8}
        />
      </View>
    </View>
  );
}

/* ============================================================================
 * VISUAL CARD
 * ========================================================================== */

function VisualCard({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View
      className="rounded-2xl border border-white/[0.06] bg-white/[0.035] p-3"
    >
      <View
        className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18` }}
      >
        <Icon
          size={14}
          style={{
            color,
          }}
        />
      </View>

      <Text className="text-[10px] font-bold text-white/75">{title}</Text>

      <Text className="mt-0.5 text-[8px] text-white/25">{subtitle}</Text>
    </View>
  );
}

/* ============================================================================
 * VISUAL NAV
 * ========================================================================== */

function VisualNav({
  icon: Icon,
  active = false,
}: {
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <View
      className={[
        "flex h-8 w-8 items-center justify-center rounded-xl",
        active ? "bg-violet-500/15 text-violet-300" : "text-white/20",
      ].join(" ")}
    >
      <Icon size={14} />
    </View>
  );
}

/* ============================================================================
 * FLOATING CARD
 * ========================================================================== */

function FloatingCard({
  className,
  icon: Icon,
  title,
  subtitle,
  color,
  delay,
}: {
  className: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
  delay: number;
}) {
  return (
    <View
      className={`absolute z-20 hidden rounded-2xl border border-white/10 bg-[#10101d]/90 p-3 shadow-2xl backdrop-blur-xl sm:block ${className}`}
    >
      <View
        className="flex items-center gap-2.5"
      >
        <View
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18` }}
        >
          <Icon
            size={15}
            style={{
              color,
            }}
          />
        </View>

        <View>
          <Text className="text-[10px] font-bold text-white/80">{title}</Text>

          <Text className="mt-0.5 text-[8px] text-white/30">
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * SECTION HEADING
 * ========================================================================== */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <View className="max-w-2xl">
      <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
        {eyebrow}
      </Text>

      <Text className="mt-4 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
        {title}
      </Text>

      <Text className="mt-5 max-w-xl text-sm leading-7 text-white/40 sm:text-base">
        {description}
      </Text>
    </View>
  );
}

/* ============================================================================
 * PILLAR CARD
 * ========================================================================== */

function PillarCard({
  pillar,
  index,
}: {
  pillar: (typeof PILLARS)[number];
  index: number;
}) {
  const Icon = pillar.icon;

  return (
    <View
      className="group relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-6 sm:p-7"
    >
      <View
        className="absolute -right-12 -top-12 h-32 w-32 rounded-full"
        style={{ backgroundColor: pillar.glow, opacity: 0.4 }}
      />

      <View
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border"
        style={{ backgroundColor: `${pillar.color}12`, borderColor: `${pillar.color}25` }}
      >
        <Icon size={19} />
      </View>

      <Text
        className="relative mt-7 text-[9px] font-black tracking-[0.18em]"
        style={{
          color: pillar.color,
        }}
      >
        {pillar.eyebrow}
      </Text>

      <Text className="relative mt-2 text-xl font-black tracking-tight text-white">
        {pillar.title}
      </Text>

      <Text className="relative mt-3 text-sm leading-6 text-white/40">
        {pillar.description}
      </Text>

      <View className="relative mt-7 flex items-center gap-1 text-[10px] font-bold text-white/25">
        <Text>Explorer</Text><ChevronRight
          size={12}
          className=""
        />
      </View>
    </View>
  );
}

/* ============================================================================
 * MODULE CARD
 * ========================================================================== */

function ModuleCard({
  module,
  index,
}: {
  module: (typeof MODULES)[number];
  index: number;
}) {
  const Icon = module.icon;

  return (
    <View
      className="group rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] p-4"
    >
      <View
        className="flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${module.color}14` }}
      >
        <Icon
          size={17}
          style={{
            color: module.color,
          }}
        />
      </View>

      <Text className="mt-4 text-xs font-bold text-white/80">{module.title}</Text>

      <Text className="mt-1 text-[9px] leading-4 text-white/30">
        {module.description}
      </Text>
    </View>
  );
}

/* ============================================================================
 * EXPERIENCE POINT
 * ========================================================================== */

function ExperiencePoint({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <View className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
      <Text className="pt-0.5 text-[10px] font-black text-violet-400">
        {number}
      </Text>

      <View>
        <Text className="text-sm font-bold text-white">{title}</Text>

        <Text className="mt-1 text-xs leading-5 text-white/35">{text}</Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * EXPERIENCE VISUAL
 * ========================================================================== */

function ExperienceVisual() {
  return (
    <View className="relative min-h-[430px] overflow-hidden border-t border-white/[0.06] bg-[#080811] lg:border-l lg:border-t-0">
      <View className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.08] via-transparent to-indigo-500/[0.08]" />

      <View className="absolute left-1/2 top-1/2 w-[82%] max-w-[470px] -translate-x-1/2 -translate-y-1/2">
        <View
          className="relative rounded-[2rem] border border-white/10 bg-[#10101d]/90 p-3 shadow-[0_30px_90px_rgba(0,0,0,.45)]"
        >
          <View className="rounded-[1.5rem] border border-white/[0.06] bg-[#080812] p-4">
            <View className="flex items-center justify-between">
              <View>
                <Text className="text-[8px] font-bold uppercase tracking-widest text-white/25">
                  POUR TOI
                </Text>
                <Text className="mt-1 text-sm font-black text-white">
                  Ce qui pourrait t'intéresser
                </Text>
              </View>

              <View className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10">
                <Sparkles size={14} className="text-violet-300" />
              </View>
            </View>

            <View className="mt-4 space-y-2">
              <RecommendationRow
                icon={Briefcase}
                title="Une opportunité"
                subtitle="Correspond à ta recherche"
                color="#8b5cf6"
              />

              <RecommendationRow
                icon={Building2}
                title="Un logement"
                subtitle="Disponible à proximité"
                color="#f97316"
              />

              <RecommendationRow
                icon={Users}
                title="Une connexion"
                subtitle="Une personne à découvrir"
                color="#06b6d4"
              />
            </View>
          </View>
        </View>

        <View
          className="absolute -bottom-8 -right-5 rounded-2xl border border-emerald-400/15 bg-[#0d1715]/95 p-3 shadow-2xl"
        >
          <View className="flex items-center gap-2">
            <View className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-400/10">
              <Check size={14} className="text-emerald-400" />
            </View>

            <View>
              <Text className="text-[9px] font-bold text-white/75">
                Action simplifiée
              </Text>

              <Text className="text-[8px] text-white/30">Tout au même endroit</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * RECOMMENDATION ROW
 * ========================================================================== */

function RecommendationRow({
  icon: Icon,
  title,
  subtitle,
  color,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  color: string;
}) {
  return (
    <View className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.025] p-3">
      <View
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}14` }}
      >
        <Icon
          size={14}
          style={{
            color,
          }}
        />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="truncate text-[10px] font-bold text-white/75">{title}</Text>

        <Text className="mt-0.5 truncate text-[8px] text-white/25">{subtitle}</Text>
      </View>

      <ArrowUpRight size={13} className="text-white/20" />
    </View>
  );
}

/* ============================================================================
 * TRUST CARD
 * ========================================================================== */

function TrustCard({
  point,
  index,
}: {
  point: (typeof TRUST_POINTS)[number];
  index: number;
}) {
  const Icon = point.icon;

  return (
    <View
      className="rounded-[2rem] border border-white/[0.07] bg-white/[0.025] p-6"
    >
      <View className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
        <Icon size={18} className="text-violet-300" />
      </View>

      <Text className="mt-6 text-base font-black text-white">{point.title}</Text>

      <Text className="mt-2 text-sm leading-6 text-white/35">
        {point.description}
      </Text>
    </View>
  );
}

/* ============================================================================
 * MINI TRUST
 * ========================================================================== */

function MiniTrust({ text }: { text: string }) {
  return (
    <Text className="flex items-center gap-1.5 text-[10px] text-white/30">
      <CheckCircle2 size={11} className="text-emerald-400/70" />

      {text}
    </Text>
  );
}

/* ============================================================================
 * MOBILE MENU
 * ========================================================================== */

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <View
      className="fixed inset-0 z-[100] bg-[#05050d]/95 md:hidden"
    >
      <View className="flex h-full flex-col px-5 pt-5">
        <View className="flex items-center justify-between">
          <Brand />

          <Pressable
           
            onPress={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]"
            accessibilityLabel="Fermer le menu"
          >
            <X size={18} />
          </Pressable>
        </View>

        <View className="mt-16 flex flex-col gap-2">
          {[
            ["#vision", "Vision"],
            ["#modules", "Modules"],
            ["#experience", "Expérience"],
            ["#trust", "Confiance"],
          ].map(([href, label], index) => (
            <Pressable
              key={href}
              href={href}
              onPress={onClose}
              className="border-b border-white/[0.06] py-5 text-2xl font-black text-white"
            >
              {label}
            </Pressable>
          ))}
        </View>

        <View className="mt-auto pb-8">
          <SignInButton className="!h-12 !w-full !rounded-2xl" />

          <Link
            href="/auth?mode=register"
            onPress={onClose}
            className="mt-3 flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sm font-bold text-white"
          >
            <Text>Créer un compte</Text></Link>
        </View>
      </View>
    </View>
  );
}

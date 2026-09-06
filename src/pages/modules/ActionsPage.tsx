import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, TextInput, GestureResponderEvent, ViewStyle, TextStyle, ImageStyle } from "react-native";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart2,
  BedDouble,
  BookOpen,
  Briefcase,
  CalendarDays,
  Camera,
  Car,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  CreditCard,
  Flame,
  FileText,
  Film,
  Globe,
  HandHeart,
  Heart,
  Home,
  Landmark,
  Leaf,
  Lightbulb,
  LogIn,
  Map,
  MapPin,
  Megaphone,
  MessageSquare,
  Network,
  Package,
  Phone,
  Plus,
  Radio,
  Scale,
  Search,
  Send,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Stethoscope,
  Target,
  TrendingUp,
  Trophy,
  Truck,
  UtensilsCrossed,
  Users,
  Wallet,
  Wrench,
  X,
  Zap,
  Activity,
  AlertTriangle,
  GraduationCap,
  Newspaper,
  TreePine,
} from "lucide-react-native";
/* ============================================================================
 * TYPES
 * ========================================================================== */

type LucideIcon = ComponentType<{
  size?: number;
  style?: ViewStyle | TextStyle | ImageStyle;
  className?: string;
}>;

interface Action {
  id: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  page?: string;
  color: string;
  category: string;
}

/* ============================================================================
 * ACTIONS
 * ========================================================================== */

const ALL_ACTIONS: Action[] = [
  // Finance
  {
    id: "payer",
    icon: CreditCard,
    label: "Payer",
    desc: "Mobile Money, carte",
    page: "paiement",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "transferer",
    icon: Send,
    label: "Transférer",
    desc: "Peer-to-peer instantané",
    page: "wallet",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "facturer",
    icon: FileText,
    label: "Facturer",
    desc: "Créer une facture",
    page: "paiement",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "epargner",
    icon: TrendingUp,
    label: "Épargner",
    desc: "Micro-crédit & plans",
    page: "wallet",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "investir",
    icon: BarChart2,
    label: "Investir",
    desc: "Placements & portefeuille",
    page: "finances",
    color: "#10B981",
    category: "Finance & Paiements",
  },
  {
    id: "marche",
    icon: ShoppingBag,
    label: "Marché",
    desc: "Acheter & vendre",
    page: "marketplace",
    color: "#F97316",
    category: "Finance & Paiements",
  },

  // Mobilité
  {
    id: "vtc",
    icon: Car,
    label: "VTC / Taxi",
    desc: "Réserver un trajet",
    page: "transport",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "moto",
    icon: Truck,
    label: "Moto-taxi",
    desc: "Rapide et pratique",
    page: "transport",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "colis",
    icon: Package,
    label: "Colis",
    desc: "Envoyer / recevoir",
    page: "livraison",
    color: "#3B82F6",
    category: "Mobilité & Livraison",
  },
  {
    id: "repas",
    icon: UtensilsCrossed,
    label: "Repas",
    desc: "Commander",
    page: "restauration",
    color: "#F97316",
    category: "Mobilité & Livraison",
  },
  {
    id: "voyager",
    icon: Compass,
    label: "Voyager",
    desc: "Bus, avion, ferry",
    page: "voyages",
    color: "#0EA5E9",
    category: "Mobilité & Livraison",
  },
  {
    id: "heberger",
    icon: BedDouble,
    label: "Hébergement",
    desc: "Trouver un logement",
    page: "hebergement",
    color: "#10B981",
    category: "Mobilité & Livraison",
  },

  // Immo & emploi
  {
    id: "louer",
    icon: Home,
    label: "Louer",
    desc: "Appartements & studios",
    page: "immo",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "vendre-immo",
    icon: Home,
    label: "Vendre immo",
    desc: "Mettre un bien en vente",
    page: "immo",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "emploi",
    icon: Briefcase,
    label: "Chercher emploi",
    desc: "Offres & candidatures",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "recruter",
    icon: Users,
    label: "Recruter",
    desc: "Poster une offre",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "freelance",
    icon: Landmark,
    label: "Freelance",
    desc: "Missions & contrats",
    page: "jobs",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },
  {
    id: "business",
    icon: BarChart2,
    label: "Business",
    desc: "Gérer son entreprise",
    page: "business",
    color: "#8B5CF6",
    category: "Immobilier & Emploi",
  },

  // Services
  {
    id: "plomberie",
    icon: Wrench,
    label: "Plomberie",
    desc: "Intervention rapide",
    page: "services",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "electricite",
    icon: Zap,
    label: "Électricité",
    desc: "Dépannage",
    page: "energie",
    color: "#FBBF24",
    category: "Services à domicile",
  },
  {
    id: "menage",
    icon: Activity,
    label: "Ménage",
    desc: "Professionnels vérifiés",
    page: "services",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "cours-domicile",
    icon: GraduationCap,
    label: "Cours privés",
    desc: "À domicile",
    page: "apprendre",
    color: "#F59E0B",
    category: "Services à domicile",
  },
  {
    id: "livraison-dom",
    icon: Package,
    label: "Livraison",
    desc: "Courses & colis",
    page: "livraison",
    color: "#F97316",
    category: "Services à domicile",
  },
  {
    id: "restaurant-call",
    icon: UtensilsCrossed,
    label: "Restauration",
    desc: "Menu & livraison",
    page: "restauration",
    color: "#F97316",
    category: "Services à domicile",
  },

  // Santé
  {
    id: "rdv",
    icon: CalendarDays,
    label: "Prendre RDV",
    desc: "Médecin, spécialiste",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "teleconsult",
    icon: Phone,
    label: "Téléconsult.",
    desc: "Consultation en ligne",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "pharmacie",
    icon: Stethoscope,
    label: "Pharmacie",
    desc: "Commande & livraison",
    page: "sante",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "entrainer",
    icon: Flame,
    label: "S'entraîner",
    desc: "Workouts",
    page: "fitness",
    color: "#EF4444",
    category: "Santé & Bien-être",
  },
  {
    id: "nutrition-log",
    icon: Coffee,
    label: "Nutrition",
    desc: "Journal alimentaire",
    page: "nutrition",
    color: "#F59E0B",
    category: "Santé & Bien-être",
  },
  {
    id: "mediter",
    icon: Activity,
    label: "Méditer",
    desc: "Respiration guidée",
    page: "meditation",
    color: "#8B5CF6",
    category: "Santé & Bien-être",
  },
  {
    id: "sport-club",
    icon: Trophy,
    label: "Sport",
    desc: "Clubs · Tournois",
    page: "sport",
    color: "#6366F1",
    category: "Santé & Bien-être",
  },

  // Éducation
  {
    id: "cours",
    icon: BookOpen,
    label: "Cours",
    desc: "MOOC · Apprentissage",
    page: "cours",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },
  {
    id: "quiz",
    icon: Target,
    label: "Quiz",
    desc: "Tests & évaluations",
    page: "quiz",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "certifier",
    icon: Award,
    label: "Certifier",
    desc: "Obtenir un certificat",
    page: "certifications",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "mentorat",
    icon: Users,
    label: "Mentorat",
    desc: "Trouver un mentor",
    page: "mentorat",
    color: "#A78BFA",
    category: "Éducation & Formation",
  },
  {
    id: "ecole",
    icon: GraduationCap,
    label: "École",
    desc: "Scolarité · Inscription",
    page: "ecole",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },
  {
    id: "apprendre",
    icon: BookOpen,
    label: "Apprendre",
    desc: "Catalogue complet",
    page: "apprendre",
    color: "#F59E0B",
    category: "Éducation & Formation",
  },

  // Social
  {
    id: "groupes",
    icon: Users,
    label: "Groupes",
    desc: "Rejoindre des discussions",
    page: "community",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "evenement",
    icon: CalendarDays,
    label: "Événements",
    desc: "Découvrir et créer",
    page: "evenements",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "parrainer",
    icon: HandHeart,
    label: "Parrainer",
    desc: "Inviter & gagner",
    page: "parrainage",
    color: "#EC4899",
    category: "Social & Communauté",
  },
  {
    id: "reseau",
    icon: Network,
    label: "Réseau",
    desc: "Connexions professionnelles",
    page: "network",
    color: "#3B82F6",
    category: "Social & Communauté",
  },
  {
    id: "messages",
    icon: MessageSquare,
    label: "Messages",
    desc: "Tchatter · Groupes",
    page: "messages",
    color: "#3B82F6",
    category: "Social & Communauté",
  },

  // Media
  {
    id: "lire-news",
    icon: Newspaper,
    label: "Actualités",
    desc: "News & podcasts",
    page: "media",
    color: "#06B6D4",
    category: "Médias & Création",
  },
  {
    id: "streamer",
    icon: Radio,
    label: "Streamer",
    desc: "Lancer un live",
    page: "live-streaming",
    color: "#EF4444",
    category: "Médias & Création",
  },
  {
    id: "creer-contenu",
    icon: Camera,
    label: "Créer contenu",
    desc: "Stories · Vidéos · Posts",
    page: "editeur",
    color: "#8B5CF6",
    category: "Médias & Création",
  },
  {
    id: "publier-story",
    icon: Film,
    label: "Story Creator",
    desc: "Créer une story",
    page: "stories-creator",
    color: "#EC4899",
    category: "Médias & Création",
  },
  {
    id: "lancer-pub",
    icon: Megaphone,
    label: "Publicité",
    desc: "Créer une campagne",
    page: "pub",
    color: "#F59E0B",
    category: "Médias & Création",
  },
  {
    id: "cocreation",
    icon: Lightbulb,
    label: "Co-créer",
    desc: "Projet collaboratif",
    page: "cocreation",
    color: "#A78BFA",
    category: "Médias & Création",
  },

  // Agri
  {
    id: "planter",
    icon: Leaf,
    label: "Planter",
    desc: "Calendrier & conseils",
    page: "agri",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "vendre-agri",
    icon: ShoppingBag,
    label: "Vendre Agri",
    desc: "Marché agricole",
    page: "agri",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "environnement",
    icon: TreePine,
    label: "Écologie",
    desc: "Recyclage · Green actions",
    page: "environnement",
    color: "#22C55E",
    category: "Agriculture & Environnement",
  },
  {
    id: "energie",
    icon: Zap,
    label: "Énergie",
    desc: "Solaire · Réseau",
    page: "energie",
    color: "#FBBF24",
    category: "Agriculture & Environnement",
  },

  // Gouvernance
  {
    id: "sos",
    icon: AlertTriangle,
    label: "SOS",
    desc: "Alerte urgence",
    page: "sos",
    color: "#EF4444",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "securite",
    icon: Shield,
    label: "Sécurité",
    desc: "Signalement incident",
    page: "securite",
    color: "#EF4444",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "juridique",
    icon: Scale,
    label: "Juridique",
    desc: "Conseil légal",
    page: "juridique",
    color: "#9CA3AF",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "justice",
    icon: Scale,
    label: "Justice",
    desc: "Signaler · Défendre",
    page: "justice",
    color: "#9CA3AF",
    category: "Gouvernance & Sécurité",
  },
  {
    id: "data-pub",
    icon: BarChart2,
    label: "Data Publique",
    desc: "Open data officiel",
    page: "data-publique",
    color: "#06B6D4",
    category: "Gouvernance & Sécurité",
  },

  // ONG
  {
    id: "dons",
    icon: HandHeart,
    label: "Faire un don",
    desc: "Soutenir une cause",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },
  {
    id: "benevolat",
    icon: Globe,
    label: "Bénévolat",
    desc: "S'engager bénévolement",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },
  {
    id: "campagne",
    icon: Megaphone,
    label: "Campagne",
    desc: "Lancer une collecte",
    page: "ong",
    color: "#10B981",
    category: "ONG & Solidarité",
  },

  // Carte
  {
    id: "carte",
    icon: MapPin,
    label: "Carte",
    desc: "Explorer autour de moi",
    page: "carte",
    color: "#6366F1",
    category: "Carte & Tech",
  },
  {
    id: "map3d",
    icon: Map,
    label: "Map 3D",
    desc: "Cartographie avancée",
    page: "map3d",
    color: "#6366F1",
    category: "Carte & Tech",
  },
  {
    id: "login",
    icon: LogIn,
    label: "Mon compte",
    desc: "Profil · Paramètres",
    page: "profile",
    color: "#8B5CF6",
    category: "Carte & Tech",
  },
];

/* ============================================================================
 * STORAGE
 * ========================================================================== */

const RECENT_KEY = "debrouille_recent_actions";
const FAV_KEY = "debrouille_fav_actions";
const MAX_RECENT = 6;

function readStorage(key: string): string[] {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as string[]) : [];
  } catch {
    return [];
  }
}

const CATEGORIES = [
  "Tous",
  ...Array.from(new Set(ALL_ACTIONS.map((action) => action.category))),
];

/* ============================================================================
 * ACTION CARD
 * ========================================================================== */

function ActionCard({
  action,
  isFav,
  featured = false,
  onTap,
  onToggleFav,
}: {
  action: Action;
  isFav: boolean;
  featured?: boolean;
  onTap: () => void;
  onToggleFav: (event: GestureResponderEvent) => void;
}) {
  const Icon = action.icon;

  return (
    <Pressable
      onPress={onTap}
      className={[
        "group relative cursor-pointer overflow-hidden rounded-[22px]",
        "border backdrop-blur-xl",
        featured ? "min-h-[122px]" : "min-h-[108px]",
      ].join(" ")}
      style={{ borderColor: `${action.color}30` }}
    >
      {/* halo */}
      <View
        className="absolute -right-7 -top-7 h-20 w-20 rounded-full opacity-30"
        style={{ backgroundColor: action.color }}
      />

      {/* favorite */}
      <Pressable
       
        accessibilityLabel={
          isFav
            ? `Retirer ${action.label} des favoris`
            : `Ajouter ${action.label} aux favoris`
        }
        onPress={onToggleFav}
        className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center rounded-xl border border-white/5 bg-black/20"
      >
        <Star
          size={11}
          className={
            isFav
              ? "fill-yellow-400 text-yellow-400"
              : "text-white/25 transition group-hover:text-white/50"
          }
        />
      </Pressable>

      <View className="relative flex h-full flex-col justify-between p-3.5">
        <View
          className="flex h-10 w-10 items-center justify-center rounded-[15px] border"
          style={{ backgroundColor: `${action.color}20`, borderColor: `${action.color}28` }}
        >
          <Icon size={18} style={{ color: action.color }} />
        </View>

        <View className="mt-3 min-w-0">
          <View className="flex items-center gap-1.5">
            <Text className="truncate text-[11px] font-black text-white">
              {action.label}
            </Text>

            {featured && (
              <ArrowUpRight size={11} className="shrink-0 text-white/30" />
            )}
          </View>

          <Text className="mt-1 text-[9px] leading-[1.35] text-white/35">
            {action.desc}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ============================================================================
 * MAIN PAGE
 * ========================================================================== */

interface ActionsPageProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
}

export default function ActionsPage({ onBack, onNavigate }: ActionsPageProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [recentIds, setRecentIds] = useState<string[]>(() =>
    readStorage(RECENT_KEY),
  );
  const [favIds, setFavIds] = useState<string[]>(() => readStorage(FAV_KEY));

  useEffect(() => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recentIds));
  }, [recentIds]);

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favIds));
  }, [favIds]);

  /* --------------------------------------------------------------------------
   * ACTION
   * ------------------------------------------------------------------------ */

  const handleTap = useCallback(
    (action: Action) => {
      setRecentIds((previous) =>
        [action.id, ...previous.filter((id) => id !== action.id)].slice(
          0,
          MAX_RECENT,
        ),
      );

      if (action.page) {
        onNavigate(action.page);
        return;
      }

      UIService.openToast(action.label, "info");
    },
    [onNavigate],
  );

  const handleToggleFav = useCallback((event: GestureResponderEvent, action: Action) => {
    setFavIds((previous) => {
      const exists = previous.includes(action.id);

      if (exists) {
        UIService.openToast("Retiré des favoris", "info");
        return previous.filter((id) => id !== action.id);
      }

      UIService.openToast(`${action.label} ajouté aux favoris`, "info");

      return [action.id, ...previous];
    });
  }, []);

  /* --------------------------------------------------------------------------
   * DERIVED DATA
   * ------------------------------------------------------------------------ */

  const recentActions = useMemo(
    () =>
      recentIds
        .map((id) => ALL_ACTIONS.find((action) => action.id === id))
        .filter((action): action is Action => Boolean(action)),
    [recentIds],
  );

  const favActions = useMemo(
    () =>
      favIds
        .map((id) => ALL_ACTIONS.find((action) => action.id === id))
        .filter((action): action is Action => Boolean(action)),
    [favIds],
  );

  const filteredActions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return ALL_ACTIONS.filter((action) => {
      const matchesSearch =
        !query ||
        action.label.toLowerCase().includes(query) ||
        action.desc.toLowerCase().includes(query) ||
        action.category.toLowerCase().includes(query);

      const matchesCategory =
        activeCategory === "Tous" || action.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const groupedActions = useMemo(() => {
    return CATEGORIES.filter((category) => category !== "Tous").reduce<
      Record<string, Action[]>
    >((result, category) => {
      const actions = filteredActions.filter(
        (action) => action.category === category,
      );

      if (actions.length > 0) {
        result[category] = actions;
      }

      return result;
    }, {});
  }, [filteredActions]);

  const isFiltering = search.trim().length > 0 || activeCategory !== "Tous";

  const popularActions = useMemo(() => {
    const preferredIds = [
      "payer",
      "transferer",
      "vtc",
      "emploi",
      "louer",
      "rdv",
      "marketplace",
      "voyager",
    ];

    return preferredIds
      .map((id) => ALL_ACTIONS.find((action) => action.id === id))
      .filter((action): action is Action => Boolean(action));
  }, []);

  /* --------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------ */

  return (
    <View
      className="fixed inset-0 z-50 flex min-h-0 flex-col overflow-hidden text-white"
      style={{  }}
    >
      {/* Ambient background */}
      <View className="absolute inset-0 overflow-hidden">
        <View
          className="absolute left-[10%] top-[8%] h-64 w-64 rounded-full"
          style={{ backgroundColor: "rgba(99,102,241,0.08)" }}
        />
        <View
          className="absolute right-[5%] top-[35%] h-72 w-72 rounded-full"
          style={{ backgroundColor: "rgba(14,165,233,0.06)" }}
        />
      </View>

      {/* ----------------------------------------------------------------------
       * HEADER
       * -------------------------------------------------------------------- */}

      <View className="relative z-20 shrink-0 border-b border-white/[0.06] bg-[#03050d]/90 px-4 pb-3 pt-[max(14px,env(safe-area-inset-top))]">
        <View className="mx-auto w-full max-w-6xl">
          <View className="flex items-center gap-3">
            <Pressable
              type="button"
              onPress={onBack}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.06]"
            >
              <ArrowLeft size={17} className="text-white/80" />
            </Pressable>

            <View className="min-w-0 flex-1">
              <View className="flex items-center gap-2">
                <Text className="truncate text-[17px] font-black tracking-tight">
                  Actions rapides
                </Text>

                <Text className="hidden rounded-full border border-orange-400/20 bg-orange-400/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-orange-300 sm:inline-flex">
                  Command Center
                </Text>
              </View>

              <Text className="mt-1 text-[10px] text-white/35">
                {ALL_ACTIONS.length} services · {CATEGORIES.length - 1}{" "}
                catégories
              </Text>
            </View>

            <View
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
              style={{  }}
            >
              <Zap size={17} className="text-white" />
            </View>
          </View>

          {/* Search */}
          <View
            className="mt-3 flex items-center gap-2 rounded-2xl border px-3.5 py-3"
            style={{ backgroundColor: "rgba(255,255,255,0.045)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <Search size={15} className="shrink-0 text-white/30" />

            <TextInput
              value={search}
              onChangeText={(text) => setSearch(text)}
              placeholder="Que voulez-vous faire ?"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
             
             
             returnKeyType="search"/>

            <>
              {search ? (
                <Pressable
                  key="clear"
                  type="button"
                  onPress={() => setSearch("")}
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.07]"
                >
                  <X size={12} className="text-white/45" />
                </Pressable>
              ) : (
                <Text
                  key="shortcut"
                  className="hidden rounded-lg border border-white/[0.07] px-2 py-1 text-[8px] font-bold text-white/20 sm:block"
                >
                  <Text>⌘ K</Text></Text>
              )}
            </>
          </View>

          {/* Category rail */}
          <View
            className="mt-3 flex gap-2 overflow-x-auto pb-0.5"
            style={{ overscrollBehaviorX: "contain" }}
          >
            {CATEGORIES.map((category) => {
              const active = activeCategory === category;

              return (
                <Pressable
                  key={category}
                 
                  onPress={() => setActiveCategory(category)}
                  className="shrink-0 rounded-xl border px-3 py-2 text-[10px] font-bold"
                  style={{ borderColor: active
                                        ? "rgba(249,115,22,0.34)"
                                        : "rgba(255,255,255,0.06)" }}
                >
                  {category === "Tous"
                    ? `Tous · ${ALL_ACTIONS.length}`
                    : category.split(" ")[0]}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* ----------------------------------------------------------------------
       * SCROLL CONTENT
       * -------------------------------------------------------------------- */}

      <View
        className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5"
        style={{ touchAction: "pan-y" }}
      >
        <View className="mx-auto w-full max-w-6xl pb-[calc(32px+env(safe-area-inset-bottom))]">
          {/* ------------------------------------------------------------------
           * HERO
           * ---------------------------------------------------------------- */}

          {!isFiltering && (
            <View
              className="relative mb-6 overflow-hidden rounded-[28px] border border-white/[0.08]"
              style={{  }}
            >
              <View className="absolute -right-12 -top-20 h-52 w-52 rounded-full bg-violet-500/15" />
              <View className="absolute -bottom-20 left-20 h-40 w-40 rounded-full bg-blue-500/10" />

              <View className="relative p-5 sm:p-6">
                <View className="flex items-start gap-4">
                  <View
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px]"
                    style={{  }}
                  >
                    <Sparkles size={21} className="text-white" />
                  </View>

                  <View className="min-w-0 flex-1">
                    <Text className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300/70">
                      Votre centre de commandes
                    </Text>

                    <Text className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
                      Faites plus, en moins de temps.
                    </Text>

                    <Text className="mt-2 max-w-xl text-[11px] leading-relaxed text-white/40 sm:text-xs">
                      Retrouvez vos actions essentielles et accédez directement
                      aux services de DébrouillePro.
                    </Text>
                  </View>
                </View>

                {/* Quick stats */}
                <View className="mt-5 gap-2">
                  <View className="rounded-2xl border border-white/[0.06] bg-black/15 p-3">
                    <Text className="text-lg font-black">{ALL_ACTIONS.length}</Text>
                    <Text className="text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Actions
                    </Text>
                  </View>

                  <View className="rounded-2xl border border-white/[0.06] bg-black/15 p-3">
                    <Text className="text-lg font-black">{favActions.length}</Text>
                    <Text className="text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Favoris
                    </Text>
                  </View>

                  <View className="rounded-2xl border border-white/[0.06] bg-black/15 p-3">
                    <Text className="text-lg font-black">{recentActions.length}</Text>
                    <Text className="text-[8px] font-bold uppercase tracking-wider text-white/30">
                      Récents
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ------------------------------------------------------------------
           * FILTER RESULT
           * ---------------------------------------------------------------- */}

          {isFiltering ? (
            <View>
              <View className="mb-4 flex items-end justify-between">
                <View>
                  <Text className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25">
                    Résultats
                  </Text>

                  <Text className="mt-1 text-base font-black">
                    {filteredActions.length} action
                    {filteredActions.length !== 1 ? "s" : ""}
                  </Text>
                </View>

                <Pressable
                 
                  onPress={() => {
                    setSearch("");
                    setActiveCategory("Tous");
                  }}
                  className="text-[10px] font-bold text-violet-300"
                >
                  <Text>Réinitialiser</Text></Pressable>
              </View>

              {filteredActions.length === 0 ? (
                <View className="flex min-h-[300px] flex-col items-center justify-center rounded-[28px] border border-white/[0.06] bg-white/[0.02]">
                  <View className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/[0.04]">
                    <Search size={24} className="text-white/15" />
                  </View>

                  <Text className="mt-4 text-sm font-bold text-white/40">
                    Aucune action trouvée
                  </Text>

                  <Text className="mt-1 text-[10px] text-white/20">
                    Essayez un autre mot ou une autre catégorie.
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {filteredActions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isFav={favIds.includes(action.id)}
                      onTap={() => handleTap(action)}
                      onToggleFav={(event) => handleToggleFav(event, action)}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* --------------------------------------------------------------
               * POPULAR
               * ------------------------------------------------------------ */}

              <View className="mb-7">
                <View className="mb-3 flex items-end justify-between">
                  <View>
                    <Text className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-300/60">
                      Accès instantané
                    </Text>
                    <Text className="mt-1 text-base font-black">
                      Les plus utiles
                    </Text>
                  </View>

                  <Zap size={15} className="text-orange-400" />
                </View>

                <View className="gap-2.5">
                  {popularActions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      featured
                      isFav={favIds.includes(action.id)}
                      onTap={() => handleTap(action)}
                      onToggleFav={(event) => handleToggleFav(event, action)}
                    />
                  ))}
                </View>
              </View>

              {/* --------------------------------------------------------------
               * FAVORITES
               * ------------------------------------------------------------ */}

              {favActions.length > 0 && (
                <View
                  className="mb-7"
                >
                  <View className="mb-3 flex items-center gap-2">
                    <Heart size={14} className="fill-rose-400 text-rose-400" />

                    <Text className="text-base font-black">Mes favoris</Text>

                    <Text className="rounded-full bg-white/[0.05] px-2 py-1 text-[8px] font-bold text-white/30">
                      {favActions.length}
                    </Text>
                  </View>

                  <View className="gap-2.5">
                    {favActions.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        isFav
                        onTap={() => handleTap(action)}
                        onToggleFav={(event) => handleToggleFav(event, action)}
                      />
                    ))}
                  </View>
                </View>
              )}

              {/* --------------------------------------------------------------
               * RECENT
               * ------------------------------------------------------------ */}

              {recentActions.length > 0 && (
                <View
                  className="mb-8"
                >
                  <View className="mb-3 flex items-center gap-2">
                    <Clock size={14} className="text-white/35" />

                    <Text className="text-base font-black">Récemment utilisés</Text>

                    <Pressable
                     
                      onPress={() => setRecentIds([])}
                      className="ml-auto text-[9px] font-bold text-white/25"
                    >
                      <Text>Effacer</Text></Pressable>
                  </View>

                  <View
                    className="flex gap-2.5 overflow-x-auto pb-1"
                    style={{ overscrollBehaviorX: "contain" }}
                  >
                    {recentActions.map((action) => {
                      const Icon = action.icon;

                      return (
                        <Pressable
                          key={action.id}
                          type="button"
                          onPress={() => handleTap(action)}
                          className="flex min-w-[105px] shrink-0 flex-col items-center rounded-2xl border p-3"
                          style={{ backgroundColor: `${action.color}10`, borderColor: `${action.color}24` }}
                        >
                          <View
                            className="flex h-9 w-9 items-center justify-center rounded-xl"
                            style={{ backgroundColor: `${action.color}20` }}
                          >
                            <Icon size={16} style={{ color: action.color }} />
                          </View>

                          <Text className="mt-2 text-[10px] font-bold text-white/75">
                            {action.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* --------------------------------------------------------------
               * ALL CATEGORIES
               * ------------------------------------------------------------ */}

              <View className="space-y-8">
                {Object.entries(groupedActions).map(
                  ([category, actions], categoryIndex) => {
                    const categoryColor = actions[0]?.color ?? "#8B5CF6";

                    return (
                      <View
                        key={category}
                      >
                        <Pressable
                         
                          onPress={() => setActiveCategory(category)}
                          className="group mb-3 flex w-full items-center gap-2 text-left"
                        >
                          <Text
                            className="h-6 w-1.5 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />

                          <View className="min-w-0 flex-1">
                            <Text className="text-[15px] font-black">
                              {category}
                            </Text>

                            <Text className="mt-0.5 text-[9px] text-white/25">
                              Explorez les services disponibles
                            </Text>
                          </View>

                          <Text className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[8px] font-bold text-white/25">
                            {actions.length}
                          </Text>

                          <ChevronRight
                            size={14}
                            className="text-white/20"
                          />
                        </Pressable>

                        <View className="gap-2.5">
                          {actions.map((action) => (
                            <ActionCard
                              key={action.id}
                              action={action}
                              isFav={favIds.includes(action.id)}
                              onTap={() => handleTap(action)}
                              onToggleFav={(event) =>
                                handleToggleFav(event, action)
                              }
                            />
                          ))}
                        </View>
                      </View>
                    );
                  },
                )}
              </View>

              {/* --------------------------------------------------------------
               * FOOTER
               * ------------------------------------------------------------ */}

              <View
                className="mt-10 rounded-[24px] border border-white/[0.06] bg-white/[0.025] p-4"
              >
                <View className="flex items-center gap-3">
                  <View className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                    <Sparkles size={15} className="text-violet-400" />
                  </View>

                  <Text className="text-[10px] font-bold leading-relaxed text-white/30">
                    <Text>DébrouillePro rassemble vos services essentiels dans un seul espace.</Text><Text className="text-white/55">
                      {" "}
                      <Text>Ajoutez vos actions préférées pour les retrouver encore plus vite.</Text></Text>
                  </Text>
                </View>

                <View className="mt-4 flex items-center gap-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white/15">
                  <Text className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <Text>Centre de commandes actif</Text></View>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

import { UIService } from "@/core/sdk/ui/UIService";
import { Picker } from "@react-native-picker/picker";
import { View, Pressable, Text, TextInput, ViewStyle, TextStyle, ImageStyle } from "react-native";

// src/pages/home/_components/CreateBottomSheet.tsx
import { useState, useCallback, useEffect, useMemo } from "react";
import {
  X,
  Home,
  Briefcase,
  Calendar,
  Wrench,
  ArrowLeft,
  MapPin,
  Tag,
  FileText,
  Leaf,
  Truck,
  Megaphone,
  UtensilsCrossed,
  BedDouble,
  Zap,
  HandHeart,
  Users,
  Heart,
  Loader2,
  LocateFixed,
  Video,
  BookOpen,
  BarChart3,
  Plus,
  Check,
  Globe,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  ShoppingBag,
  Search,
  Clock,
  UserPlus,
  Plane,
  Sparkles,
  ArrowRight,
  Wand2,
  TrendingUp,
  Compass,
  Command,
} from "lucide-react-native";
import ArticleForm from "./ArticleForm";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { SignInButton } from "@/components/ui/signin";
import type { PublicationType } from "@/hooks/use-publications";
import AIWriteAssist from "@/components/AIWriteAssist";
import ImageUploader from "@/components/ImageUploader";
import { cn } from "@/lib/utils";
import { CreatePropertySheet } from "@/features/immo/components/CreatePropertySheet";
import { CreateAnnonceSheet } from "@/features/annonce/sheets/CreateAnnonceSheet";
import { CreateServiceSheet } from "@/features/service/sheets/CreateServiceSheet";
import { CreatePostSheet } from "@/features/community/components/CreatePost";
import { CreateEventSheet } from "@/features/events/components/CreateEventSheet";
import { CreateProductSheet } from "@/features/marketplace/components/CreateProductSheet";
import { CreateHealthSheet } from "@/features/sante/components/CreateHealthSheet";
import { CreateTransportSheet } from "@/features/transport/create/CreateTransportSheet";
import { CreateRestaurantSheet } from "@/features/restauration/create/CreateRestaurantSheet";
import { CreateAccommodationSheet } from "@/features/hebergement/sheets/CreateAccommodationSheet";
import { CreateAgriSheet } from "@/features/agri/sheets/CreateAgriSheet";
import { CreateNetworkSheet } from "@/features/network/sheets/CreateNetworkSheet";
import { CreateVoyageSheet } from "@/features/voyages/sheets/CreateVoyageSheet";

// ─── Interface ────────────────────────────────────────────────────────────────

interface CreateBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

// ─── Type local étendu pour inclure "network" et "voyages" ──────────────

type ExtendedPublicationType = PublicationType | "network" | "voyages";

// ─── Publication type config (enriched with keywords) ──────────────────────

type CreateOption = {
  id: ExtendedPublicationType;
  icon: React.ComponentType<{
    size: number;
    style?: ViewStyle | TextStyle | ImageStyle;
    className?: string;
  }>;
  label: string;
  desc: string;
  color: string;
  keywords: string[];
};

const CREATE_OPTIONS: CreateOption[] = [
  {
    id: "immo",
    icon: Home,
    label: "Immobilier",
    desc: "Vente, location, terrain",
    color: "#F97316",
    keywords: [
      "maison",
      "appartement",
      "terrain",
      "bureau",
      "commerce",
      "location",
      "vente",
      "bien",
    ],
  },
  {
    id: "job",
    icon: Briefcase,
    label: "Emploi",
    desc: "Offre, recherche, freelance",
    color: "#8B5CF6",
    keywords: [
      "travail",
      "carrière",
      "poste",
      "cdi",
      "stage",
      "mission",
      "freelance",
      "recrutement",
    ],
  },
  {
    id: "service",
    icon: Wrench,
    label: "Service",
    desc: "Proposez vos compétences",
    color: "#F97316",
    keywords: [
      "réparation",
      "plomberie",
      "électricité",
      "design",
      "formation",
      "conseil",
      "prestation",
    ],
  },
  {
    id: "evenement",
    icon: Calendar,
    label: "Événement",
    desc: "Concert, conférence, fête",
    color: "#EC4899",
    keywords: [
      "concert",
      "foire",
      "exposition",
      "festival",
      "sport",
      "culture",
      "réunion",
    ],
  },
  {
    id: "community",
    icon: Users,
    label: "Community",
    desc: "Partagez avec la communauté",
    color: "#3B82F6",
    keywords: ["post", "discussion", "groupe", "partage", "conseil", "forum"],
  },
  {
    id: "agri",
    icon: Leaf,
    label: "Agriculture",
    desc: "Produits, intrants, conseil",
    color: "#84CC16",
    keywords: [
      "ferme",
      "récolte",
      "engrais",
      "matériel",
      "élevage",
      "culture",
      "semences",
    ],
  },
  {
    id: "sante",
    icon: Heart,
    label: "Santé",
    desc: "Médecin, pharmacie, conseil",
    color: "#EF4444",
    keywords: [
      "médecin",
      "pharmacie",
      "urgences",
      "télémédecine",
      "vaccin",
      "hôpital",
      "clinique",
    ],
  },
  {
    id: "transport",
    icon: Truck,
    label: "Transport",
    desc: "Trajet, colis, covoiturage",
    color: "#6366F1",
    keywords: [
      "trajet",
      "taxi",
      "covoiturage",
      "livraison",
      "colis",
      "moto",
      "bus",
      "véhicule",
    ],
  },
  {
    id: "annonce",
    icon: Megaphone,
    label: "Annonce",
    desc: "Vente d'objet, échange",
    color: "#F59E0B",
    keywords: ["objet", "occasion", "vente", "échange", "troc", "matériel"],
  },
  {
    id: "restauration",
    icon: UtensilsCrossed,
    label: "Restauration",
    desc: "Restaurant, traiteur, plats",
    color: "#F97316",
    keywords: [
      "restaurant",
      "traiteur",
      "plat",
      "menu",
      "snack",
      "livraison",
      "repas",
    ],
  },
  {
    id: "hebergement",
    icon: BedDouble,
    label: "Hébergement",
    desc: "Hôtel, villa, appartement",
    color: "#10B981",
    keywords: [
      "hôtel",
      "villa",
      "appartement",
      "chambre",
      "auberge",
      "location",
      "gîte",
    ],
  },
  {
    id: "energie",
    icon: Zap,
    label: "Énergie",
    desc: "Solaire, groupes, installation",
    color: "#FBBF24",
    keywords: [
      "solaire",
      "groupe électrogène",
      "led",
      "installation",
      "panneau",
      "électricité",
    ],
  },
  {
    id: "ong",
    icon: HandHeart,
    label: "ONG / Don",
    desc: "Campagne, collecte, projet",
    color: "#10B981",
    keywords: [
      "don",
      "collecte",
      "campagne",
      "humanitaire",
      "ONG",
      "solidarité",
    ],
  },
  {
    id: "video",
    icon: Video,
    label: "Vidéo / Reel",
    desc: "Partagez une vidéo ou reel",
    color: "#EF4444",
    keywords: ["vidéo", "reel", "tiktok", "youtube", "partage", "film"],
  },
  {
    id: "article",
    icon: BookOpen,
    label: "Article",
    desc: "Écrivez un article ou blog",
    color: "#06B6D4",
    keywords: ["blog", "article", "rédaction", "publication", "éditorial"],
  },
  {
    id: "sondage",
    icon: BarChart3,
    label: "Sondage",
    desc: "Créez un sondage, votez",
    color: "#A855F7",
    keywords: ["sondage", "vote", "opinion", "question", "enquête"],
  },
  {
    id: "marketplace",
    icon: ShoppingBag,
    label: "Produit",
    desc: "Vendez vos produits en ligne",
    color: "#F97316",
    keywords: [
      "produit",
      "e-commerce",
      "boutique",
      "vente",
      "article",
      "catalogue",
    ],
  },
  {
    id: "network",
    icon: UserPlus,
    label: "Réseau",
    desc: "Profil pro, connexions, opportunités",
    color: "#6366F1",
    keywords: [
      "réseau",
      "profil",
      "professionnel",
      "connexion",
      "opportunité",
      "réseautage",
      "carrière",
    ],
  },
  {
    id: "voyages",
    icon: Plane,
    label: "Voyages",
    desc: "Billets, itinéraires, destinations",
    color: "#0EA5E9",
    keywords: [
      "voyage",
      "billet",
      "avion",
      "bus",
      "trajet",
      "destination",
      "itinéraire",
      "réservation",
    ],
  },
];

// ─── Local storage pour l'historique ─────────────────────────────────────

const HISTORY_STORAGE_KEY = "debrouille_create_history";
const MAX_HISTORY = 4;

function getCreationHistory(): ExtendedPublicationType[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ExtendedPublicationType[];
    return parsed.filter((id) => CREATE_OPTIONS.some((o) => o.id === id));
  } catch {
    return [];
  }
}

function addToHistory(id: ExtendedPublicationType): void {
  const current = getCreationHistory();
  const next = [id, ...current.filter((x) => x !== id)].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
}

// ─── Create Hub v2 — premium navigation ───────────────────────────────────────

const CREATE_GROUPS: {
  label: string;
  icon: React.ComponentType<{
    size: number;
    style?: ViewStyle | TextStyle | ImageStyle;
    className?: string;
  }>;
  ids: ExtendedPublicationType[];
}[] = [
  {
    label: "Commerce & Business",
    icon: ShoppingBag,
    ids: ["marketplace", "annonce", "restauration"],
  },
  {
    label: "Habitat & Mobilité",
    icon: Home,
    ids: ["immo", "hebergement", "energie", "transport", "voyages"],
  },
  {
    label: "Professionnel",
    icon: Briefcase,
    ids: ["job", "service", "network"],
  },
  {
    label: "Communauté",
    icon: Users,
    ids: ["community", "evenement", "ong"],
  },
  {
    label: "Agriculture & Santé",
    icon: Leaf,
    ids: ["agri", "sante"],
  },
  {
    label: "Média & Création",
    icon: Video,
    ids: ["video", "article", "sondage"],
  },
];

const QUICK_CREATE_IDS: ExtendedPublicationType[] = [
  "immo",
  "job",
  "service",
  "marketplace",
];

function CreateSearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View
      className="relative mb-5"
    >
      <View
        className="absolute inset-0 rounded-[22px]"
        style={{ opacity: 0.8 }}
      />
      <View
        className="relative flex items-center rounded-[22px] overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.055)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", borderStyle: "solid" }}
      >
        <Search size={18} className="ml-4 text-white/35 shrink-0" />
        <TextInput
         
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder="Que voulez-vous créer ?  Ex. maison, emploi, restaurant..."
          className="w-full bg-transparent py-4 pl-3 pr-4 text-white placeholder:text-white/30 outline-none text-sm"
          data-create-hub-search="true"
          autoFocus
        />
        {!value && (
          <Text className="hidden sm:flex mr-3 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/30">
            <Command size={10} />K
          </Text>
        )}
        {value && (
          <Pressable
           
            onPress={() => onChange("")}
            className="mr-3 h-7 w-7 rounded-full bg-white/8 flex items-center justify-center text-white/45"
            accessibilityLabel="Effacer la recherche"
          >
            <X size={13} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function CreateHero({ onAI }: { onAI: () => void }) {
  return (
    <View
      className="relative overflow-hidden rounded-[28px] mb-5"
      style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.10)", borderStyle: "solid" }}
    >
      <View
        className="absolute -right-14 -top-14 h-36 w-36 rounded-full"
        style={{ backgroundColor: "rgba(139,92,246,.18)" }}
      />
      <View
        className="absolute -left-10 -bottom-16 h-32 w-32 rounded-full"
        style={{ backgroundColor: "rgba(14,165,233,.14)" }}
      />

      <View className="relative p-5 sm:p-6">
        <View className="flex items-start justify-between gap-4">
          <View>
            <View className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 mb-3">
              <Sparkles size={12} className="text-violet-300" />
              <Text className="text-[10px] font-bold uppercase tracking-[.16em] text-white/55">
                Create Hub
              </Text>
            </View>
            <Text className="text-white text-[25px] sm:text-[29px] font-black tracking-tight leading-none">
              Donnez vie à vos idées.
            </Text>
            <Text className="mt-2 max-w-[560px] text-sm leading-5 text-white/48">
              Publiez, vendez, proposez un service, trouvez une opportunité ou
              partagez avec votre communauté.
            </Text>
          </View>

          <View
            className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{  }}
          >
            <Wand2 size={25} className="text-white" />
          </View>
        </View>

        <Pressable
         
          onPress={onAI}
          className="mt-5 w-full group rounded-2xl p-[1px] text-left"
          style={{  }}
        >
          <View className="flex items-center gap-3 rounded-[15px] bg-[#101022]/95 px-4 py-3.5">
            <View className="h-9 w-9 shrink-0 rounded-xl flex items-center justify-center bg-white/8">
              <Sparkles size={16} className="text-violet-300" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-bold text-white">
                Je ne sais pas quoi choisir
              </Text>
              <Text className="text-xs text-white/35 truncate">
                Décrivez simplement ce que vous voulez faire...
              </Text>
            </View>
            <ArrowRight
              size={17}
              className="text-white/35"
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function CreateQuickActions({
  history,
  onSelect,
}: {
  history: ExtendedPublicationType[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  const historyOptions = history
    .map((id) => CREATE_OPTIONS.find((o) => o.id === id))
    .filter(Boolean) as CreateOption[];

  const fallbackOptions = QUICK_CREATE_IDS.map((id) =>
    CREATE_OPTIONS.find((o) => o.id === id),
  ).filter(Boolean) as CreateOption[];

  const options = [...historyOptions, ...fallbackOptions]
    .filter(
      (opt, index, arr) => arr.findIndex((x) => x.id === opt.id) === index,
    )
    .slice(0, 4);

  return (
    <View className="mb-6">
      <View className="flex items-center justify-between mb-2.5">
        <View className="flex items-center gap-2">
          <TrendingUp size={13} className="text-emerald-300" />
          <Text className="text-[10px] font-black uppercase tracking-[.16em] text-white/38">
            {historyOptions.length ? "Vos raccourcis" : "Création rapide"}
          </Text>
        </View>
        <Text className="text-[10px] text-white/20">1 clic</Text>
      </View>

      <View className="gap-2.5">
        {options.map((opt, index) => (
          <Pressable
            key={opt.id}
            onPress={() => onSelect(opt.id)}
            className="group relative overflow-hidden rounded-2xl p-3 text-left"
            style={{ borderStyle: "solid" }}
          >
            <View
              className="absolute -right-4 -top-4 h-12 w-12 rounded-full opacity-30"
              style={{ backgroundColor: opt.color }}
            />
            <View
              className="relative h-8 w-8 rounded-xl flex items-center justify-center mb-2"
              style={{ backgroundColor: `${opt.color}22`, borderStyle: "solid" }}
            >
              <opt.icon size={16} style={{ color: opt.color }} />
            </View>
            <Text className="relative text-xs font-bold text-white truncate">
              {opt.label}
            </Text>
            <Text className="relative mt-0.5 text-[10px] text-white/30 truncate">
              {opt.desc}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CreateRecent({
  history,
  onSelect,
}: {
  history: ExtendedPublicationType[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  if (history.length === 0) return null;

  const recentOptions = history
    .map((id) => CREATE_OPTIONS.find((o) => o.id === id))
    .filter(Boolean) as CreateOption[];

  return (
    <View
      className="mb-5"
    >
      <View className="flex items-center gap-2 text-[10px] text-white/30 font-black uppercase tracking-[.16em] mb-2">
        <Clock size={12} />
        <Text>Dernières créations</Text>
      </View>
      <View className="flex flex-wrap gap-2">
        {recentOptions.map((opt) => (
          <Pressable
            key={opt.id}
           
            onPress={() => onSelect(opt.id)}
            className="group flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
          >
            <opt.icon size={14} style={{ color: opt.color }} />
            <Text className="text-xs text-white/65">
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CreateGroupedGrid({
  options,
  onSelect,
}: {
  options: CreateOption[];
  onSelect: (id: ExtendedPublicationType) => void;
}) {
  const renderGroup = (
    group: (typeof CREATE_GROUPS)[number],
    groupIndex: number,
  ) => {
    const items = options.filter((opt) => group.ids.includes(opt.id));
    if (!items.length) return null;

    return (
      <View
        key={group.label}
        className="mb-6"
      >
        <View className="flex items-center gap-2.5 mb-2.5">
          <View
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
          >
            <group.icon size={13} className="text-white/45" />
          </View>
          <View>
            <Text className="text-[10px] text-white/42 uppercase tracking-[.15em] font-black">
              {group.label}
            </Text>
            <Text className="text-[9px] text-white/20">
              {items.length} option{items.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View className="gap-2.5">
          {items.map((opt, index) => (
            <Pressable
              key={opt.id}
              onPress={() => onSelect(opt.id)}
              className="group relative overflow-hidden rounded-[20px] p-3.5 text-left"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.075)", borderStyle: "solid" }}
            >
              <View
                className="absolute -right-8 -top-8 h-20 w-20 rounded-full opacity-0"
                style={{ backgroundColor: opt.color }}
              />

              <View className="relative flex items-start justify-between gap-2">
                <View
                  className="h-10 w-10 shrink-0 rounded-[14px] flex items-center justify-center"
                  style={{ backgroundColor: `${opt.color}18`, borderStyle: "solid" }}
                >
                  <opt.icon size={19} style={{ color: opt.color }} />
                </View>

                <ArrowRight
                  size={14}
                  className="mt-1 text-white/15"
                />
              </View>

              <View className="relative mt-3">
                <Text className="text-[13px] font-bold text-white/90">
                  {opt.label}
                </Text>
                <Text className="mt-1 text-[10px] leading-4 text-white/30">
                  {opt.desc}
                </Text>
              </View>

              <View
                className="absolute bottom-0 left-0 right-0 h-[1px] opacity-0"
                style={{  }}
              />
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  return <View>{CREATE_GROUPS.map(renderGroup)}</View>;
}

// ─── Shared sub-components ────────────────────────────────────────────────────
// ─── Shared sub-components ────────────────────────────────────────────────────

function FieldInput({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  icon: React.ComponentType<{
    size: number;
    style?: ViewStyle | TextStyle | ImageStyle;
    className?: string;
  }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-center gap-2.5">
        <Icon size={14} style={{ color }} />
        <TextInput
         
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
      </View>
    </View>
  );
}

function FieldTextarea({
  icon: Icon,
  color,
  placeholder,
  value,
  onChange,
  rows = 3,
}: {
  icon: React.ComponentType<{ size: number; style?: ViewStyle | TextStyle | ImageStyle }>;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex items-start gap-2.5">
        <Icon size={14} style={{ color, marginTop: 3 }} />
        <TextInput
          value={value}
          onChangeText={(text) => onChange(text)}
          placeholder={placeholder}
         
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
         multiline textAlignVertical="top"/>
      </View>
    </View>
  );
}

function CategoryPills({
  cats,
  active,
  color,
  onChange,
}: {
  cats: string[];
  active: string;
  color: string;
  onChange: (c: string) => void;
}) {
  return (
    <View className="flex flex-wrap gap-2 mb-4">
      {cats.map((c) => (
        <Pressable
          key={c}
          onPress={() => onChange(c)}
          className="px-3 py-1.5 rounded-2xl text-xs font-semibold"
          style={{ backgroundColor: active === c ? `${color}33` : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          {c}
        </Pressable>
      ))}
    </View>
  );
}

function FormWrapper({
  title,
  color,
  onBack,
  onClose,
  children,
}: {
  title: string;
  color: string;
  onBack: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <View className="flex flex-col gap-0">
      <View className="flex items-center gap-3 mb-4">
        <Pressable
          onPress={onBack}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={16} className="text-white" />
        </Pressable>
        <Text className="text-white font-bold text-base flex-1">{title}</Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
        >
          <X size={16} className="text-white/60" />
        </Pressable>
      </View>
      {children}
    </View>
  );
}

function SubmitBtn({
  color,
  label,
  onClick,
  disabled,
  loading,
}: {
  color: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        console.log("🟢 SubmitBtn cliqué !");
        onClick();
      }}
      className="w-full py-4 rounded-3xl text-white font-bold text-sm mt-3 disabled:opacity-40 flex items-center justify-center gap-2"
      style={{  }}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {loading ? "Publication en cours..." : label}
    </Pressable>
  );
}

// ─── Tags Input ──────────────────────────────────────────────────────────────

function TagsInput({
  value,
  onChange,
  placeholder,
  color,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  color: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInput("");
    }
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  return (
    <View
      className="rounded-2xl p-3.5 mb-2"
      style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="flex flex-wrap gap-1.5 mb-2">
        {value.map((tag) => (
          <Text
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
            style={{ backgroundColor: `${color}25`, color: color }}
          >
            {tag}
            <Pressable
             
              onPress={() => removeTag(tag)}
              className=""
            >
              <X size={12} />
            </Pressable>
          </Text>
        ))}
      </View>
      <View className="flex items-center gap-2">
        <TextInput
          value={input}
          onChangeText={(text) => setInput(text)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
        />
        <Pressable
         
          onPress={addTag}
          disabled={!input.trim()}
          className="text-white/40 disabled:opacity-30"
        >
          <Plus size={16} style={{ color }} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Job Form ─────────────────────────────────────────────────────────────────

function JobForm({
  onBack,
  onClose,
  color,
}: {
  onBack: () => void;
  onClose: () => void;
  color: string;
}) {
  console.log("✅ JobForm RENDU");

  const createJob = useMutation(api.employment.createJob);
  const [form, setForm] = useState({
    title: "",
    company: "",
    description: "",
    city: "",
    country: "Congo",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    contractType: "cdi",
    remote: false,
    skills: [] as string[],
    benefits: [] as string[],
    contactEmail: "",
    contactPhone: "",
    deadline: "",
  });
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const setField = (key: keyof typeof form) => (value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const detectLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      UIService.openToast("Géolocalisation non supportée", "error");
      return;
    }
    setLocating(true);
    undefined.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          setField("city")(place);
          if (country) setField("country")(country);
          UIService.openToast("Position détectée !", "success");
        } catch {
          setField("city")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        UIService.openToast("Impossible de détecter la position", "error");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    console.log("🔥 handleSubmit JobForm appelé");

    if (!form.title || !form.company || !form.description || !form.city) {
      UIService.openToast("Veuillez remplir tous les champs obligatoires", "error");
      return;
    }

    console.log("🔥 createJob appelé avec :", form);

    setLoading(true);
    try {
      const result = await createJob({
        title: form.title,
        description: form.description,
        company: form.company,
        category: form.contractType,
        contractType: form.contractType as any,
        salaryMin: form.salaryMin ? parseFloat(form.salaryMin) : undefined,
        salaryMax: form.salaryMax ? parseFloat(form.salaryMax) : undefined,
        currency: form.currency || "USD",
        city: form.city,
        remote: form.remote,
        skills: form.skills,
        deadline: form.deadline || undefined,
      });

      console.log("✅ createJob terminé, result:", result);

      UIService.openToast("Offre d'emploi publiée !", "success");
      onClose();
    } catch (err) {
      console.error("❌ createJob erreur:", err);
      UIService.openToast("Erreur lors de la publication", "error");
    } finally {
      setLoading(false);
    }
  };

  const contractTypes = [
    { label: "CDI", value: "cdi" },
    { label: "CDD", value: "cdd" },
    { label: "Stage", value: "stage" },
    { label: "Freelance", value: "freelance" },
    { label: "Alternance", value: "alternance" },
    { label: "Bénévole", value: "benevole" },
  ];

  const currencies = ["USD", "EUR", "CDF", "CFA"];

  return (
    <FormWrapper
      title="Offre d'emploi"
      color={color}
      onBack={onBack}
      onClose={onClose}
    >
      <View className="space-y-1">
        <FieldInput
          icon={Briefcase}
          color={color}
          placeholder="Intitulé du poste *"
          value={form.title}
          onChange={setField("title")}
        />
        <FieldInput
          icon={Users}
          color={color}
          placeholder="Nom de l'entreprise *"
          value={form.company}
          onChange={setField("company")}
        />
        <FieldTextarea
          icon={FileText}
          color={color}
          placeholder="Description du poste *"
          value={form.description}
          onChange={setField("description")}
          rows={4}
        />

        {/* Localisation */}
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <MapPin size={14} style={{ color }} />
            <TextInput
              value={form.city}
              onChangeText={(text) => setField("city")(text)}
              placeholder="Ville *"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
            />
            <Pressable
             
              onPress={detectLocation}
              disabled={locating}
              className="flex-shrink-0 disabled:opacity-40"
            >
              {locating ? (
                <Loader2 size={14} className="animate-spin" style={{ color }} />
              ) : (
                <LocateFixed size={14} style={{ color }} />
              )}
            </Pressable>
          </View>
        </View>
        <FieldInput
          icon={Globe}
          color={color}
          placeholder="Pays"
          value={form.country}
          onChange={setField("country")}
        />

        {/* Salaire */}
        <View className="gap-2">
          <FieldInput
            icon={Tag}
            color={color}
            placeholder="Salaire min"
            value={form.salaryMin}
            onChange={setField("salaryMin")}
            type="number"
          />
          <FieldInput
            icon={Tag}
            color={color}
            placeholder="Salaire max"
            value={form.salaryMax}
            onChange={setField("salaryMax")}
            type="number"
          />
          <View
            className="rounded-2xl p-3.5 mb-2"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Picker
             
              onValueChange={(val) => setField("currency")(val)}
              className="w-full bg-transparent text-white text-sm outline-none"
              style={{ color: "white" }}
             selectedValue={form.currency}>
              {currencies.map((c) => (
                <Picker.Item label={`${c}`} value={c} />
              ))}
            </Picker>
          </View>
        </View>

        {/* Type de contrat */}
        <View className="flex flex-wrap gap-2 mb-2">
          {contractTypes.map((ct) => (
            <Pressable
              key={ct.value}
              onPress={() => setField("contractType")(ct.value)}
              className="px-3 py-1.5 rounded-2xl text-xs font-semibold"
              style={{ backgroundColor: form.contractType === ct.value
                                  ? `${color}33`
                                  : "rgba(255,255,255,0.06)", borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
            >
              {ct.label}
            </Pressable>
          ))}
        </View>

        {/* Télétravail */}
        <View
          className="rounded-2xl p-3.5 mb-2 flex items-center gap-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <Pressable
           
            onPress={() => setField("remote")(!form.remote)}
            className={cn(
              "w-5 h-5 rounded-md flex items-center justify-center transition-colors",
              form.remote ? "bg-purple-500" : "bg-white/10",
            )}
          >
            {form.remote && <Check size={12} className="text-white" />}
          </Pressable>
          <Text className="text-sm text-white/70">Télétravail possible</Text>
        </View>

        {/* Compétences */}
        <TagsInput
          value={form.skills}
          onChange={setField("skills")}
          placeholder="Compétences (ex: React, Node.js, ...)"
          color={color}
        />

        {/* Avantages */}
        <TagsInput
          value={form.benefits}
          onChange={setField("benefits")}
          placeholder="Avantages (ex: Mutuelle, Tickets resto, ...)"
          color={color}
        />

        {/* Contact */}
        <FieldInput
          icon={Mail}
          color={color}
          placeholder="Email de contact"
          value={form.contactEmail}
          onChange={setField("contactEmail")}
          type="email"
        />
        <FieldInput
          icon={Phone}
          color={color}
          placeholder="Téléphone de contact"
          value={form.contactPhone}
          onChange={setField("contactPhone")}
          type="tel"
        />

        {/* Date limite */}
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <CalendarIcon size={14} style={{ color }} />
            <TextInput
             
              value={form.deadline}
              onChangeText={(text) => setField("deadline")(text)}
              className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
            />
          </View>
        </View>

        <SubmitBtn
          color={color}
          label="Publier l'offre"
          onPress={handleSubmit}
          disabled={
            !form.title || !form.company || !form.description || !form.city
          }
          loading={loading}
        />
      </View>
    </FormWrapper>
  );
}

// ─── Categories for Generic Forms ──────────────────────────────────────────

const IMMO_CATS = [
  "Location",
  "Vente",
  "Colocation",
  "Terrain",
  "Bureau",
  "Commerce",
];
const SERVICE_CATS = [
  "Informatique",
  "Plomberie",
  "Électricité",
  "Éducation",
  "Design",
  "Transport",
  "Autre",
];
const EVENT_CATS = [
  "Concert",
  "Conférence",
  "Sport",
  "Culture",
  "Formation",
  "Fête",
  "Autre",
];
const COMMUNITY_CATS = [
  "Discussion",
  "Conseil",
  "Témoignage",
  "Question",
  "Info",
  "Humour",
];
const AGRI_CATS = [
  "Céréales",
  "Légumes",
  "Fruits",
  "Intrants",
  "Matériel",
  "Conseil",
];
const SANTE_CATS = [
  "Consultation",
  "Pharmacie",
  "Urgence",
  "Télémédecine",
  "Prévention",
  "Autre",
];
const ANNONCE_CATS = [
  "Électronique",
  "Vêtements",
  "Mobilier",
  "Véhicule",
  "Livres",
  "Autre",
];
const RESTO_CATS = [
  "Restaurant",
  "Traiteur",
  "Snack",
  "Livraison",
  "Café",
  "Fast-food",
];
const HEBERG_CATS = [
  "Hôtel",
  "Appartement",
  "Villa",
  "Chambre",
  "Auberge",
  "Studio",
];
const ENERGIE_CATS = [
  "Solaire",
  "Groupe électrogène",
  "LED",
  "Installation",
  "Maintenance",
  "Autre",
];
const ONG_CATS = [
  "Éducation",
  "Santé",
  "Environnement",
  "Humanitaire",
  "Sport",
  "Culture",
];
const VIDEO_CATS = [
  "Court",
  "Long",
  "Tutorial",
  "Divertissement",
  "Vlog",
  "Live replay",
];
const ARTICLE_CATS = [
  "Tech",
  "Société",
  "Culture",
  "Santé",
  "Business",
  "Éducation",
];
const SONDAGE_CATS = [
  "Opinion",
  "Fun",
  "Business",
  "Communauté",
  "Sport",
  "Autre",
];
const MARKETPLACE_CATS = [
  "Électronique",
  "Mode",
  "Maison & Jardin",
  "Véhicules",
  "Alimentation",
  "Artisanat",
  "Services",
  "Beauté & Santé",
  "Autre",
];

type FormState = {
  title: string;
  description: string;
  price: string;
  location: string;
  category: string;
  contact: string;
  condition: string;
};

const AI_CONTENT_TYPE_MAP: Record<
  ExtendedPublicationType,
  | "post"
  | "job_description"
  | "property_description"
  | "product_description"
  | "event_description"
  | "bio"
> = {
  immo: "property_description",
  job: "job_description",
  service: "post",
  evenement: "event_description",
  community: "post",
  agri: "product_description",
  sante: "post",
  transport: "post",
  annonce: "product_description",
  restauration: "product_description",
  hebergement: "property_description",
  energie: "product_description",
  ong: "post",
  video: "post",
  article: "post",
  sondage: "post",
  marketplace: "product_description",
  network: "bio",
  voyages: "post",
};

// ─── Generic Form ────────────────────────────────────────────────────────────

function GenericForm({
  type,
  color,
  cats,
  titlePlaceholder,
  descPlaceholder,
  pricePlaceholder,
  submitLabel,
  onBack,
  onClose,
  createFn,
}: {
  type: ExtendedPublicationType;
  color: string;
  cats: string[];
  titlePlaceholder: string;
  descPlaceholder: string;
  pricePlaceholder: string;
  submitLabel: string;
  onBack: () => void;
  onClose: () => void;
  createFn: ReturnType<
    typeof useMutation<typeof api.publications.createPublication>
  >;
}) {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "",
    contact: "",
    condition: "",
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  const set = (k: keyof FormState) => (v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const detectLocation = useCallback(() => {
    if (!("geolocation" in undefined)) {
      UIService.openToast("Géolocalisation non supportée", "error");
      return;
    }
    setLocating(true);
    undefined.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`,
          );
          const data = (await res.json()) as {
            address?: {
              city?: string;
              town?: string;
              village?: string;
              suburb?: string;
              state?: string;
              country?: string;
            };
          };
          const addr = data.address;
          const place =
            addr?.city ??
            addr?.town ??
            addr?.village ??
            addr?.suburb ??
            addr?.state ??
            "";
          const country = addr?.country ?? "";
          set("location")(
            place
              ? `${place}, ${country}`
              : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
          UIService.openToast("Position détectée !", "success");
        } catch {
          set("location")(
            `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          );
        }
        setLocating(false);
      },
      () => {
        UIService.openToast("Impossible de détecter la position", "error");
        setLocating(false);
      },
      { timeout: 10000 },
    );
  }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.description) return;
    setLoading(true);
    try {
      const meta: any = {};
      if (type === "annonce" && form.condition) {
        meta.condition = form.condition;
      }
      if (form.contact) {
        meta.contact = form.contact;
      }

      // ✅ Cast en any pour éviter l'erreur TypeScript (le type "voyages" n'est jamais passé ici)
      await createFn({
        type: type as any,
        title: form.title,
        description: form.description,
        price: form.price || undefined,
        location: form.location || undefined,
        category: form.category || undefined,
        images,
        tags: form.category ? [form.category.toLowerCase()] : [],
        meta: Object.keys(meta).length > 0 ? JSON.stringify(meta) : undefined,
      });
      UIService.openToast("Publication créée avec succès !", "success");
      onClose();
    } catch {
      UIService.openToast("Erreur lors de la publication. Réessayez.", "error");
    } finally {
      setLoading(false);
    }
  };

  const optionConfig = CREATE_OPTIONS.find((o) => o.id === type);

  return (
    <FormWrapper
      title={optionConfig?.label ?? "Créer"}
      color={color}
      onBack={onBack}
      onClose={onClose}
    >
      <CategoryPills
        cats={cats}
        active={form.category}
        color={color}
        onChange={set("category")}
      />
      <FieldInput
        icon={Tag}
        color={color}
        placeholder={titlePlaceholder}
        value={form.title}
        onChange={set("title")}
      />
      <FieldTextarea
        icon={FileText}
        color={color}
        placeholder={descPlaceholder}
        value={form.description}
        onChange={set("description")}
        rows={3}
      />
      <AIWriteAssist
        contentType={AI_CONTENT_TYPE_MAP[type]}
        topic={form.title}
        onGenerated={(text) => set("description")(text)}
        description={form.description}
        onTagsSuggested={(_tags) => {}}
        category={form.category || undefined}
        color={color}
      />
      <ImageUploader images={images} onChange={setImages} color={color} />
      <FieldInput
        icon={Tag}
        color={color}
        placeholder={pricePlaceholder}
        value={form.price}
        onChange={set("price")}
      />
      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <MapPin size={14} style={{ color }} />
          <TextInput
            value={form.location}
            onChangeText={(text) => set("location")(text)}
            placeholder="Localisation (ville, quartier)"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/25 outline-none"
          />
          <Pressable
           
            onPress={detectLocation}
            disabled={locating}
            className="flex-shrink-0 disabled:opacity-40"
           
          >
            {locating ? (
              <Loader2 size={14} className="animate-spin" style={{ color }} />
            ) : (
              <LocateFixed size={14} style={{ color }} />
            )}
          </Pressable>
        </View>
      </View>
      {type === "annonce" && (
        <View
          className="rounded-2xl p-3.5 mb-2"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
        >
          <View className="flex items-center gap-2.5">
            <Tag size={14} style={{ color }} />
            <Picker
             
              onValueChange={(val) => set("condition")(val)}
              className="flex-1 bg-transparent text-white text-sm outline-none"
             selectedValue={form.condition}>
              <Picker.Item label="État du produit (optionnel)" value="" />
              <Picker.Item label="Neuf" value="neuf" />
              <Picker.Item label="Comme neuf" value="comme-neuf" />
              <Picker.Item label="Très bon état" value="tres-bon" />
              <Picker.Item label="Bon état" value="bon" />
              <Picker.Item label="État acceptable" value="acceptable" />
            </Picker>
          </View>
        </View>
      )}
      <FieldInput
        icon={Tag}
        color={color}
        placeholder="Contact (téléphone / email)"
        value={form.contact}
        onChange={set("contact")}
      />
      <SubmitBtn
        color={color}
        label={submitLabel}
        onPress={handleSubmit}
        disabled={!form.title || !form.description}
        loading={loading}
      />
    </FormWrapper>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CreateBottomSheet({
  isOpen,
  onClose,
}: CreateBottomSheetProps) {
  const { isAuthenticated } = useFirebaseAuth();
  const createPublication = useMutation(api.publications.createPublication);

  const [activeType, setActiveType] = useState<ExtendedPublicationType | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [history, setHistory] = useState<ExtendedPublicationType[]>(() =>
    getCreationHistory(),
  );
  const [aiMode, setAiMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setActiveType(null);
      setAiMode(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        undefined<TextInput>('[data-create-hub-search="true"]')
          ?.focus();
      }

      if (event.key === "Escape") {
        if (activeType || aiMode) {
          setActiveType(null);
          setAiMode(false);
        } else {
          onClose();
        }
      }
    };

    undefined;
    return () => undefined;
  }, [isOpen, activeType, aiMode, onClose]);

  const handleSelectType = (id: ExtendedPublicationType) => {
    addToHistory(id);
    setHistory(getCreationHistory());
    setAiMode(false);
    setActiveType(id);
  };

  const handleClose = () => {
    setActiveType(null);
    setAiMode(false);
    onClose();
  };

  const handleBackToHub = () => {
    setActiveType(null);
    setAiMode(false);
    setSearchQuery("");
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return CREATE_OPTIONS;

    const q = searchQuery.toLowerCase().trim();

    return CREATE_OPTIONS.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.desc.toLowerCase().includes(q) ||
        opt.keywords?.some((kw) => kw.toLowerCase().includes(q)),
    );
  }, [searchQuery]);

  const activeOption = activeType
    ? CREATE_OPTIONS.find((o) => o.id === activeType)
    : null;

  const formConfig: Record<
    Exclude<ExtendedPublicationType, "transport" | "voyages">,
    {
      cats: string[];
      titlePlaceholder: string;
      descPlaceholder: string;
      pricePlaceholder: string;
      submitLabel: string;
    }
  > = {
    immo: {
      cats: IMMO_CATS,
      titlePlaceholder: "Titre de l'annonce",
      descPlaceholder: "Décrivez le bien (surface, état, équipements...)",
      pricePlaceholder: "Prix ou loyer (ex: 450 000 FCFA/mois)",
      submitLabel: "Publier l'annonce",
    },
    job: {
      cats: [],
      titlePlaceholder: "",
      descPlaceholder: "",
      pricePlaceholder: "",
      submitLabel: "",
    },
    service: {
      cats: SERVICE_CATS,
      titlePlaceholder: "Nom du service",
      descPlaceholder: "Décrivez votre service en détail...",
      pricePlaceholder: "Tarif (ex: 15 000 FCFA/h)",
      submitLabel: "Publier le service",
    },
    evenement: {
      cats: EVENT_CATS,
      titlePlaceholder: "Nom de l'événement",
      descPlaceholder: "Programme, intervenants, informations pratiques...",
      pricePlaceholder: "Prix d'entrée (ou Gratuit)",
      submitLabel: "Publier l'événement",
    },
    community: {
      cats: COMMUNITY_CATS,
      titlePlaceholder: "Titre de votre post",
      descPlaceholder: "Quoi de neuf ? Partagez avec votre communauté...",
      pricePlaceholder: "Lien ou référence (optionnel)",
      submitLabel: "Publier le post",
    },
    agri: {
      cats: AGRI_CATS,
      titlePlaceholder: "Produit ou service agricole",
      descPlaceholder: "Quantité disponible, qualité, conditions...",
      pricePlaceholder: "Prix (ex: 18 000 FCFA / 50kg)",
      submitLabel: "Publier l'offre agri",
    },
    sante: {
      cats: SANTE_CATS,
      titlePlaceholder: "Service de santé",
      descPlaceholder: "Spécialité, disponibilités, conditions...",
      pricePlaceholder: "Tarif consultation",
      submitLabel: "Publier l'annonce santé",
    },
    annonce: {
      cats: ANNONCE_CATS,
      titlePlaceholder: "Titre de l'annonce",
      descPlaceholder: "État, caractéristiques, raison de la vente...",
      pricePlaceholder: "Prix demandé",
      submitLabel: "Publier l'annonce",
    },
    restauration: {
      cats: RESTO_CATS,
      titlePlaceholder: "Nom du restaurant / plat",
      descPlaceholder: "Menu, spécialités, horaires d'ouverture...",
      pricePlaceholder: "Fourchette de prix",
      submitLabel: "Publier la fiche",
    },
    hebergement: {
      cats: HEBERG_CATS,
      titlePlaceholder: "Nom de l'hébergement",
      descPlaceholder: "Équipements, règlement, disponibilités...",
      pricePlaceholder: "Tarif nuit/mois",
      submitLabel: "Publier l'hébergement",
    },
    energie: {
      cats: ENERGIE_CATS,
      titlePlaceholder: "Produit ou service énergie",
      descPlaceholder: "Caractéristiques, puissance, garantie...",
      pricePlaceholder: "Prix ou devis",
      submitLabel: "Publier l'offre énergie",
    },
    ong: {
      cats: ONG_CATS,
      titlePlaceholder: "Nom de la campagne",
      descPlaceholder: "Objectif, bénéficiaires, comment aider...",
      pricePlaceholder: "Objectif de collecte",
      submitLabel: "Lancer la campagne",
    },
    video: {
      cats: VIDEO_CATS,
      titlePlaceholder: "Titre de la vidéo",
      descPlaceholder: "Décrivez votre vidéo, ajoutez des hashtags...",
      pricePlaceholder: "Lien vidéo (YouTube, etc.)",
      submitLabel: "Publier la vidéo",
    },
    article: {
      cats: ARTICLE_CATS,
      titlePlaceholder: "Titre de l'article",
      descPlaceholder: "Rédigez votre article...",
      pricePlaceholder: "Temps de lecture (ex: 5 min)",
      submitLabel: "Publier l'article",
    },
    sondage: {
      cats: SONDAGE_CATS,
      titlePlaceholder: "Question du sondage",
      descPlaceholder: "Options (une par ligne, max 4)",
      pricePlaceholder: "Durée (ex: 48h)",
      submitLabel: "Lancer le sondage",
    },
    marketplace: {
      cats: MARKETPLACE_CATS,
      titlePlaceholder: "Nom du produit",
      descPlaceholder: "Décrivez votre produit (caractéristiques, état...)",
      pricePlaceholder: "Prix (ex: 150 000 FCFA)",
      submitLabel: "Publier le produit",
    },
    network: {
      cats: [],
      titlePlaceholder: "",
      descPlaceholder: "",
      pricePlaceholder: "",
      submitLabel: "",
    },
  };

  const renderActiveForm = () => {
    if (!activeType) return null;

    const color = activeOption?.color ?? "#8B5CF6";

    if (activeType === "job") {
      return (
        <JobForm onBack={handleBackToHub} onClose={handleClose} color={color} />
      );
    }

    if (activeType === "article") {
      return <ArticleForm onBack={handleBackToHub} onClose={handleClose} />;
    }

    if (activeType === "immo") {
      return (
        <CreatePropertySheet
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Bien publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "annonce") {
      return (
        <CreateAnnonceSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Annonce publiée !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "service") {
      return (
        <CreateServiceSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Service publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "community") {
      return (
        <CreatePostSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Post publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "evenement") {
      return (
        <CreateEventSheet
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Événement créé !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "marketplace") {
      return (
        <CreateProductSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Produit publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "sante") {
      return (
        <CreateHealthSheet
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Annonce santé publiée !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "transport") {
      return (
        <CreateTransportSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            UIService.openToast("Trajet publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "restauration") {
      return (
        <CreateRestaurantSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            UIService.openToast("Restaurant ajouté !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "hebergement") {
      return (
        <CreateAccommodationSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            UIService.openToast("Hébergement ajouté !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "agri") {
      return (
        <CreateAgriSheet
          open={true}
          onOpenChange={(open) => {
            if (!open) handleClose();
          }}
          onSuccess={() => {
            UIService.openToast("Produit agricole publié !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "network") {
      return (
        <CreateNetworkSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Publication réseau créée !", "success");
            handleClose();
          }}
        />
      );
    }

    if (activeType === "voyages") {
      return (
        <CreateVoyageSheet
          isOpen={true}
          onClose={handleClose}
          onSuccess={() => {
            UIService.openToast("Voyage créé !", "success");
            handleClose();
          }}
        />
      );
    }

    return (
      <GenericForm
        type={activeType}
        color={color}
        createFn={createPublication}
        onBack={handleBackToHub}
        onClose={handleClose}
        {...formConfig[
          activeType as Exclude<
            ExtendedPublicationType,
            "transport" | "voyages"
          >
        ]}
      />
    );
  };

  return (
    <>
      {isOpen && (
        <>
          {/* Backdrop */}
          <Pressable
            onPress={handleClose}
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(2,2,12,.76)" }}
          />

          {/* Ambient glow behind the sheet */}
          <View
            className="fixed inset-x-0 bottom-0 z-40"
            style={{ height: "45vh" }}
          />

          {/* Hub */}
          <View
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto overflow-hidden rounded-t-[32px] sm:rounded-t-[36px]"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.085)", borderStyle: "solid", maxHeight: "min(92vh, 980px)" }}
          >
            {/* Top glow */}
            <View
              className="absolute left-0 right-0 top-0 h-px"
              style={{  }}
            />

            {/* Drag handle */}
            <View className="flex justify-center pt-3 pb-1">
              <View className="h-1.5 w-12 rounded-full bg-white/15" />
            </View>

            <View
              className="overflow-y-auto px-4 pb-8 sm:px-6 lg:px-8"
              style={{ maxHeight: "calc(min(92vh, 980px) - 22px)" }}
            >
              {!isAuthenticated ? (
                <View
                  className="mx-auto max-w-xl py-8 sm:py-12"
                >
                  <View className="flex justify-end mb-2">
                    <Pressable
                     
                      onPress={handleClose}
                      className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/6 border border-white/8"
                    >
                      <X size={17} className="text-white/70" />
                    </Pressable>
                  </View>

                  <View
                    className="relative overflow-hidden rounded-[30px] p-7 text-center"
                    style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
                  >
                    <View
                      className="mx-auto mb-5 h-16 w-16 rounded-[22px] flex items-center justify-center"
                      style={{  }}
                    >
                      <Sparkles size={27} className="text-white" />
                    </View>

                    <Text className="text-2xl font-black text-white">
                      Créez quelque chose de remarquable.
                    </Text>
                    <Text className="mt-2 text-sm leading-5 text-white/45">
                      Connectez-vous pour publier sur DébrouillePro.
                    </Text>

                    <View className="mt-6">
                      <SignInButton />
                    </View>
                  </View>
                </View>
              ) : (
                <AnimatePresence mode="wait">
                  {!activeType && !aiMode ? (
                    <View
                      key="hub"
                      className="mx-auto max-w-5xl pt-3"
                    >
                      <View className="flex items-center justify-between mb-3">
                        <View className="flex items-center gap-2">
                          <View
                            className="h-8 w-8 rounded-xl flex items-center justify-center"
                            style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.22)", borderStyle: "solid" }}
                          >
                            <Plus size={16} className="text-violet-200" />
                          </View>
                          <View>
                            <Text className="text-sm font-black text-white">
                              Créer
                            </Text>
                            <Text className="text-[10px] text-white/25">
                              Votre espace d'action
                            </Text>
                          </View>
                        </View>

                        <Pressable
                         
                          onPress={handleClose}
                          className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/6 border border-white/8"
                          accessibilityLabel="Fermer"
                        >
                          <X size={17} className="text-white/65" />
                        </Pressable>
                      </View>

                      <CreateHero onAI={() => setAiMode(true)} />

                      <CreateSearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                      />

                      {!searchQuery.trim() && (
                        <CreateQuickActions
                          history={history}
                          onSelect={handleSelectType}
                        />
                      )}

                      {searchQuery.trim() && (
                        <View className="mb-5 flex items-center gap-2">
                          <Compass size={13} className="text-cyan-300" />
                          <Text className="text-[10px] font-black uppercase tracking-[.16em] text-white/35">
                            {filteredOptions.length} résultat
                            {filteredOptions.length > 1 ? "s" : ""} pour{" "}
                            <Text className="text-white/65">
                              “{searchQuery}”
                            </Text>
                          </Text>
                        </View>
                      )}

                      {filteredOptions.length > 0 ? (
                        <CreateGroupedGrid
                          options={filteredOptions}
                          onSelect={handleSelectType}
                        />
                      ) : (
                        <View
                          className="rounded-[24px] p-7 text-center"
                          style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
                        >
                          <View className="mx-auto mb-3 h-11 w-11 rounded-2xl bg-white/6 flex items-center justify-center">
                            <Search size={18} className="text-white/35" />
                          </View>
                          <Text className="text-sm font-bold text-white/75">
                            Aucun résultat
                          </Text>
                          <Text className="mt-1 text-xs text-white/30">
                            Essayez un autre mot ou demandez à l'assistant.
                          </Text>
                          <Pressable
                           
                            onPress={() => setAiMode(true)}
                            className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white"
                            style={{  }}
                          >
                            <Sparkles size={13} />
                            <Text>M'aider à choisir</Text></Pressable>
                        </View>
                      )}

                      {history.length > 0 && !searchQuery.trim() && (
                        <CreateRecent
                          history={history}
                          onSelect={handleSelectType}
                        />
                      )}
                    </View>
                  ) : aiMode && !activeType ? (
                    <View
                      key="ai"
                      className="mx-auto max-w-2xl pt-3"
                    >
                      <View className="flex items-center justify-between mb-5">
                        <Pressable
                         
                          onPress={handleBackToHub}
                          className="flex items-center gap-2 text-sm text-white/55"
                        >
                          <ArrowLeft size={16} />
                          <Text>Retour</Text></Pressable>
                        <Pressable
                         
                          onPress={handleClose}
                          className="h-9 w-9 rounded-xl flex items-center justify-center bg-white/6 border border-white/8"
                        >
                          <X size={17} className="text-white/65" />
                        </Pressable>
                      </View>

                      <View
                        className="relative overflow-hidden rounded-[30px] p-6 sm:p-8"
                        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
                      >
                        <View className="text-center">
                          <View
                            className="mx-auto mb-4 h-14 w-14 rounded-[20px] flex items-center justify-center"
                            style={{  }}
                          >
                            <Sparkles size={23} className="text-white" />
                          </View>

                          <Text className="text-2xl sm:text-3xl font-black text-white">
                            Dites-moi ce que vous voulez faire.
                          </Text>
                          <Text className="mt-2 text-sm text-white/40">
                            Pas besoin de connaître le bon module. Décrivez
                            simplement votre objectif.
                          </Text>
                        </View>

                        <View className="mt-7">
                          <View
                            className="rounded-[22px] p-4"
                            style={{ backgroundColor: "rgba(0,0,0,.18)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
                          >
                            <TextInput
                              value={searchQuery}
                              onChangeText={(text) => setSearchQuery(text)}
                              autoFocus
                             
                              placeholder={`Ex. « Je veux vendre ma maison à Kinshasa »\nEx. « Je cherche un chauffeur »\nEx. « Je veux publier mon service de plomberie »`}
                              className="w-full bg-transparent text-white text-sm leading-6 placeholder:text-white/22 outline-none"
                             multiline textAlignVertical="top"/>
                          </View>

                          <Text className="mt-3 text-[10px] text-white/22 text-center">
                            <Text>L'assistant de création vous aidera à choisir le bon espace.</Text></Text>

                          <Pressable
                            disabled={!searchQuery.trim()}
                            onPress={() => {
                              const q = searchQuery.toLowerCase();
                              const match = CREATE_OPTIONS.find((opt) =>
                                opt.keywords.some((kw) => q.includes(kw)),
                              );

                              if (match) {
                                handleSelectType(match.id);
                              } else {
                                UIService.openToast("Choisissez une catégorie dans le hub pour continuer.", "info");
                                setAiMode(false);
                              }
                            }}
                            className="mt-5 w-full rounded-2xl py-4 text-sm font-black text-white flex items-center justify-center gap-2 disabled:opacity-35"
                            style={{  }}
                          >
                            <Wand2 size={16} />
                            <Text>Trouver le meilleur espace</Text><ArrowRight size={16} />
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View
                      key={activeType}
                      className="mx-auto max-w-4xl pt-2"
                    >
                      <View
                        className="mb-4 rounded-[22px] px-3 py-2.5 flex items-center gap-3"
                        style={{ borderColor: "#8B5CF6", borderStyle: "solid" }}
                      >
                        <Pressable
                          onPress={handleBackToHub}
                          className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center bg-white/6"
                          accessibilityLabel="Retour au hub"
                        >
                          <ArrowLeft size={15} className="text-white/70" />
                        </Pressable>

                        {activeOption && (
                          <>
                            <View
                              className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center"
                              style={{ backgroundColor: `${activeOption.color}20` }}
                            >
                              <activeOption.icon
                                size={15}
                                style={{ color: activeOption.color }}
                              />
                            </View>
                            <View className="min-w-0 flex-1">
                              <Text className="text-sm font-black text-white truncate">
                                {activeOption.label}
                              </Text>
                              <Text className="text-[10px] text-white/30 truncate">
                                {activeOption.desc}
                              </Text>
                            </View>
                          </>
                        )}

                        <Pressable
                          onPress={handleClose}
                          className="h-8 w-8 shrink-0 rounded-xl flex items-center justify-center bg-white/5"
                          accessibilityLabel="Fermer"
                        >
                          <X size={15} className="text-white/55" />
                        </Pressable>
                      </View>

                      {renderActiveForm()}
                    </View>
                  )}
                </AnimatePresence>
              )}
            </View>
          </View>
        </>
      )}
    </>
  );
}

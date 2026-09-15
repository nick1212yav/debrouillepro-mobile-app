import {
  View,
  Pressable,
  Text,
  TextInput,
  Platform,
  Modal,
} from "react-native";
import { useState, useEffect, useCallback } from "react";
import {
  Home,
  MessageCircle,
  Compass,
  Settings,
  User,
  Bell,
  Heart,
  Wallet,
  Map,
  LayoutDashboard,
  Package,
  Calendar,
  ShoppingBag,
  Star,
  BookOpen,
  Truck,
  Briefcase,
  Leaf,
  Film,
  Globe,
  Building,
  CreditCard,
  ChevronRight,
  Search,
  Command,
  HelpCircle,
  FileText,
  Shield,
  Info,
} from "lucide-react-native";

type CommandEntry = {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  category: string;
  keywords?: string[];
};

const COMMANDS: CommandEntry[] = [
  // Navigation principale
  {
    id: "home",
    label: "Accueil",
    icon: Home,
    category: "Navigation",
    keywords: ["accueil", "home", "feed"],
  },
  {
    id: "messages",
    label: "Messages",
    icon: MessageCircle,
    category: "Navigation",
    keywords: ["chat", "discussion"],
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    category: "Navigation",
    keywords: ["alertes", "notif"],
  },
  {
    id: "explorer",
    label: "Explorer",
    icon: Compass,
    category: "Navigation",
    keywords: ["decouvrir", "discover"],
  },
  {
    id: "profile",
    label: "Mon profil",
    icon: User,
    category: "Navigation",
    keywords: ["profil", "compte"],
  },
  {
    id: "settings",
    label: "Paramètres",
    icon: Settings,
    category: "Navigation",
    keywords: ["reglages", "config"],
  },
  // Services
  {
    id: "paiement",
    label: "Paiement",
    icon: CreditCard,
    category: "Services",
    keywords: ["argent", "payer", "mobile money"],
  },
  {
    id: "wallet",
    label: "Portefeuille",
    icon: Wallet,
    category: "Services",
    keywords: ["wallet", "solde"],
  },
  {
    id: "livraison",
    label: "Livraison",
    icon: Truck,
    category: "Services",
    keywords: ["colis", "delivery"],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    category: "Services",
    keywords: ["achat", "vente", "shop"],
  },
  {
    id: "immo",
    label: "Immobilier",
    icon: Building,
    category: "Services",
    keywords: ["maison", "appartement", "louer"],
  },
  {
    id: "transport",
    label: "Transport",
    icon: Globe,
    category: "Services",
    keywords: ["taxi", "bus", "moto"],
  },
  {
    id: "agri",
    label: "Agriculture",
    icon: Leaf,
    category: "Services",
    keywords: ["ferme", "champ", "agri"],
  },
  {
    id: "jobs",
    label: "Emploi",
    icon: Briefcase,
    category: "Services",
    keywords: ["travail", "offres", "recrutement"],
  },
  // Contenu
  {
    id: "media",
    label: "Médias",
    icon: Film,
    category: "Contenu",
    keywords: ["video", "photo", "musique"],
  },
  {
    id: "evenements",
    label: "Événements",
    icon: Calendar,
    category: "Contenu",
    keywords: ["concert", "sortie", "event"],
  },
  {
    id: "voyages",
    label: "Voyages",
    icon: Globe,
    category: "Contenu",
    keywords: ["voyage", "hotel", "billet"],
  },
  {
    id: "apprendre",
    label: "Apprendre",
    icon: BookOpen,
    category: "Contenu",
    keywords: ["cours", "formation", "quiz"],
  },
  // Outils
  {
    id: "dashboard",
    label: "Tableau de bord",
    icon: LayoutDashboard,
    category: "Outils",
    keywords: ["stats", "analytics"],
  },
  {
    id: "favorites",
    label: "Favoris",
    icon: Heart,
    category: "Outils",
    keywords: ["sauvegardes", "bookmark"],
  },
  {
    id: "carte",
    label: "Carte",
    icon: Map,
    category: "Outils",
    keywords: ["map", "localisation", "gps"],
  },
  {
    id: "recompenses",
    label: "Récompenses",
    icon: Star,
    category: "Outils",
    keywords: ["points", "badges", "xp"],
  },
  {
    id: "documents",
    label: "Documents",
    icon: FileText,
    category: "Outils",
    keywords: ["fichiers", "pdf", "docs"],
  },
  {
    id: "export",
    label: "Export",
    icon: Package,
    category: "Outils",
    keywords: ["csv", "pdf", "data"],
  },
  {
    id: "theme",
    label: "Thème & Perso",
    icon: Settings,
    category: "Outils",
    keywords: ["couleur", "dark", "theme"],
  },
  // Info
  {
    id: "help",
    label: "Aide & Support",
    icon: HelpCircle,
    category: "Info",
    keywords: ["aide", "faq", "support"],
  },
  {
    id: "about",
    label: "À propos",
    icon: Info,
    category: "Info",
    keywords: ["about", "version"],
  },
  {
    id: "privacy",
    label: "Confidentialité",
    icon: Shield,
    category: "Info",
    keywords: ["rgpd", "données"],
  },
  {
    id: "terms",
    label: "CGU",
    icon: FileText,
    category: "Info",
    keywords: ["conditions", "légal"],
  },
];

interface CommandPaletteProps {
  onNavigate: (page: string) => void;
}

export default function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // ── Ouverture via Cmd+K / Ctrl+K — WEB UNIQUEMENT ─────────────────────
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filtered = query.trim()
    ? COMMANDS.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.category.toLowerCase().includes(q) ||
          cmd.keywords?.some((k) => k.includes(q))
        );
      })
    : COMMANDS;

  const grouped = filtered.reduce<Record<string, CommandEntry[]>>(
    (acc, cmd) => {
      if (!acc[cmd.category]) acc[cmd.category] = [];
      acc[cmd.category].push(cmd);
      return acc;
    },
    {},
  );

  const flatList = filtered;

  const execute = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      onNavigate(id);
    },
    [onNavigate],
  );

  // ── Navigation clavier (flèches / entrée) — WEB UNIQUEMENT ────────────
  useEffect(() => {
    if (Platform.OS !== "web" || !open) return;
    if (flatList.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % flatList.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + flatList.length) % flatList.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (flatList[selectedIndex]) execute(flatList[selectedIndex].id);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, flatList, selectedIndex, execute]);

  return (
    <>
      {/* ── Trigger button — WEB desktop uniquement ─────────────────────── */}
      {Platform.OS === "web" && (
        <Pressable
          onPress={() => {
            setOpen(true);
            setQuery("");
          }}
          accessibilityLabel="Ouvrir la palette de commandes (Ctrl+K)"
          className="hidden md:flex flex-row items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            borderStyle: "solid",
          }}
        >
          <Search size={13} color="rgba(255,255,255,0.4)" />
          <Text className="text-xs text-white/40">Rechercher…</Text>
          <View className="ml-2 flex-row items-center gap-0.5 opacity-60">
            <Command size={10} color="rgba(255,255,255,0.4)" />
            <Text className="text-xs text-white/40">K</Text>
          </View>
        </Pressable>
      )}

      {/* ── Modal — fonctionne sur web + mobile ─────────────────────────── */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            alignItems: "center",
            paddingTop: Platform.OS === "web" ? "8%" : 60,
            paddingHorizontal: 16,
          }}
        >
          {/* Panel — stoppe la propagation du clic */}
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{
              width: "100%",
              maxWidth: 512,
              maxHeight: "80%",
              backgroundColor: "rgba(12,12,24,0.97)",
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              borderStyle: "solid",
            }}
          >
            {/* Search input */}
            <View
              className="flex-row items-center gap-3 px-4 py-3.5"
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Search size={17} color="rgba(255,255,255,0.4)" />
              <TextInput
                autoFocus
                value={query}
                onChangeText={(v) => {
                  setQuery(v);
                  setSelectedIndex(0);
                }}
                placeholder="Rechercher une page, un service…"
                placeholderTextColor="rgba(255,255,255,0.3)"
                className="flex-1 text-sm text-white"
                style={
                  Platform.OS === "web"
                    ? ({ outlineStyle: "none" } as any)
                    : undefined
                }
                accessibilityLabel="Rechercher"
              />
              <View
                className="px-1.5 py-0.5 rounded"
                style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}
              >
                <Text className="text-[10px] text-white/25">ESC</Text>
              </View>
            </View>

            {/* Results */}
            <View
              className="py-2"
              style={{
                maxHeight: Platform.OS === "web" ? 400 : 360,
                overflowY: "auto",
              }}
            >
              {filtered.length === 0 && (
                <Text className="text-center text-sm text-white/30 py-8">
                  Aucun résultat
                </Text>
              )}

              {Object.entries(grouped).map(([category, cmds]) => (
                <View key={category}>
                  <Text className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                    {category}
                  </Text>

                  {cmds.map((cmd) => {
                    const globalIndex = flatList.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;

                    return (
                      <Pressable
                        key={cmd.id}
                        onPress={() => execute(cmd.id)}
                        className="flex-row items-center gap-3 px-4 py-2.5"
                        style={{
                          backgroundColor: isSelected
                            ? "rgba(139,92,246,0.15)"
                            : "transparent",
                        }}
                      >
                        <View
                          className="w-8 h-8 rounded-xl items-center justify-center"
                          style={{
                            backgroundColor: isSelected
                              ? "rgba(139,92,246,0.25)"
                              : "rgba(255,255,255,0.07)",
                          }}
                        >
                          <Icon
                            size={16}
                            color={
                              isSelected
                                ? "rgb(167,139,250)"
                                : "rgba(255,255,255,0.5)"
                            }
                          />
                        </View>

                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? "text-white" : "text-white/70"
                          }`}
                        >
                          {cmd.label}
                        </Text>

                        {isSelected && (
                          <View className="ml-auto">
                            <ChevronRight size={14} color="rgb(167,139,250)" />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>

            {/* Footer hint */}
            <View
              className="flex-row items-center gap-4 px-4 py-2"
              style={{
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.06)",
              }}
            >
              <Text className="text-[10px] text-white/25">↑↓ naviguer</Text>
              <Text className="text-[10px] text-white/25">↵ ouvrir</Text>
              <Text className="text-[10px] text-white/25">ESC fermer</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

import { View, Text, Pressable, TextInput } from "react-native";
import { useState, useEffect, useCallback } from "react";
import {
  Home, MessageCircle, Zap, Compass, Settings, User, Bell, Heart, Wallet,
  Map, LayoutDashboard, Package, Calendar, ShoppingBag, Star, BookOpen,
  Truck, Briefcase, Leaf, Film, Globe, Building, CreditCard, ChevronRight,
  Search, Command, HelpCircle, FileText, Shield, Info
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
  { id: "home",         label: "Accueil",        icon: Home,          category: "Navigation", keywords: ["accueil", "home", "feed"] },
  { id: "messages",     label: "Messages",       icon: MessageCircle, category: "Navigation", keywords: ["chat", "discussion"] },
  { id: "notifications",label: "Notifications",  icon: Bell,          category: "Navigation", keywords: ["alertes", "notif"] },
  { id: "explorer",     label: "Explorer",       icon: Compass,       category: "Navigation", keywords: ["decouvrir", "discover"] },
  { id: "profile",      label: "Mon profil",     icon: User,          category: "Navigation", keywords: ["profil", "compte"] },
  { id: "settings",     label: "Paramètres",     icon: Settings,      category: "Navigation", keywords: ["reglages", "config"] },
  // Services
  { id: "paiement",     label: "Paiement",       icon: CreditCard,    category: "Services",   keywords: ["argent", "payer", "mobile money"] },
  { id: "wallet",       label: "Portefeuille",   icon: Wallet,        category: "Services",   keywords: ["wallet", "solde"] },
  { id: "livraison",    label: "Livraison",      icon: Truck,         category: "Services",   keywords: ["colis", "delivery"] },
  { id: "marketplace",  label: "Marketplace",    icon: ShoppingBag,   category: "Services",   keywords: ["achat", "vente", "shop"] },
  { id: "immo",         label: "Immobilier",     icon: Building,      category: "Services",   keywords: ["maison", "appartement", "louer"] },
  { id: "transport",    label: "Transport",      icon: Globe,         category: "Services",   keywords: ["taxi", "bus", "moto"] },
  { id: "agri",         label: "Agriculture",    icon: Leaf,          category: "Services",   keywords: ["ferme", "champ", "agri"] },
  { id: "jobs",         label: "Emploi",         icon: Briefcase,     category: "Services",   keywords: ["travail", "offres", "recrutement"] },
  // Contenu
  { id: "media",        label: "Médias",         icon: Film,          category: "Contenu",    keywords: ["video", "photo", "musique"] },
  { id: "evenements",   label: "Événements",     icon: Calendar,      category: "Contenu",    keywords: ["concert", "sortie", "event"] },
  { id: "voyages",      label: "Voyages",        icon: Globe,         category: "Contenu",    keywords: ["voyage", "hotel", "billet"] },
  { id: "apprendre",    label: "Apprendre",      icon: BookOpen,      category: "Contenu",    keywords: ["cours", "formation", "quiz"] },
  // Autres
  { id: "dashboard",    label: "Tableau de bord",icon: LayoutDashboard,category: "Outils",   keywords: ["stats", "analytics"] },
  { id: "favorites",    label: "Favoris",        icon: Heart,         category: "Outils",     keywords: ["sauvegardes", "bookmark"] },
  { id: "carte",        label: "Carte",          icon: Map,           category: "Outils",     keywords: ["map", "localisation", "gps"] },
  { id: "recompenses",  label: "Récompenses",    icon: Star,          category: "Outils",     keywords: ["points", "badges", "xp"] },
  { id: "documents",    label: "Documents",      icon: FileText,      category: "Outils",     keywords: ["fichiers", "pdf", "docs"] },
  { id: "export",       label: "Export",         icon: Package,       category: "Outils",     keywords: ["csv", "pdf", "data"] },
  { id: "theme",        label: "Thème & Perso",  icon: Settings,      category: "Outils",     keywords: ["couleur", "dark", "theme"] },
  // Info
  { id: "help",         label: "Aide & Support", icon: HelpCircle,    category: "Info",       keywords: ["aide", "faq", "support"] },
  { id: "about",        label: "À propos",       icon: Info,          category: "Info",       keywords: ["about", "version"] },
  { id: "privacy",      label: "Confidentialité",icon: Shield,        category: "Info",       keywords: ["rgpd", "données"] },
  { id: "terms",        label: "CGU",            icon: FileText,      category: "Info",       keywords: ["conditions", "légal"] },
];

interface CommandPaletteProps {
  onNavigate: (page: string) => void;
}

export default function CommandPalette({ onNavigate }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Open with Cmd+K or Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    undefined;
    return () => undefined;
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

  // Group by category
  const grouped = filtered.reduce<Record<string, CommandEntry[]>>((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  // Flat list for keyboard nav
  const flatList = filtered;

  const execute = useCallback(
    (id: string) => {
      setOpen(false);
      setQuery("");
      onNavigate(id);
    },
    [onNavigate],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % flatList.length);
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((i) => (i - 1 + flatList.length) % flatList.length);
      } else if (e.key === "Enter") {
        if (flatList[selectedIndex]) execute(flatList[selectedIndex].id);
      }
    };
    undefined;
    return () => undefined;
  }, [open, flatList, selectedIndex, execute]);

  return (
    <>
      {/* Trigger button (shows on desktop) */}
      <Pressable
        onPress={() => { setOpen(true); setQuery(""); }}
        accessibilityLabel="Ouvrir la palette de commandes (Ctrl+K)"
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-white/40"
        style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
      >
        <Search size={13} />
        <Text>Rechercher…</Text>
        <Text className="ml-2 flex items-center gap-0.5 opacity-60">
          <Command size={10} />
          <Text>K</Text>
        </Text>
      </Pressable>

      <>
        {open && (
          <>
            {/* Backdrop */}
            <Pressable
              key="cp-bg"
              className="fixed inset-0 z-[60] bg-black/70"
              onPress={() => setOpen(false)}
            />

            {/* Panel */}
            <View
              key="cp-panel"
              className="fixed top-[8%] left-1/2 -translate-x-1/2 z-[61] w-[92vw] max-w-lg rounded-2xl overflow-hidden shadow-2xl"
              style={{ backgroundColor: "rgba(12, 12, 24, 0.97)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
            >
              {/* Search input */}
              <View className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
                <Search size={17} className="text-white/40 flex-shrink-0" />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={(text) => { setQuery(text); setSelectedIndex(0); }}
                  placeholder="Rechercher une page, un service…"
                  className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
                  accessibilityLabel="Rechercher"
                />
                <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
              </View>

              {/* Results */}
              <View className="max-h-[60vh] overflow-y-auto py-2">
                {filtered.length === 0 && (
                  <Text className="text-center text-sm text-white/30 py-8">Aucun résultat</Text>
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
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          onPress={() => execute(cmd.id)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-left"
                          style={{ backgroundColor: isSelected ? "rgba(139,92,246,0.15)" : "transparent" }}
                        >
                          <Text
                            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: isSelected ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.07)" }}
                          >
                            <Icon size={16} className={isSelected ? "text-violet-400" : "text-white/50"} />
                          </Text>
                          <Text className={`text-sm font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                            {cmd.label}
                          </Text>
                          {isSelected && (
                            <ChevronRight size={14} className="ml-auto text-violet-400" />
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Footer hint */}
              <View className="border-t border-white/6 px-4 py-2 flex items-center gap-4 text-[10px] text-white/25">
                <Text>↑↓ naviguer</Text>
                <Text>↵ ouvrir</Text>
                <Text>ESC fermer</Text>
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}

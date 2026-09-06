import { View, Pressable, Text, TextInput } from "react-native";
import {
  Wallet,
  Bus,
  Package,
  Heart,
  Briefcase,
  Map,
  Plane,
  Building2,
  Users,
  Leaf,
  Newspaper,
  PartyPopper,
  Shield,
  MessageCircle,
  Compass,
  Settings2,
  RotateCcw,
  X,
  Check,
  GripVertical,
  BookOpen,
  Gift,
  ShoppingBag,
  Star,
  Bell,
  LayoutDashboard,
  Zap,
  Bookmark,
  DollarSign,
  HelpCircle,
  User,
  Search,
  Calendar,
  Scale,
  Radio,
  Trophy,
  Crown,
  TrendingUp,
  BarChart2,
  PenLine,
  Image as ImageIcon,
  Sparkles,
  LayoutTemplate,
  Dumbbell,
  Salad,
  Moon,
  Globe,
  CalendarDays,
  Award,
  Brain,
  Medal,
  Hotel,
  UtensilsCrossed,
  Tag as TagIcon,
  Building,
  Ruler,
  TreePine,
  Home as HomeIcon,
  Wrench,
  MapPin,
  GraduationCap,
  Church,
  Network,
  Megaphone,
  Database,
  ShieldAlert,
  Box,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  type ActionId,
  ALL_ACTIONS,
  useQuickActions,
} from "@/hooks/use-quick-actions";

/* ============================================================
 * ICON SYSTEM
 * ============================================================ */

const ICON_MAP: Record<ActionId, React.ElementType> = {
  paiement: Wallet,
  wallet: DollarSign,
  transport: Bus,
  livraison: Package,
  sante: Heart,
  emplois: Briefcase,
  carte: Map,
  voyages: Plane,
  immo: Building2,
  community: Users,
  agri: Leaf,
  media: Newspaper,
  evenements: PartyPopper,
  sos: Shield,
  messages: MessageCircle,
  explorer: Compass,
  apprendre: BookOpen,
  parrainage: Gift,
  marketplace: ShoppingBag,
  recompenses: Star,
  dashboard: LayoutDashboard,
  notifications: Bell,
  favorites: Bookmark,
  actions: Zap,
  profile: User,
  agenda: Calendar,
  "events-agenda": Calendar,
  analytics: BarChart2,
  boost: Zap,
  documents: Shield,
  logement: Building2,
  emploi: Briefcase,
  "evenements-pro": PartyPopper,
  juridique: Scale,
  groupes: Users,
  live: Radio,
  reputation: Trophy,
  cocreation: Zap,
  premium: Crown,
  revenus: TrendingUp,
  "marketplace-pro": ShoppingBag,
  "revenus-dashboard": BarChart2,
  editeur: PenLine,
  studio: ImageIcon,
  "stories-creator": Sparkles,
  templates: LayoutTemplate,
  fitness: Dumbbell,
  nutrition: Salad,
  meditation: Moon,
  bienetre: Heart,
  destinations: Globe,
  planificateur: CalendarDays,
  "carnet-voyage": BookOpen,
  "budget-voyage": DollarSign,
  cours: Award,
  quiz: Brain,
  certifications: Medal,
  mentorat: Users,
  hebergement: Hotel,
  restauration: UtensilsCrossed,
  annonces: TagIcon,
  urbanisme: Building,
  amenagement: Ruler,
  environnement: TreePine,
  business: Briefcase,
  "city-habitat": HomeIcon,
  services: Wrench,
  tracking: MapPin,
  ecole: GraduationCap,
  eglise: Church,
  network: Network,
  pub: Megaphone,
  "data-publique": Database,
  securite: ShieldAlert,
  map3d: Box,
  "ai-studio": Sparkles,
  budget: DollarSign,
  aide: HelpCircle,
  actualites: Newspaper,
};

/* ============================================================
 * TYPES
 * ============================================================ */

interface QuickActionsProps {
  onNavigate: (page: string) => void;
}

/* ============================================================
 * CONSTANTS
 * ============================================================ */

const MAX_VISIBLE_ACTIONS = 7;

/* ============================================================
 * MAIN COMPONENT
 * ============================================================ */

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const shouldReduceMotion = useReducedMotion();

  const [customizing, setCustomizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [focusedAction, setFocusedAction] = useState<ActionId | null>(null);

  const searchRef = useRef<TextInput>(null);

  const { activeIds, activeActions, canAdd, toggle, reorder, reset } =
    useQuickActions();

  /* ==========================================================
   * AVAILABLE ACTIONS
   * ========================================================== */

  const available = useMemo(
    () => ALL_ACTIONS.filter((action) => !activeIds.includes(action.id)),
    [activeIds],
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredAvailable = useMemo(() => {
    if (!normalizedSearch) {
      return available;
    }

    return available.filter((action) => {
      return (
        action.label.toLowerCase().includes(normalizedSearch) ||
        action.description.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [available, normalizedSearch]);

  /* ==========================================================
   * OPEN CUSTOMIZER
   * ========================================================== */

  const openCustomizer = useCallback(() => {
    setCustomizing(true);
    setSearchQuery("");
  }, []);

  const closeCustomizer = useCallback(() => {
    setCustomizing(false);
    setSearchQuery("");
    setFocusedAction(null);
  }, []);

  /* ==========================================================
   * KEYBOARD EXPERIENCE
   * ========================================================== */

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;

      if (modifier && event.key.toLowerCase() === "k") {
        openCustomizer();

        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });

        return;
      }

      if (event.key === "Escape" && customizing) {
        closeCustomizer();
      }
    };

    undefined;

    return () => {
      undefined;
    };
  }, [closeCustomizer, customizing, openCustomizer]);

  /* ==========================================================
   * RESET
   * ========================================================== */

  const handleReset = () => {
    reset();
    setFocusedAction(null);
  };

  /* ==========================================================
   * NAVIGATION
   * ========================================================== */

  const handleNavigate = (route: string, id: ActionId) => {
    setFocusedAction(id);
    onNavigate(route);
  };

  /* ==========================================================
   * RENDER
   * ========================================================== */

  return (
    <>
      {/* ======================================================
          ACTION CENTER
          ====================================================== */}

      <View
        className="relative mt-5 px-5"
        accessibilityLabel="Actions rapides"
      >
        {/* Decorative ambient glow */}

        <View
         
          className="absolute -left-10 top-10 h-32 w-32 rounded-full opacity-20"
          style={{  }}
        />

        <View
         
          className="absolute -right-10 top-0 h-24 w-24 rounded-full opacity-10"
          style={{  }}
        />

        {/* Header */}

        <View className="relative mb-4 flex items-center justify-between">
          <View className="flex items-center gap-2.5">
            <View
              className="flex h-7 w-7 items-center justify-center rounded-lg"
              style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.2)", borderStyle: "solid" }}
            >
              <Zap size={13} strokeWidth={2.4} className="text-violet-300" />
            </View>

            <View>
              <View className="flex items-center gap-2">
                <Text className="text-sm font-bold tracking-tight text-white">
                  Actions rapides
                </Text>

                <Text
                  className="rounded-full px-1.5 py-0.5 text-[8px] font-bold"
                  style={{ color: "rgba(196,181,253,.9)", backgroundColor: "rgba(139,92,246,.1)", borderWidth: 1, borderColor: "rgba(139,92,246,.15)", borderStyle: "solid" }}
                >
                  {activeIds.length}
                </Text>
              </View>

              <Text className="mt-0.5 text-[9px] text-white/25">
                Votre espace d'accès instantané
              </Text>
            </View>
          </View>

          <Pressable
            onPress={openCustomizer}
            className="group flex items-center gap-1.5 rounded-xl px-2.5 py-2"
            style={{ backgroundColor: "rgba(139,92,246,.07)", borderWidth: 1, borderColor: "rgba(139,92,246,.14)", borderStyle: "solid" }}
            accessibilityLabel="Personnaliser les actions rapides"
          >
            <Settings2
              size={12}
              className="text-violet-400"
            />

            <Text className="text-[10px] font-semibold text-violet-300">
              Personnaliser
            </Text>
          </Pressable>
        </View>

        {/* Active action grid */}

        {activeActions.length > 0 ? (
          <View className="relative gap-1.5">
            <>
              {activeActions
                .slice(0, MAX_VISIBLE_ACTIONS)
                .map((action, index) => {
                  const Icon = ICON_MAP[action.id];

                  if (!Icon) {
                    return null;
                  }

                  const isFocused = focusedAction === action.id;

                  return (
                    <Pressable
                      key={action.id}
                      onPress={() => handleNavigate(action.route, action.id)}
                      className="group relative flex min-w-0 flex-col items-center gap-1.5 outline-none"
                      accessibilityLabel={action.label}
                    >
                      {/* Aura */}

                      <View
                        className="absolute top-0 h-11 w-11 rounded-2xl"
                        style={{ backgroundColor: action.color }}
                      />

                      {/* Icon tile */}

                      <View
                        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[15px]"
                        style={{ backgroundColor: action.bg, borderStyle: "solid" }}
                      >
                        {/* shine */}

                        <View
                         
                          className="absolute inset-0 opacity-0"
                          style={{  }}
                        />

                        <Icon
                          size={19}
                          strokeWidth={1.9}
                          style={{
                            color: action.color,
                          }}
                          className="relative z-10"
                        />
                      </View>

                      {/* Label */}

                      <Text className="w-full truncate text-center text-[8.5px] font-semibold leading-tight text-white/55">
                        {action.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </>
          </View>
        ) : (
          <Pressable
            onPress={openCustomizer}
            className="flex w-full items-center gap-3 rounded-2xl p-4 text-left"
            style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.14)", borderStyle: "solid" }}
          >
            <View className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
              <Sparkles size={18} className="text-violet-300" />
            </View>

            <View className="min-w-0 flex-1">
              <Text className="text-xs font-bold text-white/75">
                Créez votre espace express
              </Text>

              <Text className="mt-0.5 text-[10px] text-white/30">
                Ajoutez vos services les plus utilisés.
              </Text>
            </View>

            <Text className="rounded-lg bg-violet-500/10 px-2 py-1 text-[9px] font-bold text-violet-300">
              Configurer
            </Text>
          </Pressable>
        )}
      </View>

      {/* ======================================================
          CUSTOMIZATION COMMAND CENTER
          ====================================================== */}

      <>
        {customizing && (
          <>
            {/* Backdrop */}

            <Pressable
              onPress={closeCustomizer}
              className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,.78)" }}
            />

            {/* Sheet */}

            <View
              className="fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[30px]"
              style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
              accessibilityRole="dialog"
              aria-modal="true"
              accessibilityLabel="Personnaliser les actions rapides"
            >
              {/* Ambient top glow */}

              <View
               
                className="absolute left-1/2 top-0 h-24 w-64 -translate-x-1/2 rounded-full opacity-20"
                style={{  }}
              />

              {/* Drag handle */}

              <View className="relative flex justify-center pb-1 pt-3">
                <View className="h-1 w-10 rounded-full bg-white/15" />
              </View>

              {/* Header */}

              <View
                className="relative flex flex-shrink-0 items-center justify-between px-5 py-4"
                style={{ borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.055)", }}
              >
                <View className="flex items-center gap-3">
                  <View
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.2)", borderStyle: "solid" }}
                  >
                    <Sparkles size={18} className="text-violet-300" />
                  </View>

                  <View>
                    <Text className="text-base font-black tracking-tight text-white">
                      Votre Command Center
                    </Text>

                    <Text className="mt-0.5 text-[10px] text-white/30">
                      {activeIds.length} raccourci
                      {activeIds.length !== 1 ? "s" : ""} actif
                      {activeIds.length !== 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>

                <View className="flex items-center gap-1.5">
                  {/* Reset */}

                  <Pressable
                    onPress={handleReset}
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
                    accessibilityLabel="Réinitialiser les actions"
                    title="Réinitialiser"
                  >
                    <RotateCcw size={14} className="text-white/40" />
                  </Pressable>

                  {/* Close */}

                  <Pressable
                    onPress={closeCustomizer}
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
                    accessibilityLabel="Fermer"
                  >
                    <X size={15} className="text-white/45" />
                  </Pressable>
                </View>
              </View>

              {/* Scroll area */}

              <View
                className="relative flex-1 overflow-y-auto px-5 pb-10"
                style={{  }}
              >
                {/* ==================================================
                    ACTIVE
                    ================================================== */}

                <View className="pt-5">
                  <View className="mb-3 flex items-center justify-between">
                    <View>
                      <Text className="text-[9px] font-black uppercase tracking-[.18em] text-white/25">
                        Vos raccourcis
                      </Text>

                      <Text className="mt-1 text-[10px] text-white/20">
                        Maintenez puis glissez pour réorganiser
                      </Text>
                    </View>

                    <Text className="rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-bold text-violet-300">
                      {activeIds.length}/{MAX_VISIBLE_ACTIONS}
                    </Text>
                  </View>

                  {activeIds.length > 0 ? (
                    <Reorder.Group
                      axis="y"
                      values={activeIds}
                      onReorder={(newIds) => reorder(newIds as ActionId[])}
                      className="flex flex-col gap-2"
                    >
                      {activeIds.map((id) => {
                        const action = ALL_ACTIONS.find(
                          (item) => item.id === id,
                        );

                        const Icon = ICON_MAP[id];

                        if (!action || !Icon) {
                          return null;
                        }

                        return (
                          <Reorder.Item
                            key={id}
                            value={id}
                            className="group flex items-center gap-3 rounded-2xl p-3"
                            style={{ backgroundColor: "rgba(255,255,255,.038)", borderWidth: 1, borderColor: "rgba(255,255,255,.065)", borderStyle: "solid" }}
                          >
                            <GripVertical
                              size={16}
                              className="flex-shrink-0 text-white/15"
                            />

                            <View
                              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: action.bg, borderStyle: "solid" }}
                            >
                              <Icon
                                size={17}
                                style={{
                                  color: action.color,
                                }}
                              />
                            </View>

                            <View className="min-w-0 flex-1">
                              <Text className="truncate text-xs font-bold text-white/75">
                                {action.label}
                              </Text>

                              <Text className="mt-0.5 truncate text-[9px] text-white/25">
                                {action.description}
                              </Text>
                            </View>

                            <Pressable
                              onPointerDown={(event) => event.stopPropagation()}
                              onPress={(event) => {
                                toggle(id);
                              }}
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: "rgba(239,68,68,.08)", borderWidth: 1, borderColor: "rgba(239,68,68,.15)", borderStyle: "solid" }}
                              accessibilityLabel={`Retirer ${action.label}`}
                            >
                              <X size={13} className="text-red-400/70" />
                            </Pressable>
                          </Reorder.Item>
                        );
                      })}
                    </Reorder.Group>
                  ) : (
                    <View
                      className="rounded-2xl p-6 text-center"
                      style={{ backgroundColor: "rgba(255,255,255,.025)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)", borderStyle: "dashed" }}
                    >
                      <View className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[.04]">
                        <Zap size={18} className="text-white/25" />
                      </View>

                      <Text className="text-xs font-semibold text-white/45">
                        Aucun raccourci
                      </Text>

                      <Text className="mx-auto mt-1 max-w-[230px] text-[10px] leading-relaxed text-white/20">
                        Ajoutez vos actions favorites pour construire votre
                        espace personnel.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Divider */}

                <View className="my-6 h-px bg-white/[.05]" />

                {/* ==================================================
                    SEARCH
                    ================================================== */}

                <View>
                  <View className="mb-3 flex items-center justify-between">
                    <View>
                      <Text className="text-[9px] font-black uppercase tracking-[.18em] text-white/25">
                        Explorer
                      </Text>

                      <Text className="mt-1 text-[10px] text-white/20">
                        Découvrez toutes vos possibilités
                      </Text>
                    </View>

                    <Text className="text-[9px] text-white/20">
                      {filteredAvailable.length}
                    </Text>
                  </View>

                  <View
                    className="group mb-4 flex h-11 items-center gap-2.5 rounded-2xl px-3.5"
                    style={{ backgroundColor: "rgba(255,255,255,.045)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
                  >
                    <Search
                      size={14}
                      className="flex-shrink-0 text-white/25 group-focus-within:text-violet-300"
                    />

                    <TextInput
                      ref={searchRef}
                      value={searchQuery}
                      onChangeText={(text) => setSearchQuery(text)}
                      placeholder="Rechercher une action..."
                      className="min-w-0 flex-1 bg-transparent text-xs font-medium text-white/80 outline-none placeholder:text-white/20"
                     
                     
                      accessibilityLabel="Rechercher une action"
                    />

                    <AnimatePresence>
                      {searchQuery && (
                        <Pressable
                          onPress={() => setSearchQuery("")}
                          className=""
                          accessibilityLabel="Effacer"
                        >
                          <X size={13} className="text-white/30" />
                        </Pressable>
                      )}
                    </AnimatePresence>
                  </View>

                  {/* Max reached */}

                  <AnimatePresence>
                    {!canAdd && (
                      <View
                        className="mb-3 overflow-hidden"
                      >
                        <View
                          className="flex items-center gap-2.5 rounded-2xl p-3"
                          style={{ backgroundColor: "rgba(245,158,11,.07)", borderWidth: 1, borderColor: "rgba(245,158,11,.14)", borderStyle: "solid" }}
                        >
                          <View className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                            <Star size={13} className="text-amber-400" />
                          </View>

                          <Text className="text-[10px] font-medium leading-relaxed text-amber-300/70">
                            <Text>Votre espace est complet. Retirez un raccourci pour en ajouter un nouveau.</Text></Text>
                        </View>
                      </View>
                    )}
                  </AnimatePresence>

                  {/* Available actions */}

                  <View className="flex flex-col gap-2">
                    <AnimatePresence mode="popLayout">
                      {filteredAvailable.map((action) => {
                        const Icon = ICON_MAP[action.id];

                        if (!Icon) {
                          return null;
                        }

                        const disabled = !canAdd;

                        return (
                          <Pressable
                            key={action.id}
                            onPress={() => {
                              if (!disabled) {
                                toggle(action.id);
                              }
                            }}
                            disabled={disabled}
                            className="group flex w-full items-center gap-3 rounded-2xl p-3 text-left disabled:cursor-not-allowed"
                            style={{ backgroundColor: "rgba(255,255,255,.025)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
                          >
                            <View
                              className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl"
                              style={{ backgroundColor: action.bg, borderStyle: "solid" }}
                            >
                              <Icon
                                size={17}
                                style={{
                                  color: action.color,
                                }}
                              />
                            </View>

                            <View className="min-w-0 flex-1">
                              <Text className="truncate text-xs font-bold text-white/65">
                                {action.label}
                              </Text>

                              <Text className="mt-0.5 truncate text-[9px] text-white/20">
                                {action.description}
                              </Text>
                            </View>

                            <View
                              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
                              style={{ backgroundColor: disabled
                                                                ? "rgba(255,255,255,.025)"
                                                                : `${action.color}12`, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
                            >
                              <Check
                                size={13}
                                style={{
                                  color: disabled
                                    ? "rgba(255,255,255,.15)"
                                    : action.color,
                                }}
                              />
                            </View>
                          </Pressable>
                        );
                      })}
                    </AnimatePresence>
                  </View>

                  {/* No results */}

                  <AnimatePresence>
                    {filteredAvailable.length === 0 && normalizedSearch && (
                      <View
                        className="py-10 text-center"
                      >
                        <View className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[.04]">
                          <Search size={17} className="text-white/20" />
                        </View>

                        <Text className="text-xs font-semibold text-white/35">
                          <Text>Aucun raccourci trouvé</Text></Text>

                        <Text className="mt-1 text-[10px] text-white/15">
                          <Text>Essayez un autre terme.</Text></Text>
                      </View>
                    )}
                  </AnimatePresence>
                </View>
              </View>

              {/* Bottom hint */}

              <View
                className="relative flex flex-shrink-0 items-center justify-center gap-2 px-5 py-3"
                style={{ borderTopWidth: 1, borderTopColor: "rgba(255,255,255,.045)", backgroundColor: "rgba(0,0,0,.12)" }}
              >
                <Sparkles size={10} className="text-violet-400/60" />

                <Text className="text-[9px] text-white/20">
                  Votre espace évolue avec vos habitudes
                </Text>
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}

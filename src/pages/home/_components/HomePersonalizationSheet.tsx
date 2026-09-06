import { View, Pressable, Text } from "react-native";
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Heart,
  Layers3,
  MapPin,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
  Zap,
} from "lucide-react-native";
import { useMemo, useState } from "react";

/* ============================================================================
 * TYPES
 * ========================================================================== */

export interface HomeModulePreference {
  id: string;
  label: string;
  shortLabel?: string;
  icon?: string;
  route: string;
  priority?: number;
}

export interface HomePersonalizationPreferences {
  favoriteModules: string[];
  hiddenSections: string[];
  customSectionOrder: string[];

  notificationPreferences: {
    newRecommendations: boolean;
    nearbyAlerts: boolean;
    opportunities: boolean;
  };
}

interface HomePersonalizationSheetProps {
  open: boolean;

  onClose: () => void;

  modules: HomeModulePreference[];

  preferences?: Partial<HomePersonalizationPreferences>;

  onSave?: (preferences: HomePersonalizationPreferences) => void;

  onReset?: () => void;
}

/* ============================================================================
 * MODULE VISUALS
 * ========================================================================== */

const MODULE_VISUALS: Record<
  string,
  {
    color: string;
    emoji: string;
  }
> = {
  jobs: {
    color: "#8B5CF6",
    emoji: "💼",
  },

  immo: {
    color: "#F97316",
    emoji: "🏠",
  },

  evenements: {
    color: "#EC4899",
    emoji: "🎉",
  },

  events: {
    color: "#EC4899",
    emoji: "🎉",
  },

  pay: {
    color: "#10B981",
    emoji: "💳",
  },

  education: {
    color: "#06B6D4",
    emoji: "🎓",
  },

  live: {
    color: "#EF4444",
    emoji: "🔴",
  },

  community: {
    color: "#A855F7",
    emoji: "👥",
  },

  transport: {
    color: "#3B82F6",
    emoji: "🚗",
  },

  sante: {
    color: "#22C55E",
    emoji: "❤️",
  },

  voyages: {
    color: "#6366F1",
    emoji: "✈️",
  },

  boutique: {
    color: "#EC4899",
    emoji: "🛍️",
  },

  agri: {
    color: "#84CC16",
    emoji: "🌱",
  },
};

const DEFAULT_PREFERENCES: HomePersonalizationPreferences = {
  favoriteModules: [],
  hiddenSections: [],
  customSectionOrder: [],
  notificationPreferences: {
    newRecommendations: true,
    nearbyAlerts: true,
    opportunities: true,
  },
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function visualFor(id: string) {
  return (
    MODULE_VISUALS[id.toLowerCase()] ?? {
      color: "#6366F1",
      emoji: "✨",
    }
  );
}

function normalizePreferences(
  value?: Partial<HomePersonalizationPreferences>,
): HomePersonalizationPreferences {
  return {
    favoriteModules:
      value?.favoriteModules ?? DEFAULT_PREFERENCES.favoriteModules,

    hiddenSections: value?.hiddenSections ?? DEFAULT_PREFERENCES.hiddenSections,

    customSectionOrder:
      value?.customSectionOrder ?? DEFAULT_PREFERENCES.customSectionOrder,

    notificationPreferences: {
      ...DEFAULT_PREFERENCES.notificationPreferences,
      ...(value?.notificationPreferences ?? {}),
    },
  };
}

/* ============================================================================
 * MAIN COMPONENT
 * ========================================================================== */

export default function HomePersonalizationSheet({
  open,
  onClose,
  modules,
  preferences,
  onSave,
  onReset,
}: HomePersonalizationSheetProps) {
  const initial = useMemo(
    () => normalizePreferences(preferences),
    [preferences],
  );

  const [activeTab, setActiveTab] = useState<"home" | "notifications">("home");

  const [localFavorites, setLocalFavorites] = useState<string[]>(
    initial.favoriteModules,
  );

  const [localHidden, setLocalHidden] = useState<string[]>(
    initial.hiddenSections,
  );

  const [localOrder, setLocalOrder] = useState<string[]>(() => {
    const preferred = initial.customSectionOrder;

    const existing = modules.map((module) => module.id);

    return [
      ...preferred.filter((id) => existing.includes(id)),
      ...existing.filter((id) => !preferred.includes(id)),
    ];
  });

  const [localNotifications, setLocalNotifications] = useState(
    initial.notificationPreferences,
  );

  const [saved, setSaved] = useState(false);

  const orderedModules = useMemo(() => {
    const map = new Map(modules.map((module) => [module.id, module]));

    return localOrder
      .map((id) => map.get(id))
      .filter((module): module is HomeModulePreference => Boolean(module));
  }, [localOrder, modules]);

  const visibleCount = modules.length - localHidden.length;

  const favoriteCount = localFavorites.length;

  /* --------------------------------------------------------------------------
   * ACTIONS
   * ------------------------------------------------------------------------ */

  const toggleFavorite = (moduleId: string) => {
    setSaved(false);

    setLocalFavorites((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId],
    );
  };

  const toggleVisibility = (moduleId: string) => {
    setSaved(false);

    setLocalHidden((current) =>
      current.includes(moduleId)
        ? current.filter((id) => id !== moduleId)
        : [...current, moduleId],
    );
  };

  const save = () => {
    const next: HomePersonalizationPreferences = {
      favoriteModules: localFavorites,

      hiddenSections: localHidden,

      customSectionOrder: localOrder,

      notificationPreferences: localNotifications,
    };

    onSave?.(next);

    setSaved(true);

    undefined;
  };

  const reset = () => {
    const fallback = modules.map((module) => module.id);

    setLocalFavorites([]);

    setLocalHidden([]);

    setLocalOrder(fallback);

    setLocalNotifications(DEFAULT_PREFERENCES.notificationPreferences);

    setSaved(false);

    onReset?.();
  };

  /* --------------------------------------------------------------------------
   * RENDER
   * ------------------------------------------------------------------------ */

  return (
    <>
      {open && (
        <>
          {/* ==================================================================
              BACKDROP
             ================================================================== */}

          <Pressable
            type="button"
            accessibilityLabel="Fermer"
            onPress={onClose}
            className="fixed inset-0 z-[90] bg-black/70"
          />

          {/* ==================================================================
              SHEET
             ================================================================== */}

          <View
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto flex max-h-[94vh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[34px]"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,.09)", borderStyle: "solid" }}
          >
            {/* ================================================================
                TOP GLOW
               ================================================================ */}

            <View
              className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full"
              style={{  }}
            />

            {/* ================================================================
                HANDLE
               ================================================================ */}

            <View className="relative flex justify-center pt-3">
              <View
                className="h-1 w-10 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,.16)" }}
              />
            </View>

            {/* ================================================================
                HEADER
               ================================================================ */}

            <View className="relative px-5 pb-3 pt-4">
              <View className="flex items-center gap-3">
                <View
                  className="flex h-11 w-11 items-center justify-center rounded-[16px]"
                  style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.2)", borderStyle: "solid" }}
                >
                  <Sparkles size={19} className="text-indigo-300" />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-[9px] font-black uppercase tracking-[.18em] text-indigo-300/70">
                    Ma Home
                  </Text>

                  <Text className="mt-0.5 text-[18px] font-black tracking-[-.035em] text-white">
                    Personnaliser
                  </Text>
                </View>

                <Pressable
                 
                  onPress={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white/40"
                  style={{ backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
                >
                  <X size={15} />
                </Pressable>
              </View>

              {/* --------------------------------------------------------------
                  SUMMARY
                 ------------------------------------------------------------ */}

              <View className="mt-4 gap-2">
                <MiniStat
                  icon={Layers3}
                  value={visibleCount}
                  label="visibles"
                  color="#6366F1"
                />

                <MiniStat
                  icon={Heart}
                  value={favoriteCount}
                  label="favoris"
                  color="#EC4899"
                />

                <MiniStat
                  icon={Zap}
                  value={localNotifications.opportunities ? 3 : 2}
                  label="alertes"
                  color="#F59E0B"
                />
              </View>
            </View>

            {/* ================================================================
                TABS
               ================================================================ */}

            <View className="relative px-5 pb-3">
              <View
                className="flex rounded-2xl p-1"
                style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
              >
                <TabButton
                  active={activeTab === "home"}
                  icon={Layers3}
                  label="Ma Home"
                  onPress={() => setActiveTab("home")}
                />

                <TabButton
                  active={activeTab === "notifications"}
                  icon={Bell}
                  label="Alertes"
                  onPress={() => setActiveTab("notifications")}
                />
              </View>
            </View>

            {/* ================================================================
                CONTENT
               ================================================================ */}

            <View
              className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-28"
              style={{  }}
            >
              <AnimatePresence mode="wait">
                {activeTab === "home" ? (
                  <View
                    key="home"
                  >
                    {/* ========================================================
                        PERSONALIZATION HERO
                       ====================================================== */}

                    <View
                      className="mb-5 overflow-hidden rounded-[24px] p-4"
                      style={{ borderWidth: 1, borderColor: "rgba(99,102,241,.12)", borderStyle: "solid" }}
                    >
                      <View className="flex gap-3">
                        <View
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: "rgba(99,102,241,.13)" }}
                        >
                          <Target size={14} className="text-indigo-300" />
                        </View>

                        <View>
                          <Text className="text-[10px] font-black text-white/80">
                            Construisez votre Home idéale
                          </Text>

                          <Text className="mt-1 text-[8px] leading-relaxed text-white/30">
                            Placez vos univers préférés en premier, masquez ce
                            qui ne vous intéresse pas et laissez DébrouillePro
                            adapter votre expérience.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ========================================================
                        MODULES
                       ====================================================== */}

                    <View>
                      <SectionTitle
                        icon={Layers3}
                        title="Vos univers"
                        subtitle="Glissez pour réorganiser"
                      />

                      <View className="mt-3 space-y-2">
                        <Reorder.Group
                          axis="y"
                          values={orderedModules}
                          onReorder={(next) => {
                            setSaved(false);

                            setLocalOrder(next.map((module) => module.id));
                          }}
                        >
                          {orderedModules.map((module, index) => {
                            const visual = visualFor(module.id);

                            const favorite = localFavorites.includes(module.id);

                            const hidden = localHidden.includes(module.id);

                            return (
                              <Reorder.Item
                                key={module.id}
                                value={module}
                                className="relative"
                              >
                                <View
                                  className="group flex items-center gap-2 rounded-[20px] p-2.5"
                                  style={{ backgroundColor: hidden
                                                                        ? "rgba(255,255,255,.018)"
                                                                        : "rgba(255,255,255,.04)", borderColor: "rgba(255,255,255,.045)", borderStyle: "solid", opacity: hidden ? 0.55 : 1 }}
                                >
                                  {/* POSITION */}

                                  <View className="flex w-5 shrink-0 justify-center">
                                    <Text className="text-[8px] font-black text-white/15">
                                      {String(index + 1).padStart(2, "0")}
                                    </Text>
                                  </View>

                                  {/* ICON */}

                                  <View
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] text-lg"
                                    style={{ backgroundColor: `${visual.color}12`, borderStyle: "solid" }}
                                  >
                                    {visual.emoji}
                                  </View>

                                  {/* INFO */}

                                  <View className="min-w-0 flex-1">
                                    <View className="flex items-center gap-1.5">
                                      <Text className="truncate text-[10px] font-black text-white/75">
                                        {module.label}
                                      </Text>

                                      {favorite && (
                                        <Star
                                          size={9}
                                          fill={visual.color}
                                          style={{
                                            color: visual.color,
                                          }}
                                        />
                                      )}
                                    </View>

                                    <Text className="mt-0.5 text-[7px] text-white/25">
                                      {hidden
                                        ? "Masqué de votre Home"
                                        : "Visible dans votre Home"}
                                    </Text>
                                  </View>

                                  {/* FAVORITE */}

                                  <Pressable
                                   
                                    onPress={() => toggleFavorite(module.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl"
                                    style={{ backgroundColor: favorite
                                                                            ? `${visual.color}14`
                                                                            : "rgba(255,255,255,.025)" }}
                                    accessibilityLabel={
                                      favorite
                                        ? "Retirer des favoris"
                                        : "Ajouter aux favoris"
                                    }
                                  >
                                    <Star
                                      size={13}
                                      fill={
                                        favorite ? visual.color : "transparent"
                                      }
                                      style={{
                                        color: favorite
                                          ? visual.color
                                          : "rgba(255,255,255,.22)",
                                      }}
                                    />
                                  </Pressable>

                                  {/* VISIBILITY */}

                                  <Pressable
                                   
                                    onPress={() => toggleVisibility(module.id)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-white/25"
                                    style={{ backgroundColor: "rgba(255,255,255,.025)" }}
                                    accessibilityLabel={hidden ? "Afficher" : "Masquer"}
                                  >
                                    {hidden ? (
                                      <EyeOff size={13} />
                                    ) : (
                                      <Eye size={13} />
                                    )}
                                  </Pressable>

                                  {/* DRAG */}

                                  <View className="flex h-8 w-6 items-center justify-center text-white/15">
                                    <GripVertical size={14} />
                                  </View>
                                </View>
                              </Reorder.Item>
                            );
                          })}
                        </Reorder.Group>
                      </View>
                    </View>

                    {/* ========================================================
                        FAVORITES EXPLAINER
                       ====================================================== */}

                    <View
                      className="mt-5 flex items-center gap-3 rounded-[20px] p-3"
                      style={{ backgroundColor: "rgba(236,72,153,.045)", borderWidth: 1, borderColor: "rgba(236,72,153,.09)", borderStyle: "solid" }}
                    >
                      <Heart size={13} className="shrink-0 text-pink-300" />

                      <Text className="text-[8px] leading-relaxed text-white/30">
                        Vos favoris influencent également les recommandations.
                        Ton moteur de feed leur attribue déjà davantage de
                        poids.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    key="notifications"
                  >
                    {/* ========================================================
                        NOTIFICATION HERO
                       ====================================================== */}

                    <View
                      className="mb-5 rounded-[24px] p-4"
                      style={{ borderWidth: 1, borderColor: "rgba(245,158,11,.12)", borderStyle: "solid" }}
                    >
                      <View className="flex gap-3">
                        <View
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: "rgba(245,158,11,.12)" }}
                        >
                          <Bell size={15} className="text-amber-300" />
                        </View>

                        <View>
                          <Text className="text-[10px] font-black text-white/80">
                            Seulement ce qui compte
                          </Text>

                          <Text className="mt-1 text-[8px] leading-relaxed text-white/30">
                            Choisissez les signaux que DébrouillePro doit
                            surveiller pour vous.
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ========================================================
                        ALERT OPTIONS
                       ====================================================== */}

                    <View className="space-y-2">
                      <NotificationPreference
                        icon={Sparkles}
                        color="#8B5CF6"
                        title="Nouvelles recommandations"
                        description="Les nouveautés susceptibles de vous intéresser."
                        enabled={localNotifications.newRecommendations}
                        onToggle={() => {
                          setSaved(false);

                          setLocalNotifications((current) => ({
                            ...current,
                            newRecommendations: !current.newRecommendations,
                          }));
                        }}
                      />

                      <NotificationPreference
                        icon={MapPin}
                        color="#06B6D4"
                        title="À proximité"
                        description="Les nouveautés et opportunités autour de vous."
                        enabled={localNotifications.nearbyAlerts}
                        onToggle={() => {
                          setSaved(false);

                          setLocalNotifications((current) => ({
                            ...current,
                            nearbyAlerts: !current.nearbyAlerts,
                          }));
                        }}
                      />

                      <NotificationPreference
                        icon={TrendingUp}
                        color="#10B981"
                        title="Opportunités"
                        description="Jobs, immobilier, événements et occasions pertinentes."
                        enabled={localNotifications.opportunities}
                        onToggle={() => {
                          setSaved(false);

                          setLocalNotifications((current) => ({
                            ...current,
                            opportunities: !current.opportunities,
                          }));
                        }}
                      />
                    </View>

                    {/* ========================================================
                        SMART MODE
                       ====================================================== */}

                    <View
                      className="mt-5 rounded-[24px] p-4"
                      style={{ borderWidth: 1, borderColor: "rgba(139,92,246,.1)", borderStyle: "solid" }}
                    >
                      <View className="flex items-start gap-3">
                        <View
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: "rgba(99,102,241,.12)" }}
                        >
                          <Sparkles size={15} className="text-indigo-300" />
                        </View>

                        <View className="flex-1">
                          <View className="flex items-center justify-between gap-3">
                            <View>
                              <Text className="text-[10px] font-black text-white/75">
                                Home intelligente
                              </Text>

                              <Text className="mt-1 text-[8px] leading-relaxed text-white/25">
                                DébrouillePro adapte progressivement votre Home
                                à vos usages.
                              </Text>
                            </View>

                            <Text
                              className="rounded-full px-2 py-1 text-[7px] font-black uppercase tracking-wider"
                              style={{ backgroundColor: "rgba(99,102,241,.13)", color: "#A5B4FC" }}
                            >
                              IA
                            </Text>
                          </View>

                          <View className="mt-3 flex items-center gap-2">
                            <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[.05]">
                              <View
                                className="h-full rounded-full"
                                style={{  }}
                              />
                            </View>

                            <Text className="text-[7px] font-bold text-white/25">
                              76%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </AnimatePresence>
            </View>

            {/* ================================================================
                FOOTER ACTION BAR
               ================================================================ */}

            <View
              className="absolute inset-x-0 bottom-0 z-20 p-4"
              style={{  }}
            >
              <View className="flex gap-2">
                <Pressable
                 
                  onPress={reset}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] text-white/35"
                  style={{ backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
                  accessibilityLabel="Réinitialiser"
                >
                  <RotateCcw size={15} />
                </Pressable>

                <Pressable
                  type="button"
                  onPress={save}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[17px] text-[10px] font-black text-white"
                  style={{  }}
                >
                  <AnimatePresence mode="wait">
                    {saved ? (
                      <Text
                        key="saved"
                        className="flex items-center gap-2"
                      >
                        <Check size={14} />
                        <Text>Préférences enregistrées</Text></Text>
                    ) : (
                      <Text
                        key="save"
                        className="flex items-center gap-2"
                      >
                        <Save size={14} />
                        <Text>Enregistrer ma Home</Text></Text>
                    )}
                  </AnimatePresence>
                </Pressable>
              </View>
            </View>
          </View>
        </>
      )}
    </>
  );
}

/* ============================================================================
 * SMALL COMPONENTS
 * ========================================================================== */

function MiniStat({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: typeof Layers3;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <View
      className="flex items-center gap-2 rounded-[16px] p-2.5"
      style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
    >
      <Icon
        size={11}
        style={{
          color,
        }}
      />

      <View>
        <Text className="text-[10px] font-black text-white/70">{value}</Text>

        <Text className="text-[7px] text-white/20">{label}</Text>
      </View>
    </View>
  );
}

function TabButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: typeof Layers3;
  label: string;
  onClick: () => void;
}) {
  return (
    <Pressable
     
      onPress={onClick}
      className="relative flex h-9 flex-1 items-center justify-center gap-2 rounded-xl text-[9px] font-bold"
      style={{  }}
    >
      {active && (
        <View
          className="absolute inset-0 rounded-xl"
          style={{ backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: "rgba(255,255,255,.07)", borderStyle: "solid" }}
        />
      )}

      <Text className="relative z-10 flex items-center gap-2">
        <Icon size={11} />
        {label}
      </Text>
    </Pressable>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Layers3;
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="flex items-center gap-2">
      <View
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ backgroundColor: "rgba(99,102,241,.08)" }}
      >
        <Icon size={12} className="text-indigo-300" />
      </View>

      <View>
        <Text className="text-[10px] font-black text-white/75">{title}</Text>

        {subtitle && <Text className="text-[7px] text-white/20">{subtitle}</Text>}
      </View>
    </View>
  );
}

function NotificationPreference({
  icon: Icon,
  color,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: typeof Bell;
  color: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      type="button"
      onPress={onToggle}
      className="flex w-full items-center gap-3 rounded-[20px] p-3 text-left"
      style={{ backgroundColor: enabled ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.02)", borderColor: "rgba(255,255,255,.045)", borderStyle: "solid" }}
    >
      <View
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px]"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon
          size={14}
          style={{
            color,
          }}
        />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[10px] font-black text-white/70">{title}</Text>

        <Text className="mt-1 text-[7px] leading-relaxed text-white/25">
          {description}
        </Text>
      </View>

      <View
        className="relative h-6 w-10 shrink-0 rounded-full p-0.5"
        style={{ backgroundColor: enabled ? color : "rgba(255,255,255,.08)" }}
      >
        <View
          className="h-5 w-5 rounded-full bg-white shadow-md"
        />
      </View>
    </Pressable>
  );
}

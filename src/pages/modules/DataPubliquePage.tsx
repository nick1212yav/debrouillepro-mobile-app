// src/pages/modules/DataPubliquePage.tsx
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  Bell,
  Database,
  DollarSign,
  Download,
  Globe,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";

/* ════════════════════════════════════════════════════════════════════════════
   TYPES
   ════════════════════════════════════════════════════════════════════════════ */

interface DataPubliquePageProps {
  onBack: () => void;
}

type TabId = "indicateurs" | "donnees";

type Dataset = {
  id: number;
  name: string;
  source: string;
  updated: string;
  downloads: number;
  category: string;
  color: string;
};

type Indicator = {
  label: string;
  value: string;
  unit: string;
  trend: string;
  up: boolean;
  color: string;
};

/* ════════════════════════════════════════════════════════════════════════════
   DESIGN TOKENS
   ════════════════════════════════════════════════════════════════════════════ */

const T = {
  bg: "#07070C",
  card: "rgba(255,255,255,0.045)",
  cardUp: "rgba(255,255,255,0.075)",
  border: "rgba(255,255,255,0.08)",
  borderUp: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  dim: "rgba(255,255,255,0.58)",
  faint: "rgba(255,255,255,0.32)",
  ghost: "rgba(255,255,255,0.18)",
  primary: "#6366F1",
  primarySoft: "#A5B4FC",
  amber: "#F59E0B",
  amberSoft: "#FCD34D",
  success: "#10B981",
  danger: "#EF4444",
  cyan: "#22D3EE",
} as const;

const SCREEN_W = Dimensions.get("window").width;

/* ════════════════════════════════════════════════════════════════════════════
   DATA (contenu statique éditorial — source officielle)
   ════════════════════════════════════════════════════════════════════════════ */

const DATASETS: Dataset[] = [
  {
    id: 1,
    name: "Population par district",
    source: "INS CI",
    updated: "Mars 2025",
    downloads: 2340,
    category: "Démographie",
    color: "#6366F1",
  },
  {
    id: 2,
    name: "PIB et croissance économique",
    source: "Ministère Finances",
    updated: "Avr 2025",
    downloads: 5678,
    category: "Économie",
    color: "#10B981",
  },
  {
    id: 3,
    name: "Taux d'alphabétisation",
    source: "MENA",
    updated: "Jan 2025",
    downloads: 1234,
    category: "Éducation",
    color: "#F59E0B",
  },
  {
    id: 4,
    name: "Accès à l'eau potable",
    source: "ONEP",
    updated: "Fév 2025",
    downloads: 987,
    category: "Santé/Eau",
    color: "#06B6D4",
  },
  {
    id: 5,
    name: "Budget de l'État 2025",
    source: "MEF",
    updated: "Jan 2025",
    downloads: 8923,
    category: "Finance publique",
    color: "#EC4899",
  },
];

const INDICATORS: Indicator[] = [
  {
    label: "PIB 2024",
    value: "42 240",
    unit: "Mds FCFA",
    trend: "+6.2%",
    up: true,
    color: "#10B981",
  },
  {
    label: "Population",
    value: "27.5 M",
    unit: "habitants",
    trend: "+2.1%",
    up: true,
    color: "#6366F1",
  },
  {
    label: "Inflation",
    value: "3.8%",
    unit: "annuelle",
    trend: "-0.4%",
    up: false,
    color: "#F59E0B",
  },
  {
    label: "Chômage",
    value: "9.4%",
    unit: "actifs",
    trend: "+0.3%",
    up: false,
    color: "#EF4444",
  },
];

const QUICK_STATS = [
  { icon: Globe, label: "Rang Afrique", value: "#4", color: "#F59E0B" },
  { icon: Users, label: "IDH", value: "0.55", color: "#10B981" },
  {
    icon: DollarSign,
    label: "PIB / habitant",
    value: "1 540 $",
    color: "#6366F1",
  },
];

const CATEGORIES = [
  "Tout",
  "Démographie",
  "Économie",
  "Éducation",
  "Santé/Eau",
  "Finance publique",
] as const;

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function alpha(hex: string, a: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ════════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════════ */

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon size={26} color={T.faint} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ALERT BUTTON
   ════════════════════════════════════════════════════════════════════════════ */

function AlertButton({ dataset }: { dataset: Dataset }) {
  const alerts = useQuery(api.civic.listMyDataAlerts, {});
  const toggleAlert = useMutation(api.civic.toggleDataAlert);

  const isSet =
    alerts?.some((a: { datasetId: number }) => a.datasetId === dataset.id) ??
    false;

  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = async () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    try {
      const added = await toggleAlert({
        datasetId: dataset.id,
        datasetName: dataset.name,
      });
      toast.success(added ? "Alerte activée" : "Alerte désactivée");
    } catch {
      toast.error("Impossible de modifier l'alerte");
    }
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View
        style={[
          styles.alertBtn,
          {
            backgroundColor: isSet
              ? alpha(T.amber, 0.24)
              : "rgba(255,255,255,0.06)",
            borderColor: isSet ? alpha(T.amber, 0.5) : T.border,
            transform: [{ scale }],
          },
        ]}
      >
        <Bell
          size={14}
          color={isSet ? T.amberSoft : T.faint}
          fill={isSet ? T.amberSoft : "transparent"}
        />
      </Animated.View>
    </Pressable>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   INDICATOR CARD
   ════════════════════════════════════════════════════════════════════════════ */

function IndicatorCard({
  indicator,
  index,
}: {
  indicator: Indicator;
  index: number;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  const color = indicator.color;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 60, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const TrendIcon = indicator.up ? TrendingUp : TrendingDown;

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={[
          styles.indicatorCard,
          {
            borderColor: alpha(color, 0.22),
            backgroundColor: alpha(color, 0.05),
          },
        ]}
      >
        <View
          style={[
            styles.indicatorIcon,
            { backgroundColor: alpha(color, 0.16) },
          ]}
        >
          <BarChart2 size={20} color={color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.indicatorLabel}>{indicator.label}</Text>
          <Text style={styles.indicatorValue}>
            {indicator.value}
            <Text style={styles.indicatorUnit}> {indicator.unit}</Text>
          </Text>
        </View>

        <View
          style={[
            styles.trendPill,
            {
              backgroundColor: alpha(color, 0.14),
              borderColor: alpha(color, 0.32),
            },
          ]}
        >
          <TrendIcon size={12} color={color} />
          <Text style={[styles.trendText, { color }]}>{indicator.trend}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   QUICK STAT
   ════════════════════════════════════════════════════════════════════════════ */

function QuickStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.quickStatCard,
        {
          borderColor: alpha(color, 0.22),
          backgroundColor: alpha(color, 0.05),
        },
      ]}
    >
      <View
        style={[styles.quickStatIcon, { backgroundColor: alpha(color, 0.16) }]}
      >
        <Icon size={15} color={color} />
      </View>
      <Text style={styles.quickStatValue}>{value}</Text>
      <Text numberOfLines={1} style={styles.quickStatLabel}>
        {label}
      </Text>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DATASET CARD
   ════════════════════════════════════════════════════════════════════════════ */

function DatasetCard({ dataset, index }: { dataset: Dataset; index: number }) {
  const enter = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const color = dataset.color;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 340,
      delay: Math.min(index * 55, 400),
      useNativeDriver: true,
    }).start();
  }, [enter, index]);

  const handleDownload = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();
    toast.info(`Téléchargement de « ${dataset.name} »…`);
  };

  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      <View style={[styles.datasetCard, { borderColor: alpha(color, 0.2) }]}>
        <View
          style={[styles.datasetIcon, { backgroundColor: alpha(color, 0.16) }]}
        >
          <Database size={17} color={color} />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={styles.datasetName}>
            {dataset.name}
          </Text>
          <Text numberOfLines={1} style={styles.datasetSource}>
            {dataset.source} · {dataset.updated}
          </Text>

          <View style={styles.datasetMetaRow}>
            <View
              style={[
                styles.datasetCategoryPill,
                { backgroundColor: alpha(color, 0.16) },
              ]}
            >
              <Text style={[styles.datasetCategoryText, { color }]}>
                {dataset.category}
              </Text>
            </View>
            <Text style={styles.datasetDownloads}>
              {dataset.downloads.toLocaleString("fr-FR")} DL
            </Text>
          </View>
        </View>

        <View style={styles.datasetActions}>
          <Pressable onPress={handleDownload} hitSlop={8}>
            <Animated.View
              style={[
                styles.downloadBtn,
                {
                  backgroundColor: alpha(T.success, 0.16),
                  borderColor: alpha(T.success, 0.38),
                  transform: [{ scale }],
                },
              ]}
            >
              <Download size={14} color="#34D399" />
            </Animated.View>
          </Pressable>

          <Authenticated>
            <AlertButton dataset={dataset} />
          </Authenticated>
        </View>
      </View>
    </Animated.View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════════ */

export default function DataPubliquePage({ onBack }: DataPubliquePageProps) {
  const [activeTab, setActiveTab] = useState<TabId>("indicateurs");
  const [catFilter, setCatFilter] = useState<string>("Tout");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const panelOpacity = useRef(new Animated.Value(1)).current;
  const panelTranslate = useRef(new Animated.Value(0)).current;

  /* Debounce */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  /* Filtrage */
  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return DATASETS.filter((d) => {
      const matchCat = catFilter === "Tout" || d.category === catFilter;
      const matchSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [catFilter, debouncedSearch]);

  const switchTab = useCallback(
    (next: TabId) => {
      if (next === activeTab) return;
      Animated.parallel([
        Animated.timing(panelOpacity, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(panelTranslate, {
          toValue: 6,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setActiveTab(next);
        Animated.parallel([
          Animated.timing(panelOpacity, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
          Animated.timing(panelTranslate, {
            toValue: 0,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
      });
    },
    [activeTab, panelOpacity, panelTranslate],
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glow} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack}
            style={({ pressed }) => [
              styles.backBtn,
              { transform: [{ scale: pressed ? 0.92 : 1 }] },
            ]}
          >
            <ArrowLeft size={18} color="#fff" />
          </Pressable>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.title}>Data Publique</Text>
            <Text style={styles.subtitle}>
              Open Data · Statistiques · Transparence
            </Text>
          </View>

          <View style={styles.brandIcon}>
            <Database size={16} color={T.primarySoft} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.segmented}>
          {(
            [
              { id: "indicateurs" as TabId, label: "Indicateurs" },
              { id: "donnees" as TabId, label: "Données" },
            ] as const
          ).map((t) => {
            const active = activeTab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => switchTab(t.id)}
                style={[styles.segment, active && styles.segmentActive]}
              >
                <Text style={[styles.segmentText, active && { color: "#fff" }]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: panelOpacity,
            transform: [{ translateY: panelTranslate }],
          }}
        >
          {/* ── INDICATEURS ──────────────────────────────────────────── */}
          {activeTab === "indicateurs" && (
            <View style={{ gap: 14 }}>
              <View style={styles.sectionHead}>
                <View
                  style={[
                    styles.sectionIcon,
                    { backgroundColor: alpha(T.primary, 0.15) },
                  ]}
                >
                  <BarChart2 size={13} color={T.primarySoft} />
                </View>
                <Text style={styles.sectionTitle}>
                  Indicateurs macroéconomiques
                </Text>
              </View>
              <Text style={styles.sectionSubtitle}>Côte d'Ivoire · 2025</Text>

              <View style={{ gap: 12, marginTop: 4 }}>
                {INDICATORS.map((ind, i) => (
                  <IndicatorCard key={ind.label} indicator={ind} index={i} />
                ))}
              </View>

              {/* Quick stats */}
              <View style={styles.quickStatsRow}>
                {QUICK_STATS.map((s) => (
                  <QuickStat
                    key={s.label}
                    icon={s.icon}
                    label={s.label}
                    value={s.value}
                    color={s.color}
                  />
                ))}
              </View>
            </View>
          )}

          {/* ── DONNÉES ──────────────────────────────────────────────── */}
          {activeTab === "donnees" && (
            <View style={{ gap: 14 }}>
              {/* Search */}
              <View style={styles.searchWrap}>
                <Search size={15} color={T.faint} />
                <TextInput
                  value={searchInput}
                  onChangeText={setSearchInput}
                  placeholder="Rechercher un jeu de données…"
                  placeholderTextColor={T.faint}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {searchInput.length > 0 && (
                  <Pressable onPress={() => setSearchInput("")} hitSlop={10}>
                    <X size={15} color={T.faint} />
                  </Pressable>
                )}
              </View>

              {/* Catégories */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingRight: 20 }}
                style={{ marginHorizontal: -20, paddingHorizontal: 20 }}
              >
                {CATEGORIES.map((cat) => {
                  const active = catFilter === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCatFilter(cat)}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        {
                          backgroundColor: active
                            ? alpha(T.primary, 0.2)
                            : "rgba(255,255,255,0.05)",
                          borderColor: active
                            ? alpha(T.primary, 0.5)
                            : T.border,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: active ? T.primarySoft : T.dim,
                          fontSize: 12,
                          fontWeight: active ? "900" : "700",
                        }}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Résultats */}
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Database}
                  title="Aucun jeu de données"
                  message={
                    debouncedSearch
                      ? "Essaie un autre mot-clé ou change de catégorie."
                      : "Aucune donnée dans cette catégorie pour le moment."
                  }
                />
              ) : (
                <View style={{ gap: 10 }}>
                  {filtered.map((d, i) => (
                    <DatasetCard key={d.id} dataset={d} index={i} />
                  ))}
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },

  glow: {
    position: "absolute",
    top: -150,
    left: -80,
    right: -80,
    height: 320,
    borderRadius: 220,
    backgroundColor: alpha(T.primary, 0.12),
  },

  /* Header */
  header: { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: T.border,
  },
  title: {
    color: T.text,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  subtitle: { color: T.faint, fontSize: 11.5, marginTop: 2, fontWeight: "600" },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: alpha(T.primary, 0.16),
    borderWidth: 1,
    borderColor: alpha(T.primary, 0.36),
  },

  /* Segmented */
  segmented: {
    flexDirection: "row",
    gap: 3,
    marginTop: 18,
    padding: 3,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: T.border,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
  },
  segmentActive: { backgroundColor: T.primary },
  segmentText: { color: T.faint, fontSize: 12.5, fontWeight: "800" },

  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 60 },

  /* Section */
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: T.text,
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: -0.2,
    flex: 1,
  },
  sectionSubtitle: {
    color: T.faint,
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: -6,
  },

  /* Indicator card */
  indicatorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  indicatorIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  indicatorLabel: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  indicatorValue: {
    color: T.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  indicatorUnit: {
    color: T.dim,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  trendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  trendText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  /* Quick stats */
  quickStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  quickStatValue: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  quickStatLabel: {
    color: T.faint,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    textAlign: "center",
  },

  /* Search */
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 15,
    height: 48,
    borderRadius: 16,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  searchInput: {
    flex: 1,
    color: T.text,
    fontSize: 13.5,
    paddingVertical: 0,
  },

  /* Category chips */
  categoryChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 13,
    borderWidth: 1,
  },

  /* Dataset card */
  datasetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.border,
  },
  datasetIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  datasetName: {
    color: T.text,
    fontSize: 13.5,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  datasetSource: {
    color: T.faint,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 3,
  },
  datasetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 7,
  },
  datasetCategoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  datasetCategoryText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  datasetDownloads: {
    color: T.faint,
    fontSize: 10.5,
    fontWeight: "700",
  },
  datasetActions: {
    gap: 8,
    alignItems: "center",
  },
  downloadBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  alertBtn: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  /* Empty */
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 14,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: T.border,
  },
  emptyTitle: {
    color: T.text,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  emptyMessage: {
    color: T.faint,
    fontSize: 12.5,
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 18,
  },
});

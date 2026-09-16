import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useQuery } from "convex/react";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Crown,
  Database,
  Info,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  WalletCards,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { SignInButton } from "@/components/ui/signin.tsx";

type Period = "7j" | "30j" | "90j" | "12m";

type RevenueEntry = {
  _id: string;
  _creationTime: number;
  userId: string;
  streamId?: string;
  amount: number;
  currency: string;
  description: string;
  date: string;
  category: string;
};

type RevenueStream = {
  _id: string;
  _creationTime: number;
  userId: string;
  source: string;
  description: string;
  amount: number;
  currency: string;
  frequency: "unique" | "hebdomadaire" | "mensuel" | "annuel";
  lastReceivedAt?: string;
  active: boolean;
};

type Props = {
  onBack: () => void;
  onNavigate?: (page: string) => void;
};

type CurrencyTotal = {
  currency: string;
  total: number;
  count: number;
};

type CategoryTotal = {
  key: string;
  label: string;
  total: number;
  count: number;
};

type Bucket = {
  key: string;
  label: string;
  total: number;
};

const PERIOD_LABELS: Record<Period, string> = {
  "7j": "7 jours",
  "30j": "30 jours",
  "90j": "90 jours",
  "12m": "12 mois",
};

const SOURCE_LABELS: Record<string, string> = {
  premium: "Premium",
  abonnement: "Abonnements",
  contenu: "Contenu",
  tips: "Tips",
  marketplace: "Marketplace",
  vente: "Ventes",
  freelance: "Freelance",
  location: "Location",
  salaire: "Salaire",
  autre: "Autre",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number, currency: string): string {
  return `${formatNumber(value)} ${currency}`;
}

function safeDate(value: string): Date | null {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

function subtractMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() - months);
  return result;
}

function getPeriodStart(period: Period, now: Date): Date {
  switch (period) {
    case "7j":
      return startOfDay(subtractDays(now, 6));

    case "30j":
      return startOfDay(subtractDays(now, 29));

    case "90j":
      return startOfDay(subtractDays(now, 89));

    case "12m":
      return startOfDay(subtractMonths(now, 11));
  }
}

function isWithinPeriod(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

function getCategoryLabel(category: string): string {
  const normalized = normalize(category);

  return (SOURCE_LABELS[normalized] ?? category.trim()) || "Non catégorisé";
}

function getCategoryKey(category: string): string {
  const normalized = normalize(category);

  if (normalized === "premium" || normalized === "abonnement") {
    return "premium";
  }

  if (normalized === "contenu" || normalized === "tips") {
    return "contenu";
  }

  if (
    normalized === "marketplace" ||
    normalized === "vente" ||
    normalized === "ventes"
  ) {
    return "marketplace";
  }

  return normalized || "autre";
}

function getBucket(date: Date, period: Period): { key: string; label: string } {
  if (period === "12m") {
    const year = date.getFullYear();
    const month = date.getMonth();

    return {
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: date.toLocaleDateString("fr-FR", {
        month: "short",
      }),
    };
  }

  if (period === "90j") {
    const start = new Date(date);
    const day = start.getDate();
    const bucketDay = day - ((day - 1) % 7);

    start.setDate(bucketDay);

    return {
      key: `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`,
      label: start.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
      }),
    };
  }

  return {
    key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
    label: date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    }),
  };
}

function LoadingScreen(): React.ReactElement {
  return (
    <View style={styles.centerScreen}>
      <View style={styles.loadingOrb}>
        <ActivityIndicator size="small" color="#60a5fa" />
      </View>

      <Text style={styles.loadingTitle}>Chargement de vos revenus</Text>

      <Text style={styles.loadingText}>
        Récupération des données depuis DébrouillePro.
      </Text>
    </View>
  );
}

function ErrorState(): React.ReactElement {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIconDanger}>
        <AlertCircle size={22} color="#f87171" />
      </View>

      <Text style={styles.stateTitle}>Données indisponibles</Text>

      <Text style={styles.stateText}>
        Le tableau de bord ne peut pas afficher les données financières pour le
        moment.
      </Text>

      <Text style={styles.stateHint}>
        Aucune donnée n'est inventée pour remplacer la source financière.
      </Text>
    </View>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View style={styles.stateCard}>
      <View style={styles.stateIcon}>
        <WalletCards size={22} color="#60a5fa" />
      </View>

      <Text style={styles.stateTitle}>Aucun revenu enregistré</Text>

      <Text style={styles.stateText}>
        Votre tableau de bord apparaîtra automatiquement dès qu'un revenu réel
        sera enregistré.
      </Text>

      <Text style={styles.stateHint}>
        Les chiffres de démonstration ne sont pas utilisés.
      </Text>
    </View>
  );
}

function SourceIcon({
  source,
  color,
}: {
  source: string;
  color: string;
}): React.ReactElement {
  const normalized = normalize(source);

  if (normalized === "premium" || normalized === "abonnement") {
    return <Crown size={17} color={color} />;
  }

  if (
    normalized === "marketplace" ||
    normalized === "vente" ||
    normalized === "ventes"
  ) {
    return <ShoppingBag size={17} color={color} />;
  }

  if (normalized === "contenu" || normalized === "tips") {
    return <Sparkles size={17} color={color} />;
  }

  return <CircleDollarSign size={17} color={color} />;
}

function RevenueBar({
  value,
  max,
}: {
  value: number;
  max: number;
}): React.ReactElement {
  const percentage =
    max > 0 ? Math.max(3, Math.min(100, (value / max) * 100)) : 3;

  return (
    <View style={styles.barTrack}>
      <View
        style={[
          styles.barFill,
          {
            width: `${percentage}%`,
          },
        ]}
      />
    </View>
  );
}

function AuthenticatedDashboard({
  onBack,
  onNavigate,
}: Props): React.ReactElement {
  const [period, setPeriod] = useState<Period>("30j");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [showStreams, setShowStreams] = useState(false);

  const entriesResult = useQuery(api.revenues.getMyEntries, {});

  const streamsResult = useQuery(api.revenues.getMyStreams, {});

  const entries = entriesResult as RevenueEntry[] | undefined;

  const streams = streamsResult as RevenueStream[] | undefined;

  const isLoading = entriesResult === undefined || streamsResult === undefined;

  const now = useMemo(() => new Date(), []);

  const currencies = useMemo(() => {
    if (!entries) {
      return [];
    }

    const values = new Set<string>();

    for (const entry of entries) {
      const currency = entry.currency.trim();

      if (currency) {
        values.add(currency);
      }
    }

    return Array.from(values).sort();
  }, [entries]);

  const effectiveCurrency =
    selectedCurrency && currencies.includes(selectedCurrency)
      ? selectedCurrency
      : (currencies[0] ?? null);

  const periodStart = useMemo(() => getPeriodStart(period, now), [period, now]);

  const periodEnd = useMemo(() => now, [now]);

  const validEntries = useMemo(() => {
    if (!entries) {
      return [];
    }

    return entries
      .map((entry) => {
        const date = safeDate(entry.date);

        if (!date) {
          return null;
        }

        return {
          entry,
          date,
        };
      })
      .filter(
        (
          item,
        ): item is {
          entry: RevenueEntry;
          date: Date;
        } => item !== null,
      );
  }, [entries]);

  const filteredEntries = useMemo(() => {
    return validEntries.filter(({ entry, date }) => {
      if (!isWithinPeriod(date, periodStart, periodEnd)) {
        return false;
      }

      if (effectiveCurrency && entry.currency !== effectiveCurrency) {
        return false;
      }

      return true;
    });
  }, [effectiveCurrency, periodEnd, periodStart, validEntries]);

  const allCurrencyTotals = useMemo(() => {
    if (!entries) {
      return [];
    }

    const map = new Map<string, CurrencyTotal>();

    for (const entry of entries) {
      const currency = entry.currency.trim();

      if (!currency) {
        continue;
      }

      const current = map.get(currency);

      if (current) {
        current.total += entry.amount;
        current.count += 1;
      } else {
        map.set(currency, {
          currency,
          total: entry.amount,
          count: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [entries]);

  const periodTotal = useMemo(() => {
    return filteredEntries.reduce((sum, item) => sum + item.entry.amount, 0);
  }, [filteredEntries]);

  const transactionCount = filteredEntries.length;

  const categoryTotals = useMemo<CategoryTotal[]>(() => {
    const map = new Map<string, CategoryTotal>();

    for (const { entry } of filteredEntries) {
      const key = getCategoryKey(entry.category);
      const label = getCategoryLabel(entry.category);

      const current = map.get(key);

      if (current) {
        current.total += entry.amount;
        current.count += 1;
      } else {
        map.set(key, {
          key,
          label,
          total: entry.amount,
          count: 1,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [filteredEntries]);

  const buckets = useMemo<Bucket[]>(() => {
    const map = new Map<string, Bucket>();

    for (const { entry, date } of filteredEntries) {
      const bucket = getBucket(date, period);
      const current = map.get(bucket.key);

      if (current) {
        current.total += entry.amount;
      } else {
        map.set(bucket.key, {
          key: bucket.key,
          label: bucket.label,
          total: entry.amount,
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredEntries, period]);

  const chartMax = useMemo(() => {
    return Math.max(0, ...buckets.map((bucket) => bucket.total));
  }, [buckets]);

  const previousPeriodTotal = useMemo(() => {
    if (!entries || !effectiveCurrency) {
      return null;
    }

    const duration = periodEnd.getTime() - periodStart.getTime();

    const previousEnd = new Date(periodStart.getTime() - 1);

    const previousStart = new Date(previousEnd.getTime() - duration);

    let total = 0;

    for (const { entry, date } of validEntries) {
      if (entry.currency !== effectiveCurrency) {
        continue;
      }

      if (date >= previousStart && date <= previousEnd) {
        total += entry.amount;
      }
    }

    return total;
  }, [effectiveCurrency, entries, periodEnd, periodStart, validEntries]);

  const periodChange = useMemo(() => {
    if (previousPeriodTotal === null || previousPeriodTotal === 0) {
      return null;
    }

    return ((periodTotal - previousPeriodTotal) / previousPeriodTotal) * 100;
  }, [periodTotal, previousPeriodTotal]);

  const activeStreams = useMemo(() => {
    if (!streams) {
      return [];
    }

    return streams.filter((stream) => stream.active);
  }, [streams]);

  const activeStreamAmount = useMemo(() => {
    if (!effectiveCurrency) {
      return null;
    }

    return activeStreams
      .filter((stream) => stream.currency === effectiveCurrency)
      .reduce((sum, stream) => sum + stream.amount, 0);
  }, [activeStreams, effectiveCurrency]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!entries || !streams) {
    return <ErrorState />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={20} color="#ffffff" />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>FINANCES PERSONNELLES</Text>

            <Text style={styles.title}>Revenus</Text>

            <Text style={styles.subtitle}>
              Données issues de vos enregistrements réels
            </Text>
          </View>

          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.trustCard}>
          <View style={styles.trustIcon}>
            <Database size={17} color="#60a5fa" />
          </View>

          <View style={styles.trustContent}>
            <Text style={styles.trustTitle}>Source de vérité</Text>

            <Text style={styles.trustText}>
              Ce tableau affiche uniquement les revenus enregistrés dans votre
              compte. Aucun chiffre de démonstration n'est ajouté.
            </Text>
          </View>
        </View>

        {currencies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DEVISE</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              {currencies.map((currency) => {
                const selected = currency === effectiveCurrency;

                return (
                  <Pressable
                    key={currency}
                    onPress={() => setSelectedCurrency(currency)}
                    style={[styles.chip, selected && styles.chipActive]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {currency}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PÉRIODE</Text>

          <View style={styles.periodRow}>
            {(["7j", "30j", "90j", "12m"] as Period[]).map((value) => {
              const selected = period === value;

              return (
                <Pressable
                  key={value}
                  onPress={() => setPeriod(value)}
                  style={[
                    styles.periodButton,
                    selected && styles.periodButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      selected && styles.periodTextActive,
                    ]}
                  >
                    {value}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>REVENUS ENREGISTRÉS</Text>

              <Text style={styles.heroAmount}>
                {effectiveCurrency
                  ? formatMoney(periodTotal, effectiveCurrency)
                  : "—"}
              </Text>

              <Text style={styles.heroPeriod}>{PERIOD_LABELS[period]}</Text>
            </View>

            <View style={styles.heroIcon}>
              <BarChart3 size={24} color="#6ee7b7" />
            </View>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{transactionCount}</Text>

              <Text style={styles.heroStatLabel}>opérations</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{categoryTotals.length}</Text>

              <Text style={styles.heroStatLabel}>catégories</Text>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStat}>
              {periodChange === null ? (
                <>
                  <Text style={styles.heroStatValue}>—</Text>

                  <Text style={styles.heroStatLabel}>comparaison</Text>
                </>
              ) : (
                <>
                  <View style={styles.changeRow}>
                    {periodChange >= 0 ? (
                      <ArrowUpRight size={15} color="#6ee7b7" />
                    ) : (
                      <ArrowDownLeft size={15} color="#fca5a5" />
                    )}

                    <Text
                      style={[
                        styles.heroStatValue,
                        periodChange >= 0 ? styles.positive : styles.negative,
                      ]}
                    >
                      {periodChange >= 0 ? "+" : ""}
                      {periodChange.toFixed(1)}%
                    </Text>
                  </View>

                  <Text style={styles.heroStatLabel}>
                    vs période précédente
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {entries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Évolution réelle</Text>

                  <Text style={styles.sectionSubtitle}>
                    Agrégation des opérations enregistrées
                  </Text>
                </View>

                <RefreshCw size={17} color="#64748b" />
              </View>

              <View style={styles.chartCard}>
                {buckets.length === 0 ? (
                  <View style={styles.emptyChart}>
                    <Info size={20} color="#64748b" />

                    <Text style={styles.emptyChartText}>
                      Aucune opération dans cette période.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartScroll}
                  >
                    {buckets.map((bucket) => (
                      <View key={bucket.key} style={styles.chartColumn}>
                        <Text style={styles.chartValue} numberOfLines={1}>
                          {formatNumber(bucket.total)}
                        </Text>

                        <View style={styles.chartArea}>
                          <RevenueBar value={bucket.total} max={chartMax} />
                        </View>

                        <Text style={styles.chartLabel} numberOfLines={1}>
                          {bucket.label}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Répartition</Text>

                  <Text style={styles.sectionSubtitle}>
                    Par catégorie réelle
                  </Text>
                </View>
              </View>

              <View style={styles.listCard}>
                {categoryTotals.map((category, index) => {
                  const percentage =
                    periodTotal > 0 ? (category.total / periodTotal) * 100 : 0;

                  return (
                    <View
                      key={category.key}
                      style={[
                        styles.categoryRow,
                        index < categoryTotals.length - 1 && styles.rowBorder,
                      ]}
                    >
                      <View style={styles.categoryIcon}>
                        <SourceIcon source={category.key} color="#93c5fd" />
                      </View>

                      <View style={styles.categoryContent}>
                        <View style={styles.categoryTop}>
                          <Text style={styles.categoryName} numberOfLines={1}>
                            {category.label}
                          </Text>

                          <Text style={styles.categoryAmount}>
                            {effectiveCurrency
                              ? formatMoney(category.total, effectiveCurrency)
                              : formatNumber(category.total)}
                          </Text>
                        </View>

                        <RevenueBar value={category.total} max={periodTotal} />

                        <View style={styles.categoryBottom}>
                          <Text style={styles.mutedText}>
                            {category.count} opération
                            {category.count > 1 ? "s" : ""}
                          </Text>

                          <Text style={styles.percentageText}>
                            {percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <View style={styles.section}>
          <Pressable
            onPress={() => setShowStreams((value) => !value)}
            style={styles.collapsibleHeader}
          >
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.smallIconBox}>
                <CalendarDays size={17} color="#a78bfa" />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Revenus récurrents</Text>

                <Text style={styles.sectionSubtitle}>
                  Sources configurées dans votre compte
                </Text>
              </View>
            </View>

            {showStreams ? (
              <ChevronUp size={19} color="#64748b" />
            ) : (
              <ChevronDown size={19} color="#64748b" />
            )}
          </Pressable>

          {showStreams && (
            <View style={styles.streamCard}>
              {activeStreams.length === 0 ? (
                <Text style={styles.emptyStreamText}>
                  Aucune source récurrente active.
                </Text>
              ) : (
                activeStreams.map((stream, index) => (
                  <View
                    key={stream._id}
                    style={[
                      styles.streamRow,
                      index < activeStreams.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <View style={styles.streamIcon}>
                      <CircleDollarSign size={18} color="#a78bfa" />
                    </View>

                    <View style={styles.streamContent}>
                      <Text style={styles.streamName} numberOfLines={1}>
                        {stream.source}
                      </Text>

                      <Text style={styles.streamDescription} numberOfLines={2}>
                        {stream.description}
                      </Text>

                      <Text style={styles.streamFrequency}>
                        {stream.frequency}
                      </Text>
                    </View>

                    <Text style={styles.streamAmount}>
                      {formatMoney(stream.amount, stream.currency)}
                    </Text>
                  </View>
                ))
              )}

              {effectiveCurrency && activeStreamAmount !== null && (
                <View style={styles.streamSummary}>
                  <Text style={styles.streamSummaryLabel}>
                    Total récurrent actif
                  </Text>

                  <Text style={styles.streamSummaryAmount}>
                    {formatMoney(activeStreamAmount, effectiveCurrency)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {allCurrencyTotals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Vue par devise</Text>

                <Text style={styles.sectionSubtitle}>
                  Les devises restent séparées pour éviter toute conversion
                  implicite.
                </Text>
              </View>
            </View>

            <View style={styles.currencyGrid}>
              {allCurrencyTotals.map((currency) => (
                <Pressable
                  key={currency.currency}
                  onPress={() => setSelectedCurrency(currency.currency)}
                  style={[
                    styles.currencyCard,
                    effectiveCurrency === currency.currency &&
                      styles.currencyCardActive,
                  ]}
                >
                  <Text style={styles.currencyCode}>{currency.currency}</Text>

                  <Text style={styles.currencyAmount}>
                    {formatNumber(currency.total)}
                  </Text>

                  <Text style={styles.currencyCount}>
                    {currency.count} opération
                    {currency.count > 1 ? "s" : ""}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <View style={styles.integrityCard}>
          <View style={styles.integrityIcon}>
            <Database size={18} color="#34d399" />
          </View>

          <View style={styles.integrityContent}>
            <Text style={styles.integrityTitle}>Intégrité des données</Text>

            <Text style={styles.integrityText}>
              Les montants affichés proviennent des enregistrements de revenus
              de votre compte. Les données absentes restent absentes : aucune
              valeur fictive n'est utilisée.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => onNavigate?.("revenus")}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
        >
          <WalletCards size={17} color="#cbd5e1" />

          <Text style={styles.secondaryButtonText}>Gérer mes revenus</Text>
        </Pressable>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

export default function RevenusDashboardPage(props: Props): React.ReactElement {
  return (
    <>
      <AuthLoading>
        <LoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.screen}>
          <View style={styles.unauthenticated}>
            <Pressable
              onPress={props.onBack}
              style={({ pressed }) => [
                styles.iconButton,
                styles.absoluteBack,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft size={20} color="#ffffff" />
            </Pressable>

            <View style={styles.authIcon}>
              <WalletCards size={34} color="#60a5fa" />
            </View>

            <Text style={styles.authTitle}>Tableau de bord Revenus</Text>

            <Text style={styles.authText}>
              Connectez-vous pour accéder à vos données financières réelles.
            </Text>

            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <Authenticated>
        <AuthenticatedDashboard {...props} />
      </Authenticated>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  headerText: {
    flex: 1,
    marginLeft: 12,
  },

  eyebrow: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 3,
  },

  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: 11,
    marginTop: 3,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(52,211,153,0.08)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.15)",
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34d399",
    marginRight: 5,
  },

  liveText: {
    color: "#6ee7b7",
    fontSize: 9,
    fontWeight: "800",
  },

  trustCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(96,165,250,0.07)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.14)",
    marginBottom: 18,
  },

  trustIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.10)",
  },

  trustContent: {
    flex: 1,
    marginLeft: 10,
  },

  trustTitle: {
    color: "#dbeafe",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },

  trustText: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 17,
  },

  section: {
    marginBottom: 18,
  },

  sectionLabel: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  sectionTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 3,
    lineHeight: 15,
  },

  chips: {
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  chipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#3b82f6",
  },

  chipText: {
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: "700",
  },

  chipTextActive: {
    color: "#ffffff",
  },

  periodRow: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  periodButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },

  periodButtonActive: {
    backgroundColor: "#ffffff",
  },

  periodText: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
  },

  periodTextActive: {
    color: "#0f172a",
  },

  heroCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(16,185,129,0.10)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.18)",
    marginBottom: 20,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  heroLabel: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  heroAmount: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "900",
    marginTop: 7,
  },

  heroPeriod: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 3,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.10)",
  },

  heroDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 17,
  },

  heroStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroStat: {
    flex: 1,
  },

  heroStatValue: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
  },

  heroStatLabel: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 9,
  },

  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  positive: {
    color: "#6ee7b7",
  },

  negative: {
    color: "#fca5a5",
  },

  chartCard: {
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    paddingVertical: 16,
  },

  chartScroll: {
    paddingHorizontal: 14,
    gap: 10,
  },

  chartColumn: {
    width: 54,
    alignItems: "center",
  },

  chartValue: {
    color: "#64748b",
    fontSize: 8,
    width: 54,
    textAlign: "center",
    marginBottom: 7,
  },

  chartArea: {
    height: 130,
    width: "100%",
    justifyContent: "flex-end",
  },

  chartLabel: {
    color: "#64748b",
    fontSize: 8,
    width: 54,
    textAlign: "center",
    marginTop: 7,
  },

  barTrack: {
    height: 7,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  barFill: {
    height: "100%",
    borderRadius: 5,
    backgroundColor: "#3b82f6",
  },

  emptyChart: {
    minHeight: 130,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  emptyChartText: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 8,
  },

  listCard: {
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  categoryRow: {
    flexDirection: "row",
    padding: 14,
  },

  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  categoryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
    marginRight: 10,
  },

  categoryContent: {
    flex: 1,
  },

  categoryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  categoryName: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    marginRight: 8,
  },

  categoryAmount: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },

  categoryBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },

  mutedText: {
    color: "#64748b",
    fontSize: 9,
  },

  percentageText: {
    color: "#93c5fd",
    fontSize: 9,
    fontWeight: "700",
  },

  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  smallIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
    marginRight: 10,
  },

  streamCard: {
    marginTop: 8,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  streamRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
  },

  streamIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
    marginRight: 10,
  },

  streamContent: {
    flex: 1,
    marginRight: 8,
  },

  streamName: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "800",
  },

  streamDescription: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 2,
  },

  streamFrequency: {
    color: "#a78bfa",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 4,
  },

  streamAmount: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },

  streamSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 13,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(167,139,250,0.04)",
  },

  streamSummaryLabel: {
    color: "#94a3b8",
    fontSize: 10,
  },

  streamSummaryAmount: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyStreamText: {
    color: "#64748b",
    fontSize: 11,
    padding: 16,
    textAlign: "center",
  },

  currencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  currencyCard: {
    width: "48%",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  currencyCardActive: {
    backgroundColor: "rgba(37,99,235,0.10)",
    borderColor: "rgba(59,130,246,0.30)",
  },

  currencyCode: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1,
  },

  currencyAmount: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
    marginTop: 6,
  },

  currencyCount: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  integrityCard: {
    flexDirection: "row",
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(52,211,153,0.05)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.12)",
    marginBottom: 12,
  },

  integrityIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  integrityContent: {
    flex: 1,
    marginLeft: 10,
  },

  integrityTitle: {
    color: "#a7f3d0",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 3,
  },

  integrityText: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 15,
  },

  secondaryButton: {
    minHeight: 48,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  secondaryButtonText: {
    color: "#cbd5e1",
    fontSize: 12,
    fontWeight: "700",
  },

  stateCard: {
    marginTop: 20,
    padding: 22,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  stateIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
  },

  stateIconDanger: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
  },

  stateTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 12,
  },

  stateText: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  stateHint: {
    color: "#475569",
    fontSize: 10,
    textAlign: "center",
    marginTop: 9,
  },

  centerScreen: {
    flex: 1,
    backgroundColor: "#050812",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  loadingOrb: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.14)",
  },

  loadingTitle: {
    color: "#e2e8f0",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 14,
  },

  loadingText: {
    color: "#64748b",
    fontSize: 10,
    textAlign: "center",
    marginTop: 5,
  },

  unauthenticated: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  absoluteBack: {
    position: "absolute",
    top: 18,
    left: 16,
  },

  authIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.14)",
  },

  authTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 18,
    textAlign: "center",
  },

  authText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },

  bottomSpace: {
    height: 20,
  },
});

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Clock3,
  Database,
  Info,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  WalletCards,
  X,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

type Props = {
  onBack: () => void;
};

type Tab = "dashboard" | "sources" | "transactions";

type Frequency = "unique" | "hebdomadaire" | "mensuel" | "annuel";

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
  frequency: Frequency;
  lastReceivedAt?: string;
  active: boolean;
};

type CreatorStats = {
  streams: RevenueStream[];
  entries: RevenueEntry[];
  totalBalance: number;
};

type TransactionFilter = "all" | "income" | "withdrawal";

type Status = "idle" | "loading" | "success" | "error";

const FREQUENCIES: Array<{
  value: Frequency;
  label: string;
}> = [
  { value: "unique", label: "Unique" },
  { value: "hebdomadaire", label: "Hebdomadaire" },
  { value: "mensuel", label: "Mensuel" },
  { value: "annuel", label: "Annuel" },
];

const CURRENCIES = ["CDF", "USD", "XAF", "KES", "TZS", "ZMW", "ZAR"];

const SOURCE_TYPES = [
  "freelance",
  "ventes",
  "location",
  "salaire",
  "tips",
  "dons",
  "abonnements",
  "autre",
] as const;

function formatNumber(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMoney(value: number, currency: string): string {
  return `${formatNumber(Math.abs(value))} ${currency}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getCategoryLabel(value: string): string {
  const labels: Record<string, string> = {
    tip: "Pourboire",
    tips: "Pourboire",
    don: "Don",
    dons: "Don",
    abonnement: "Abonnement",
    abonnements: "Abonnement",
    vente: "Vente",
    ventes: "Ventes",
    freelance: "Freelance",
    location: "Location",
    salaire: "Salaire",
    retrait: "Retrait",
    bonus: "Bonus",
    autre: "Autre",
  };

  return labels[normalize(value)] || value.trim() || "Non catégorisé";
}

function getEntryIcon(entry: RevenueEntry): React.ReactElement {
  const positive = entry.amount >= 0;

  if (!positive) {
    return <ArrowUpRight size={18} color="#f87171" />;
  }

  return <ArrowDownLeft size={18} color="#6ee7b7" />;
}

function getEntryIconBackground(entry: RevenueEntry): string {
  return entry.amount >= 0 ? "rgba(52,211,153,0.10)" : "rgba(248,113,113,0.10)";
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function parseAmount(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function LoadingView(): React.ReactElement {
  return (
    <View style={styles.center}>
      <View style={styles.loadingIcon}>
        <ActivityIndicator size="small" color="#60a5fa" />
      </View>

      <Text style={styles.loadingTitle}>Chargement des revenus</Text>

      <Text style={styles.loadingText}>
        Synchronisation avec votre compte DébrouillePro…
      </Text>
    </View>
  );
}

function ErrorView(): React.ReactElement {
  return (
    <View style={styles.center}>
      <View style={styles.errorIcon}>
        <AlertCircle size={25} color="#f87171" />
      </View>

      <Text style={styles.stateTitle}>Données indisponibles</Text>

      <Text style={styles.stateText}>
        Le serveur n’a pas pu fournir les données de revenus. Aucun chiffre de
        remplacement n’est affiché.
      </Text>
    </View>
  );
}

function EmptyView({ onAdd }: { onAdd: () => void }): React.ReactElement {
  return (
    <View style={styles.emptyCard}>
      <View style={styles.emptyIcon}>
        <WalletCards size={27} color="#60a5fa" />
      </View>

      <Text style={styles.emptyTitle}>
        Votre activité financière commencera ici
      </Text>

      <Text style={styles.emptyText}>
        Aucun revenu n’est encore enregistré sur votre compte. Lorsque vous
        enregistrerez une opération réelle, elle apparaîtra automatiquement ici.
      </Text>

      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.pressed,
        ]}
      >
        <Plus size={17} color="#ffffff" />

        <Text style={styles.primaryButtonText}>Enregistrer un revenu</Text>
      </Pressable>
    </View>
  );
}

function AddRevenueModal({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}): React.ReactElement {
  const addEntry = useMutation(api.revenues.addEntry);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("CDF");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("autre");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setAmount("");
    setCurrency("CDF");
    setDescription("");
    setCategory("autre");
    setStatus("idle");
    setError(null);
  }

  function close(): void {
    if (status === "loading") {
      return;
    }

    reset();
    onClose();
  }

  async function submit(): Promise<void> {
    const numericAmount = parseAmount(amount);

    if (numericAmount === null) {
      setError("Veuillez saisir un montant valide.");
      return;
    }

    if (!description.trim()) {
      setError("Veuillez décrire cette entrée.");
      return;
    }

    setError(null);
    setStatus("loading");

    try {
      await addEntry({
        amount: numericAmount,
        currency,
        description: description.trim(),
        date: getToday(),
        category,
      });

      setStatus("success");

      setTimeout(() => {
        reset();
        onSuccess();
      }, 350);
    } catch {
      setStatus("error");
      setError(
        "L’enregistrement a échoué. Aucune opération locale n’a été considérée comme réussie.",
      );
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Enregistrer un revenu</Text>

              <Text style={styles.modalSubtitle}>
                L’opération sera enregistrée dans votre compte.
              </Text>
            </View>

            <Pressable onPress={close} style={styles.modalClose}>
              <X size={18} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalContent}
          >
            <Text style={styles.fieldLabel}>Montant</Text>

            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#475569"
              keyboardType="decimal-pad"
              editable={status !== "loading"}
              style={styles.input}
            />

            <Text style={styles.fieldLabel}>Devise</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {CURRENCIES.map((value) => {
                const active = currency === value;

                return (
                  <Pressable
                    key={value}
                    onPress={() => setCurrency(value)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Catégorie</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.optionRow}
            >
              {SOURCE_TYPES.map((value) => {
                const active = category === value;

                return (
                  <Pressable
                    key={value}
                    onPress={() => setCategory(value)}
                    style={[styles.option, active && styles.optionActive]}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        active && styles.optionTextActive,
                      ]}
                    >
                      {getCategoryLabel(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.fieldLabel}>Description</Text>

            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex. prestation client"
              placeholderTextColor="#475569"
              editable={status !== "loading"}
              style={[styles.input, styles.multilineInput]}
              multiline
              maxLength={240}
            />

            {error && (
              <View style={styles.formError}>
                <AlertCircle size={16} color="#f87171" />

                <Text style={styles.formErrorText}>{error}</Text>
              </View>
            )}

            <View style={styles.integrityNotice}>
              <Database size={17} color="#60a5fa" />

              <Text style={styles.integrityNoticeText}>
                Aucun montant fictif n’est créé. L’interface reflète uniquement
                la réponse confirmée par Convex.
              </Text>
            </View>

            <Pressable
              onPress={() => {
                void submit();
              }}
              disabled={status === "loading"}
              style={({ pressed }) => [
                styles.primaryButton,
                styles.submitButton,
                pressed && status !== "loading" && styles.pressed,
                status === "loading" && styles.disabledButton,
              ]}
            >
              {status === "loading" ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : status === "success" ? (
                <CheckCircle2 size={18} color="#ffffff" />
              ) : (
                <Plus size={18} color="#ffffff" />
              )}

              <Text style={styles.primaryButtonText}>
                {status === "loading"
                  ? "Enregistrement…"
                  : status === "success"
                    ? "Enregistré"
                    : "Enregistrer"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SourceCard({
  stream,
  onDelete,
}: {
  stream: RevenueStream;
  onDelete: () => void;
}): React.ReactElement {
  return (
    <View style={styles.sourceCard}>
      <View style={styles.sourceTop}>
        <View style={styles.sourceIcon}>
          <Sparkles size={18} color="#a78bfa" />
        </View>

        <View style={styles.sourceMain}>
          <Text style={styles.sourceTitle} numberOfLines={1}>
            {stream.description}
          </Text>

          <Text style={styles.sourceType} numberOfLines={1}>
            {getCategoryLabel(stream.source)}
            {" · "}
            {stream.frequency}
          </Text>
        </View>

        <View style={styles.sourceAmountBox}>
          <Text style={styles.sourceAmount}>
            {formatMoney(stream.amount, stream.currency)}
          </Text>

          <Text style={styles.sourceFrequency}>
            {stream.frequency === "mensuel" ? "/ mois" : ""}
          </Text>
        </View>
      </View>

      <View style={styles.sourceBottom}>
        <View style={styles.activeStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: stream.active ? "#34d399" : "#64748b",
              },
            ]}
          />

          <Text
            style={[
              styles.activeStatusText,
              {
                color: stream.active ? "#6ee7b7" : "#64748b",
              },
            ]}
          >
            {stream.active ? "Active" : "Inactive"}
          </Text>
        </View>

        {stream.lastReceivedAt && (
          <Text style={styles.lastReceived}>
            Dernière réception : {formatDate(stream.lastReceivedAt)}
          </Text>
        )}

        <Pressable
          onPress={onDelete}
          accessibilityRole="button"
          accessibilityLabel="Supprimer cette source"
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.pressed,
          ]}
        >
          <Trash2 size={14} color="#f87171" />
        </Pressable>
      </View>
    </View>
  );
}

function TransactionCard({
  entry,
}: {
  entry: RevenueEntry;
}): React.ReactElement {
  const positive = entry.amount >= 0;

  return (
    <View style={styles.transactionCard}>
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: getEntryIconBackground(entry),
          },
        ]}
      >
        {getEntryIcon(entry)}
      </View>

      <View style={styles.transactionContent}>
        <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle} numberOfLines={2}>
            {entry.description}
          </Text>

          <Text
            style={[
              styles.transactionAmount,
              {
                color: positive ? "#6ee7b7" : "#fca5a5",
              },
            ]}
          >
            {positive ? "+" : "-"}
            {formatMoney(entry.amount, entry.currency)}
          </Text>
        </View>

        <View style={styles.transactionMeta}>
          <Text style={styles.transactionDate}>{formatDate(entry.date)}</Text>

          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {getCategoryLabel(entry.category)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function RevenusInner({ onBack }: Props): React.ReactElement {
  const [tab, setTab] = useState<Tab>("dashboard");

  const [showAddRevenue, setShowAddRevenue] = useState(false);

  const [showStreams, setShowStreams] = useState(true);

  const [transactionFilter, setTransactionFilter] =
    useState<TransactionFilter>("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [deleteStatus, setDeleteStatus] = useState<Status>("idle");

  const creatorStats = useQuery(api.finances.getCreatorStats, {});

  const deleteStream = useMutation(api.revenues.deleteStream);

  const data = creatorStats as CreatorStats | null | undefined;

  const loading = creatorStats === undefined;

  const streams = data?.streams ?? [];
  const entries = data?.entries ?? [];

  const activeStreams = useMemo(
    () => streams.filter((stream) => stream.active),
    [streams],
  );

  const totalBalance = data?.totalBalance ?? 0;

  const totalIncome = useMemo(
    () =>
      entries
        .filter((entry) => entry.amount > 0)
        .reduce((total, entry) => total + entry.amount, 0),
    [entries],
  );

  const totalWithdrawals = useMemo(
    () =>
      entries
        .filter((entry) => entry.amount < 0)
        .reduce((total, entry) => total + Math.abs(entry.amount), 0),
    [entries],
  );

  const currencies = useMemo(() => {
    const set = new Set<string>();

    for (const entry of entries) {
      if (entry.currency.trim()) {
        set.add(entry.currency);
      }
    }

    for (const stream of streams) {
      if (stream.currency.trim()) {
        set.add(stream.currency);
      }
    }

    return Array.from(set).sort();
  }, [entries, streams]);

  const monthlyStreams = useMemo(
    () => activeStreams.filter((stream) => stream.frequency === "mensuel"),
    [activeStreams],
  );

  const monthlyByCurrency = useMemo(() => {
    const result = new Map<string, number>();

    for (const stream of monthlyStreams) {
      const current = result.get(stream.currency) ?? 0;

      result.set(stream.currency, current + stream.amount);
    }

    return Array.from(result.entries())
      .map(([currency, amount]) => ({
        currency,
        amount,
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency));
  }, [monthlyStreams]);

  const filteredTransactions = useMemo(() => {
    switch (transactionFilter) {
      case "income":
        return entries.filter((entry) => entry.amount > 0);

      case "withdrawal":
        return entries.filter((entry) => entry.amount < 0);

      default:
        return entries;
    }
  }, [entries, transactionFilter]);

  const sortedTransactions = useMemo(
    () =>
      [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.date).getTime();

        const dateB = new Date(b.date).getTime();

        return dateB - dateA;
      }),
    [filteredTransactions],
  );

  const latestEntries = useMemo(
    () =>
      [...entries]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [entries],
  );

  async function confirmDelete(): Promise<void> {
    if (!deleteId) {
      return;
    }

    setDeleteStatus("loading");

    try {
      await deleteStream({
        streamId: deleteId as Id<"revenueStreams">,
      });

      setDeleteStatus("success");

      setTimeout(() => {
        setDeleteId(null);
        setDeleteStatus("idle");
      }, 350);
    } catch {
      setDeleteStatus("error");
    }
  }

  if (loading) {
    return <LoadingView />;
  }

  if (!data) {
    return <ErrorView />;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <ArrowLeft size={19} color="#ffffff" />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.eyebrow}>FINANCES</Text>

            <Text style={styles.title}>Revenus</Text>

            <Text style={styles.subtitle}>
              Votre activité financière réelle
            </Text>
          </View>

          <View style={styles.secureBadge}>
            <Database size={13} color="#6ee7b7" />
          </View>
        </View>

        <View style={styles.trustBanner}>
          <View style={styles.trustBannerIcon}>
            <CheckCircle2 size={17} color="#6ee7b7" />
          </View>

          <View style={styles.trustBannerContent}>
            <Text style={styles.trustBannerTitle}>Données vérifiables</Text>

            <Text style={styles.trustBannerText}>
              Les montants affichés proviennent des données associées à votre
              compte. Aucune statistique fictive n’est utilisée.
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {(
            [
              {
                id: "dashboard",
                label: "Vue globale",
              },
              {
                id: "sources",
                label: "Sources",
              },
              {
                id: "transactions",
                label: "Transactions",
              },
            ] as Array<{
              id: Tab;
              label: string;
            }>
          ).map((item) => {
            const active = tab === item.id;

            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.tab, active && styles.tabActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {tab === "dashboard" && (
          <>
            {entries.length === 0 ? (
              <EmptyView onAdd={() => setShowAddRevenue(true)} />
            ) : (
              <>
                <View style={styles.balanceCard}>
                  <View style={styles.balanceTop}>
                    <View>
                      <Text style={styles.balanceLabel}>
                        SOLDE COMMUNIQUÉ PAR LE BACKEND
                      </Text>

                      <Text style={styles.balanceAmount}>
                        {formatNumber(Math.max(0, totalBalance))}
                      </Text>

                      <Text style={styles.balanceHint}>
                        Le montant reste exprimé dans la logique monétaire
                        retournée par votre backend.
                      </Text>
                    </View>

                    <View style={styles.balanceIcon}>
                      <WalletCards size={23} color="#6ee7b7" />
                    </View>
                  </View>

                  <View style={styles.balanceDivider} />

                  <View style={styles.balanceActions}>
                    <Pressable
                      onPress={() => setShowAddRevenue(true)}
                      style={({ pressed }) => [
                        styles.actionButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Plus size={16} color="#ffffff" />

                      <Text style={styles.actionText}>Enregistrer</Text>
                    </Pressable>

                    <View style={styles.backendOnlyBadge}>
                      <Info size={13} color="#64748b" />

                      <Text style={styles.backendOnlyText}>
                        Retraits réels via Pay
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.metricsGrid}>
                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, styles.greenIcon]}>
                      <ArrowDownLeft size={17} color="#6ee7b7" />
                    </View>

                    <Text style={styles.metricValue}>
                      {formatNumber(totalIncome)}
                    </Text>

                    <Text style={styles.metricLabel}>Entrées</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, styles.redIcon]}>
                      <ArrowUpRight size={17} color="#fca5a5" />
                    </View>

                    <Text style={styles.metricValue}>
                      {formatNumber(totalWithdrawals)}
                    </Text>

                    <Text style={styles.metricLabel}>Sorties</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, styles.purpleIcon]}>
                      <Sparkles size={17} color="#c4b5fd" />
                    </View>

                    <Text style={styles.metricValue}>
                      {activeStreams.length}
                    </Text>

                    <Text style={styles.metricLabel}>Sources actives</Text>
                  </View>

                  <View style={styles.metricCard}>
                    <View style={[styles.metricIcon, styles.blueIcon]}>
                      <BarChart3 size={17} color="#93c5fd" />
                    </View>

                    <Text style={styles.metricValue}>{entries.length}</Text>

                    <Text style={styles.metricLabel}>Opérations</Text>
                  </View>
                </View>

                {monthlyByCurrency.length > 0 && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <View>
                        <Text style={styles.sectionTitle}>
                          Revenus mensuels récurrents
                        </Text>

                        <Text style={styles.sectionSubtitle}>
                          Calculés uniquement à partir des sources actives.
                        </Text>
                      </View>

                      <RefreshCw size={16} color="#475569" />
                    </View>

                    {monthlyByCurrency.map((item) => (
                      <View key={item.currency} style={styles.monthlyCard}>
                        <View style={styles.monthlyIcon}>
                          <CircleDollarSign size={17} color="#a78bfa" />
                        </View>

                        <View style={styles.monthlyContent}>
                          <Text style={styles.monthlyCurrency}>
                            {item.currency}
                          </Text>

                          <Text style={styles.monthlyDescription}>
                            Somme des sources mensuelles actives
                          </Text>
                        </View>

                        <Text style={styles.monthlyAmount}>
                          {formatNumber(item.amount)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View>
                      <Text style={styles.sectionTitle}>Activité récente</Text>

                      <Text style={styles.sectionSubtitle}>
                        Dernières opérations enregistrées
                      </Text>
                    </View>

                    <Pressable onPress={() => setTab("transactions")}>
                      <Text style={styles.linkText}>Tout voir</Text>
                    </Pressable>
                  </View>

                  {latestEntries.length === 0 ? (
                    <View style={styles.noActivity}>
                      <Text style={styles.noActivityText}>
                        Aucune activité récente.
                      </Text>
                    </View>
                  ) : (
                    latestEntries.map((entry) => (
                      <TransactionCard key={entry._id} entry={entry} />
                    ))
                  )}
                </View>
              </>
            )}
          </>
        )}

        {tab === "sources" && (
          <View style={styles.section}>
            <View style={styles.sourcesHeader}>
              <View>
                <Text style={styles.sectionTitle}>Sources de revenus</Text>

                <Text style={styles.sectionSubtitle}>
                  Les sources sont stockées dans votre compte.
                </Text>
              </View>

              <Pressable
                onPress={() => setShowAddRevenue(true)}
                style={({ pressed }) => [
                  styles.addSmallButton,
                  pressed && styles.pressed,
                ]}
              >
                <Plus size={16} color="#ffffff" />
              </Pressable>
            </View>

            {streams.length === 0 ? (
              <EmptyView onAdd={() => setShowAddRevenue(true)} />
            ) : (
              <>
                <Pressable
                  onPress={() => setShowStreams((value) => !value)}
                  style={styles.sourcesToggle}
                >
                  <Text style={styles.sourcesToggleText}>
                    {streams.length} source
                    {streams.length > 1 ? "s" : ""} enregistrée
                    {streams.length > 1 ? "s" : ""}
                  </Text>

                  {showStreams ? (
                    <ChevronUp size={17} color="#64748b" />
                  ) : (
                    <ChevronDown size={17} color="#64748b" />
                  )}
                </Pressable>

                {showStreams &&
                  streams.map((stream) => (
                    <SourceCard
                      key={stream._id}
                      stream={stream}
                      onDelete={() => setDeleteId(stream._id)}
                    />
                  ))}
              </>
            )}
          </View>
        )}

        {tab === "transactions" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Transactions</Text>

                <Text style={styles.sectionSubtitle}>
                  Historique fourni par le backend
                </Text>
              </View>

              <Text style={styles.transactionCount}>
                {sortedTransactions.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                [
                  {
                    id: "all",
                    label: "Toutes",
                  },
                  {
                    id: "income",
                    label: "Entrées",
                  },
                  {
                    id: "withdrawal",
                    label: "Sorties",
                  },
                ] as Array<{
                  id: TransactionFilter;
                  label: string;
                }>
              ).map((filter) => {
                const active = transactionFilter === filter.id;

                return (
                  <Pressable
                    key={filter.id}
                    onPress={() => setTransactionFilter(filter.id)}
                    style={[
                      styles.filterButton,
                      active && styles.filterButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterText,
                        active && styles.filterTextActive,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {sortedTransactions.length === 0 ? (
              <View style={styles.emptyTransactions}>
                <BarChart3 size={28} color="#475569" />

                <Text style={styles.emptyTransactionsTitle}>
                  Aucune transaction
                </Text>

                <Text style={styles.emptyTransactionsText}>
                  Aucun enregistrement ne correspond au filtre sélectionné.
                </Text>
              </View>
            ) : (
              sortedTransactions.map((entry) => (
                <TransactionCard key={entry._id} entry={entry} />
              ))
            )}

            <Pressable
              onPress={() => setShowAddRevenue(true)}
              style={({ pressed }) => [
                styles.secondaryAction,
                pressed && styles.pressed,
              ]}
            >
              <Plus size={16} color="#93c5fd" />

              <Text style={styles.secondaryActionText}>
                Enregistrer une nouvelle entrée
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.securityFooter}>
          <View style={styles.securityFooterIcon}>
            <Database size={15} color="#60a5fa" />
          </View>

          <View style={styles.securityFooterContent}>
            <Text style={styles.securityFooterTitle}>
              Transparence financière
            </Text>

            <Text style={styles.securityFooterText}>
              DébrouillePro ne convertit pas automatiquement les devises et ne
              transforme pas une opération locale en paiement réel. Les actions
              de paiement doivent être confirmées par le système de paiement
              approprié.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>

      <AddRevenueModal
        visible={showAddRevenue}
        onClose={() => setShowAddRevenue(false)}
        onSuccess={() => setShowAddRevenue(false)}
      />

      <Modal
        visible={deleteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => deleteStatus !== "loading" && setDeleteId(null)}
      >
        <View style={styles.confirmBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <Trash2 size={21} color="#f87171" />
            </View>

            <Text style={styles.confirmTitle}>Supprimer cette source ?</Text>

            <Text style={styles.confirmText}>
              Cette action demande une modification réelle de vos données. La
              source ne sera pas remplacée par une valeur fictive.
            </Text>

            {deleteStatus === "error" && (
              <Text style={styles.confirmError}>
                La suppression a échoué. Les données restent inchangées.
              </Text>
            )}

            <View style={styles.confirmActions}>
              <Pressable
                disabled={deleteStatus === "loading"}
                onPress={() => setDeleteId(null)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                disabled={deleteStatus === "loading"}
                onPress={() => {
                  void confirmDelete();
                }}
                style={[
                  styles.dangerButton,
                  deleteStatus === "loading" && styles.disabledButton,
                ]}
              >
                {deleteStatus === "loading" ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Trash2 size={15} color="#ffffff" />
                )}

                <Text style={styles.dangerButtonText}>Supprimer</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function RevenusPage({ onBack }: Props): React.ReactElement {
  return (
    <>
      <AuthLoading>
        <View style={styles.screen}>
          <View style={styles.skeletonContainer}>
            <Skeleton style={styles.skeletonHeader} />

            <Skeleton style={styles.skeletonHero} />

            <Skeleton style={styles.skeletonRow} />

            <Skeleton style={styles.skeletonRow} />

            <Skeleton style={styles.skeletonRow} />
          </View>
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.screen}>
          <Pressable onPress={onBack} style={styles.unauthenticatedBack}>
            <ArrowLeft size={19} color="#ffffff" />
          </Pressable>

          <View style={styles.unauthenticated}>
            <View style={styles.authIcon}>
              <WalletCards size={30} color="#60a5fa" />
            </View>

            <Text style={styles.authTitle}>Vos revenus</Text>

            <Text style={styles.authText}>
              Connectez-vous pour accéder aux données financières associées à
              votre compte.
            </Text>

            <SignInButton />
          </View>
        </View>
      </Unauthenticated>

      <Authenticated>
        <RevenusInner onBack={onBack} />
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
    paddingTop: 14,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    backgroundColor: "#050812",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.15)",
  },

  loadingTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 15,
  },

  loadingText: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 5,
    lineHeight: 17,
  },

  errorIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.14)",
  },

  stateTitle: {
    color: "#f8fafc",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 14,
    textAlign: "center",
  },

  stateText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 6,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },

  eyebrow: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.6,
  },

  title: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 1,
  },

  subtitle: {
    color: "#64748b",
    fontSize: 10,
    marginTop: 2,
  },

  secureBadge: {
    width: 38,
    height: 38,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.07)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.13)",
  },

  trustBanner: {
    flexDirection: "row",
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(52,211,153,0.05)",
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.11)",
    marginBottom: 15,
  },

  trustBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  trustBannerContent: {
    flex: 1,
    marginLeft: 10,
  },

  trustBannerTitle: {
    color: "#a7f3d0",
    fontSize: 11,
    fontWeight: "900",
  },

  trustBannerText: {
    color: "#64748b",
    fontSize: 9.5,
    lineHeight: 15,
    marginTop: 3,
  },

  tabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 17,
  },

  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
  },

  tabActive: {
    backgroundColor: "rgba(96,165,250,0.13)",
  },

  tabText: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "700",
  },

  tabTextActive: {
    color: "#dbeafe",
  },

  balanceCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.16)",
    marginBottom: 14,
  },

  balanceTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  balanceLabel: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },

  balanceAmount: {
    color: "#ffffff",
    fontSize: 31,
    fontWeight: "900",
    marginTop: 7,
  },

  balanceHint: {
    color: "#64748b",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
    maxWidth: 270,
  },

  balanceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  balanceDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 16,
  },

  balanceActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#2563eb",
  },

  actionText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },

  backendOnlyBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  backendOnlyText: {
    color: "#475569",
    fontSize: 8.5,
    flexShrink: 1,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 20,
  },

  metricCard: {
    width: "48%",
    padding: 13,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  metricIcon: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },

  greenIcon: {
    backgroundColor: "rgba(52,211,153,0.08)",
  },

  redIcon: {
    backgroundColor: "rgba(248,113,113,0.08)",
  },

  purpleIcon: {
    backgroundColor: "rgba(167,139,250,0.08)",
  },

  blueIcon: {
    backgroundColor: "rgba(96,165,250,0.08)",
  },

  metricValue: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "900",
  },

  metricLabel: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 2,
  },

  section: {
    marginBottom: 20,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "850",
  },

  sectionSubtitle: {
    color: "#64748b",
    fontSize: 9.5,
    lineHeight: 14,
    marginTop: 3,
  },

  linkText: {
    color: "#60a5fa",
    fontSize: 10,
    fontWeight: "800",
  },

  monthlyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },

  monthlyIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
  },

  monthlyContent: {
    flex: 1,
    marginLeft: 10,
  },

  monthlyCurrency: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "800",
  },

  monthlyDescription: {
    color: "#64748b",
    fontSize: 8.5,
    marginTop: 2,
  },

  monthlyAmount: {
    color: "#c4b5fd",
    fontSize: 12,
    fontWeight: "900",
  },

  transactionCard: {
    flexDirection: "row",
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 8,
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionContent: {
    flex: 1,
    marginLeft: 10,
  },

  transactionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  transactionTitle: {
    color: "#e2e8f0",
    fontSize: 11,
    fontWeight: "750",
    flex: 1,
    marginRight: 8,
  },

  transactionAmount: {
    fontSize: 11,
    fontWeight: "900",
  },

  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
    gap: 7,
  },

  transactionDate: {
    color: "#475569",
    fontSize: 8.5,
  },

  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
    backgroundColor: "rgba(96,165,250,0.07)",
  },

  categoryBadgeText: {
    color: "#93c5fd",
    fontSize: 7.5,
    fontWeight: "800",
  },

  transactionCount: {
    color: "#64748b",
    fontSize: 10,
    fontWeight: "800",
  },

  filterRow: {
    gap: 7,
    marginBottom: 10,
  },

  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  filterButtonActive: {
    backgroundColor: "rgba(96,165,250,0.12)",
    borderColor: "rgba(96,165,250,0.20)",
  },

  filterText: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "700",
  },

  filterTextActive: {
    color: "#bfdbfe",
  },

  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  addSmallButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
  },

  sourcesToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.03)",
    marginBottom: 8,
  },

  sourcesToggleText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "700",
  },

  sourceCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 9,
  },

  sourceTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  sourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.08)",
  },

  sourceMain: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },

  sourceTitle: {
    color: "#f8fafc",
    fontSize: 11,
    fontWeight: "800",
  },

  sourceType: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  sourceAmountBox: {
    alignItems: "flex-end",
  },

  sourceAmount: {
    color: "#c4b5fd",
    fontSize: 11,
    fontWeight: "900",
  },

  sourceFrequency: {
    color: "#475569",
    fontSize: 8,
    marginTop: 2,
  },

  sourceBottom: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  activeStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  activeStatusText: {
    fontSize: 8.5,
    fontWeight: "800",
  },

  lastReceived: {
    color: "#475569",
    fontSize: 8,
    marginLeft: 10,
    flex: 1,
  },

  deleteButton: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.07)",
  },

  emptyCard: {
    padding: 24,
    borderRadius: 21,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.08)",
  },

  emptyTitle: {
    color: "#f8fafc",
    fontSize: 15,
    fontWeight: "850",
    textAlign: "center",
    marginTop: 14,
  },

  emptyText: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
    maxWidth: 310,
  },

  primaryButton: {
    minHeight: 46,
    paddingHorizontal: 17,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#2563eb",
  },

  submitButton: {
    marginTop: 13,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 10.5,
    fontWeight: "900",
  },

  secondaryAction: {
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "rgba(96,165,250,0.07)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.13)",
    marginTop: 5,
  },

  secondaryActionText: {
    color: "#93c5fd",
    fontSize: 10,
    fontWeight: "800",
  },

  emptyTransactions: {
    alignItems: "center",
    paddingVertical: 45,
    paddingHorizontal: 20,
  },

  emptyTransactionsTitle: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 9,
  },

  emptyTransactionsText: {
    color: "#475569",
    fontSize: 9.5,
    textAlign: "center",
    lineHeight: 15,
    marginTop: 4,
  },

  securityFooter: {
    flexDirection: "row",
    padding: 13,
    borderRadius: 16,
    backgroundColor: "rgba(96,165,250,0.04)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.08)",
  },

  securityFooterIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(96,165,250,0.07)",
  },

  securityFooterContent: {
    flex: 1,
    marginLeft: 9,
  },

  securityFooterTitle: {
    color: "#93c5fd",
    fontSize: 9.5,
    fontWeight: "900",
  },

  securityFooterText: {
    color: "#475569",
    fontSize: 8.5,
    lineHeight: 14,
    marginTop: 3,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  modalSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: 27,
    borderTopRightRadius: 27,
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    paddingTop: 9,
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.16)",
    marginBottom: 14,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 17,
    paddingBottom: 12,
  },

  modalTitle: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: "#64748b",
    fontSize: 9,
    marginTop: 3,
  },

  modalClose: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  modalContent: {
    paddingHorizontal: 17,
    paddingBottom: 28,
  },

  fieldLabel: {
    color: "#94a3b8",
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 11,
    marginBottom: 7,
  },

  input: {
    minHeight: 47,
    borderRadius: 13,
    paddingHorizontal: 13,
    color: "#ffffff",
    fontSize: 12,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  multilineInput: {
    minHeight: 84,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  optionRow: {
    gap: 7,
  },

  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  optionActive: {
    backgroundColor: "rgba(37,99,235,0.16)",
    borderColor: "rgba(59,130,246,0.28)",
  },

  optionText: {
    color: "#64748b",
    fontSize: 9,
    fontWeight: "700",
  },

  optionTextActive: {
    color: "#bfdbfe",
  },

  formError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "rgba(248,113,113,0.07)",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.12)",
    marginTop: 11,
  },

  formErrorText: {
    flex: 1,
    color: "#fca5a5",
    fontSize: 9,
    lineHeight: 14,
  },

  integrityNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 11,
    borderRadius: 12,
    backgroundColor: "rgba(96,165,250,0.05)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.09)",
    marginTop: 11,
  },

  integrityNoticeText: {
    flex: 1,
    color: "#64748b",
    fontSize: 8.5,
    lineHeight: 14,
  },

  confirmBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  confirmCard: {
    width: "100%",
    maxWidth: 390,
    padding: 20,
    borderRadius: 22,
    backgroundColor: "#0b1120",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  confirmIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,113,113,0.08)",
  },

  confirmTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginTop: 13,
  },

  confirmText: {
    color: "#64748b",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
  },

  confirmError: {
    color: "#fca5a5",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 10,
  },

  confirmActions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 17,
  },

  cancelButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  cancelText: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
  },

  dangerButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#dc2626",
  },

  dangerButtonText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.55,
  },

  skeletonContainer: {
    padding: 16,
    gap: 12,
  },

  skeletonHeader: {
    height: 55,
    borderRadius: 15,
  },

  skeletonHero: {
    height: 190,
    borderRadius: 21,
  },

  skeletonRow: {
    height: 82,
    borderRadius: 17,
  },

  unauthenticatedBack: {
    position: "absolute",
    top: 18,
    left: 16,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  unauthenticated: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
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
    fontSize: 20,
    fontWeight: "900",
    marginTop: 18,
  },

  authText: {
    color: "#64748b",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },

  noActivity: {
    padding: 18,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  noActivityText: {
    color: "#475569",
    fontSize: 10,
    textAlign: "center",
  },

  bottomSpace: {
    height: 25,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});

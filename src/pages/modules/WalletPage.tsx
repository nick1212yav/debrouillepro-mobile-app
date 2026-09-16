// ============================================================================
// DÉBROUILLEPAY — WALLET
// Version finale native / production
//
// Principes :
// - React Native uniquement
// - Aucun Web API
// - Aucun faux solde
// - Aucun faux paiement
// - Aucun écrit direct dans walletTransactions depuis le client
// - Recharge = PaymentIntent -> PaymentAttempt -> Provider -> confirmation
// - Solde = lecture du ledger réel
// - Budget = données Convex réelles uniquement
// - Aucun graphique simulé
// - Aucun QR simulé
// ============================================================================

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
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
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit3,
  Eye,
  EyeOff,
  History,
  Plus,
  RefreshCw,
  Send,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet as WalletIcon,
  X,
} from "lucide-react-native";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import type { Id } from "@/convex/_generated/dataModel.d.ts";

// ============================================================================
// TYPES
// ============================================================================

type Tab = "overview" | "transactions" | "budget";

type Provider = "orange_money" | "mpesa" | "airtel_money" | "mtn_momo";

type ProviderOption = {
  id: Provider;
  label: string;
  shortLabel: string;
  accent: string;
};

type BudgetCategory = {
  name: string;
  allocated: number;
  spent: number;
};

type WalletErrorBoundaryProps = {
  children: ReactNode;
};

type WalletErrorBoundaryState = {
  hasError: boolean;
};

// ============================================================================
// CONSTANTES
// ============================================================================

const COLORS = {
  background: "#020412",
  surface: "#0B1020",
  surfaceElevated: "#10172A",
  surfaceSoft: "rgba(255,255,255,0.045)",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.14)",
  text: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.68)",
  textMuted: "rgba(255,255,255,0.42)",
  green: "#10B981",
  greenSoft: "rgba(16,185,129,0.14)",
  red: "#EF4444",
  redSoft: "rgba(239,68,68,0.14)",
  orange: "#F97316",
  orangeSoft: "rgba(249,115,22,0.14)",
  purple: "#8B5CF6",
  purpleSoft: "rgba(139,92,246,0.14)",
  blue: "#3B82F6",
  blueSoft: "rgba(59,130,246,0.14)",
  yellow: "#FBBF24",
  yellowSoft: "rgba(251,191,36,0.14)",
};

const PROVIDERS: ProviderOption[] = [
  {
    id: "orange_money",
    label: "Orange Money",
    shortLabel: "Orange",
    accent: "#FF7A00",
  },
  {
    id: "mpesa",
    label: "M-Pesa",
    shortLabel: "M-Pesa",
    accent: "#22C55E",
  },
  {
    id: "airtel_money",
    label: "Airtel Money",
    shortLabel: "Airtel",
    accent: "#EF4444",
  },
  {
    id: "mtn_momo",
    label: "MTN MoMo",
    shortLabel: "MTN",
    accent: "#FACC15",
  },
];

const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    name: "Transport",
    allocated: 0,
    spent: 0,
  },
  {
    name: "Alimentation",
    allocated: 0,
    spent: 0,
  },
  {
    name: "Santé",
    allocated: 0,
    spent: 0,
  },
  {
    name: "Loisirs",
    allocated: 0,
    spent: 0,
  },
  {
    name: "Autres",
    allocated: 0,
    spent: 0,
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatAmount(amount: number, currency = "CDF"): string {
  if (!Number.isFinite(amount)) {
    return `0 ${currency}`;
  }

  return `${Math.round(amount).toLocaleString("fr-FR")} ${currency}`;
}

function parsePositiveAmount(value: string): number | null {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount <= 0) {
    return null;
  }

  return amount;
}

function createIdempotencyKey(
  operation: string,
  provider: Provider,
  amount: number,
): string {
  // Pas de Math.random().
  // Le compteur temporel rend chaque tentative distincte dans cette session.
  return `${operation}:${provider}:${amount}:${Date.now()}`;
}

function getTransactionDate(tx: { completedAt?: string }): string {
  if (!tx.completedAt) {
    return "Date non disponible";
  }

  const date = new Date(tx.completedAt);

  if (Number.isNaN(date.getTime())) {
    return "Date non disponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTransactionTime(tx: { completedAt?: string }): string {
  if (!tx.completedAt) {
    return "";
  }

  const date = new Date(tx.completedAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getProviderLabel(provider?: string): string {
  switch (provider) {
    case "orange_money":
      return "Orange Money";
    case "mpesa":
      return "M-Pesa";
    case "airtel_money":
      return "Airtel Money";
    case "mtn_momo":
      return "MTN MoMo";
    case "internal":
      return "DébrouillePay";
    default:
      return provider ?? "—";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "completed":
      return "Complété";
    case "pending":
      return "En attente";
    case "failed":
      return "Échoué";
    default:
      return status;
  }
}

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

class WalletErrorBoundary extends Component<
  WalletErrorBoundaryProps,
  WalletErrorBoundaryState
> {
  public state: WalletErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): WalletErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[Wallet] Render error:", error);
    console.error("[Wallet] Component stack:", info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({
      hasError: false,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View style={styles.errorScreen}>
          <View style={styles.errorIcon}>
            <AlertCircle size={34} color={COLORS.red} />
          </View>

          <Text style={styles.errorTitle}>
            Le Wallet n'a pas pu être affiché
          </Text>

          <Text style={styles.errorDescription}>
            Une erreur inattendue est survenue. Aucun mouvement financier n'a
            été créé par cette erreur d'affichage.
          </Text>

          <Pressable
            onPress={this.handleRetry}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <RefreshCw size={17} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// AUTH LOADING
// ============================================================================

function WalletLoading(): React.ReactElement {
  return (
    <View style={styles.loadingScreen}>
      <View style={styles.loadingLogo}>
        <WalletIcon size={30} color={COLORS.green} />
      </View>

      <ActivityIndicator size="small" color={COLORS.green} />

      <Text style={styles.loadingText}>
        Sécurisation de votre portefeuille…
      </Text>
    </View>
  );
}

// ============================================================================
// UNAUTHENTICATED
// ============================================================================

function WalletUnauthenticated({
  onBack,
}: {
  onBack: () => void;
}): React.ReactElement {
  return (
    <View style={styles.unauthenticatedScreen}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} color={COLORS.text} />
      </Pressable>

      <View style={styles.unauthenticatedIcon}>
        <WalletIcon size={42} color={COLORS.textMuted} />
      </View>

      <Text style={styles.unauthenticatedTitle}>Votre Wallet vous attend</Text>

      <Text style={styles.unauthenticatedDescription}>
        Connectez-vous pour consulter votre solde, vos transactions et vos
        opérations DébrouillePay.
      </Text>
    </View>
  );
}

// ============================================================================
// MAIN WALLET
// ============================================================================

function WalletInner({ onBack }: { onBack: () => void }): React.ReactElement {
  const [balanceVisible, setBalanceVisible] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<Tab>("overview");

  const [showTopUp, setShowTopUp] = React.useState(false);
  const [showSendInfo, setShowSendInfo] = React.useState(false);

  const [topUpProvider, setTopUpProvider] = React.useState<Provider | null>(
    null,
  );
  const [topUpAmount, setTopUpAmount] = React.useState("");
  const [topUpPhone, setTopUpPhone] = React.useState("");
  const [topUpSubmitting, setTopUpSubmitting] = React.useState(false);

  const [editingCategory, setEditingCategory] = React.useState<string | null>(
    null,
  );
  const [editingValue, setEditingValue] = React.useState("");
  const [budgetSaving, setBudgetSaving] = React.useState(false);

  const walletData = useQuery(api.finances.getWalletBalance, {});
  const transactions = useQuery(api.finances.getWalletTransactions, {
    limit: 50,
  });
  const budget = useQuery(api.finances.getMyBudget, {});

  const createPaymentIntent = useMutation(api.payments.createPaymentIntent);
  const startPayment = useAction(api.payments.startPayment);

  const upsertBudget = useMutation(api.finances.upsertBudget);
  const updateBudgetCategory = useMutation(api.finances.updateBudgetCategory);

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------

  const walletLoading = walletData === undefined;
  const transactionsLoading = transactions === undefined;
  const budgetLoading = budget === undefined;

  // --------------------------------------------------------------------------
  // REAL WALLET DATA
  // --------------------------------------------------------------------------

  const balances = walletData?.balances ?? [];

  /*
   * Le Payment Core / finances protège déjà la règle :
   * aucune addition implicite entre plusieurs devises.
   *
   * Si plusieurs devises existent, on ne prétend pas avoir un "solde total"
   * converti. On affiche la première devise comme vue principale et les
   * autres séparément.
   */
  const primaryBalance =
    balances.length === 1
      ? balances[0]
      : (balances.find((entry) => entry.currency === "CDF") ?? balances[0]);

  const balance = primaryBalance?.balance ?? 0;
  const monthIn = primaryBalance?.monthIn ?? 0;
  const monthOut = primaryBalance?.monthOut ?? 0;
  const currency = primaryBalance?.currency ?? "CDF";

  const realTransactions = transactions ?? [];

  const categories: BudgetCategory[] =
    budget?.categories?.map((category) => ({
      name: category.name,
      allocated: category.allocated,
      spent: category.spent,
    })) ?? [];

  const totalBudget = categories.reduce(
    (sum, category) => sum + category.allocated,
    0,
  );

  const totalSpent = categories.reduce(
    (sum, category) => sum + category.spent,
    0,
  );

  const budgetRemaining = totalBudget - totalSpent;

  // --------------------------------------------------------------------------
  // TOP UP — REAL PAYMENT CORE
  // --------------------------------------------------------------------------

  async function handleTopUp(): Promise<void> {
    if (topUpSubmitting) {
      return;
    }

    if (!topUpProvider) {
      Alert.alert(
        "Opérateur requis",
        "Sélectionnez l'opérateur Mobile Money utilisé pour la recharge.",
      );
      return;
    }

    const amount = parsePositiveAmount(topUpAmount);

    if (!amount) {
      Alert.alert("Montant invalide", "Saisissez un montant supérieur à zéro.");
      return;
    }

    if (amount < 500) {
      Alert.alert(
        "Montant insuffisant",
        "Le montant minimum de recharge est de 500 CDF.",
      );
      return;
    }

    const phone = topUpPhone.trim();

    if (!phone) {
      Alert.alert(
        "Numéro requis",
        "Saisissez le numéro Mobile Money qui sera utilisé pour la recharge.",
      );
      return;
    }

    setTopUpSubmitting(true);

    try {
      const idempotencyKey = createIdempotencyKey(
        "wallet_topup",
        topUpProvider,
        amount,
      );

      /*
       * ÉTAPE 1
       * Création de l'intention uniquement.
       *
       * Aucun solde n'est crédité ici.
       */
      const intent = await createPaymentIntent({
        type: "wallet_topup",
        amount,
        currency: "CDF",
        provider: topUpProvider,
        idempotencyKey,
        customerReference: phone,
      });

      /*
       * ÉTAPE 2
       * Démarrage réel auprès du provider.
       *
       * Le client ne touche jamais walletTransactions.
       */
      const result = await startPayment({
        paymentIntentId: intent.paymentIntentId,
      });

      if (result.status === "succeeded") {
        Alert.alert(
          "Recharge confirmée",
          "Le Payment Core a confirmé cette opération.",
        );
      } else if (
        result.status === "processing" ||
        result.status === "requires_action"
      ) {
        Alert.alert(
          "Recharge en cours",
          "La recharge a été transmise au circuit de paiement. Le solde ne sera crédité qu'après confirmation réelle du provider.",
        );
      } else {
        Alert.alert(
          "Recharge non finalisée",
          "Le paiement n'est pas encore confirmé. Aucun solde fictif n'a été ajouté.",
        );
      }

      setShowTopUp(false);
      setTopUpProvider(null);
      setTopUpAmount("");
      setTopUpPhone("");
    } catch (error) {
      console.error("[Wallet] Top-up error:", error);

      const message =
        error instanceof Error
          ? error.message
          : "Le paiement n'a pas pu être démarré.";

      Alert.alert(
        "Recharge non effectuée",
        `${message}\n\nAucun mouvement financier fictif n'a été créé.`,
      );
    } finally {
      setTopUpSubmitting(false);
    }
  }

  // --------------------------------------------------------------------------
  // BUDGET
  // --------------------------------------------------------------------------

  async function handleCreateBudget(): Promise<void> {
    if (budgetSaving) {
      return;
    }

    setBudgetSaving(true);

    try {
      const draftCategories = DEFAULT_BUDGET_CATEGORIES.map((category) => ({
        ...category,
      }));

      await upsertBudget({
        name: "Budget mensuel",
        categories: draftCategories,
        currency: "CDF",
        totalAllocated: 0,
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .slice(0, 10),
      });

      Alert.alert(
        "Budget créé",
        "Votre budget réel a été créé. Vous pouvez maintenant définir les montants par catégorie.",
      );
    } catch (error) {
      console.error("[Wallet] Budget creation error:", error);

      Alert.alert(
        "Impossible de créer le budget",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setBudgetSaving(false);
    }
  }

  async function handleSaveBudgetCategory(categoryName: string): Promise<void> {
    if (!budget || budgetSaving) {
      return;
    }

    const amount = Number(editingValue);

    if (!Number.isFinite(amount) || amount < 0) {
      Alert.alert(
        "Montant invalide",
        "Le montant doit être supérieur ou égal à zéro.",
      );
      return;
    }

    setBudgetSaving(true);

    try {
      await updateBudgetCategory({
        budgetId: budget._id as Id<"budgets">,
        categoryName,
        allocated: amount,
      });

      setEditingCategory(null);
      setEditingValue("");

      Alert.alert(
        "Budget mis à jour",
        `La catégorie ${categoryName} a été enregistrée.`,
      );
    } catch (error) {
      console.error("[Wallet] Budget update error:", error);

      Alert.alert(
        "Mise à jour impossible",
        error instanceof Error ? error.message : "Une erreur est survenue.",
      );
    } finally {
      setBudgetSaving(false);
    }
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <View style={styles.container}>
      <View pointerEvents="none" style={styles.backgroundGlowOne} />
      <View pointerEvents="none" style={styles.backgroundGlowTwo} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ================================================================
            HEADER
        ================================================================ */}

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={onBack}
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.pressed,
              ]}
            >
              <ArrowLeft size={18} color={COLORS.text} />
            </Pressable>

            <View>
              <Text style={styles.headerTitle}>Wallet</Text>
              <Text style={styles.headerSubtitle}>DébrouillePay</Text>
            </View>
          </View>

          <View style={styles.secureBadge}>
            <Shield size={13} color={COLORS.green} />
            <Text style={styles.secureText}>Sécurisé</Text>
          </View>
        </View>

        {/* ================================================================
            MULTI-CURRENCY NOTICE
        ================================================================ */}

        {balances.length > 1 && (
          <View style={styles.multiCurrencyNotice}>
            <AlertCircle size={17} color={COLORS.blue} />

            <View style={styles.multiCurrencyTextContainer}>
              <Text style={styles.multiCurrencyTitle}>
                Portefeuille multi-devises
              </Text>

              <Text style={styles.multiCurrencyDescription}>
                Les devises sont affichées séparément. Aucun taux de change
                fictif n'est appliqué.
              </Text>
            </View>
          </View>
        )}

        {/* ================================================================
            BALANCE CARD
        ================================================================ */}

        <View style={styles.balanceCard}>
          <View style={styles.balanceCardGlow} />

          <View style={styles.balanceTopRow}>
            <View style={styles.balanceBrand}>
              <View style={styles.walletMiniIcon}>
                <WalletIcon size={16} color={COLORS.green} />
              </View>

              <View>
                <Text style={styles.balanceBrandTitle}>DébrouillePay</Text>
                <Text style={styles.balanceBrandSubtitle}>
                  Portefeuille principal
                </Text>
              </View>
            </View>

            <View style={styles.protectedBadge}>
              <Shield size={12} color={COLORS.green} />
              <Text style={styles.protectedText}>Protégé</Text>
            </View>
          </View>

          <Text style={styles.balanceLabel}>SOLDE DISPONIBLE</Text>

          <View style={styles.balanceValueRow}>
            {walletLoading ? (
              <ActivityIndicator size="small" color={COLORS.green} />
            ) : (
              <Text style={styles.balanceValue}>
                {balanceVisible
                  ? formatAmount(balance, currency)
                  : `•••••• ${currency}`}
              </Text>
            )}

            <Pressable
              onPress={() => setBalanceVisible((visible) => !visible)}
              style={({ pressed }) => [
                styles.eyeButton,
                pressed && styles.pressed,
              ]}
            >
              {balanceVisible ? (
                <Eye size={17} color={COLORS.textSecondary} />
              ) : (
                <EyeOff size={17} color={COLORS.textSecondary} />
              )}
            </Pressable>
          </View>

          {!walletLoading && balances.length > 0 && (
            <View style={styles.currencyLine}>
              {balances.map((entry) => (
                <View key={entry.currency} style={styles.currencyPill}>
                  <Text style={styles.currencyPillText}>
                    {entry.currency}{" "}
                    {formatAmount(entry.balance, entry.currency)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.balanceFooter}>
            <View>
              <Text style={styles.balanceFooterLabel}>ENTRÉES CE MOIS</Text>
              <View style={styles.balanceFooterValueRow}>
                <TrendingUp size={13} color={COLORS.green} />
                <Text style={styles.incomeValue}>
                  +{formatAmount(monthIn, currency)}
                </Text>
              </View>
            </View>

            <View style={styles.balanceFooterDivider} />

            <View>
              <Text style={styles.balanceFooterLabel}>SORTIES CE MOIS</Text>
              <View style={styles.balanceFooterValueRow}>
                <TrendingDown size={13} color={COLORS.red} />
                <Text style={styles.expenseValue}>
                  -{formatAmount(monthOut, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ================================================================
            ACTIONS
        ================================================================ */}

        <View style={styles.actionsRow}>
          <Pressable
            onPress={() => setShowSendInfo(true)}
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionGreen,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIcon}>
              <Send size={18} color={COLORS.green} />
            </View>

            <Text style={styles.actionLabel}>Envoyer</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              Alert.alert(
                "Réception",
                "La réception directe par QR nécessite encore un endpoint de réception officiel relié au Payment Core. Aucun QR fictif n'est généré.",
              )
            }
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionBlue,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIcon}>
              <Download size={18} color={COLORS.blue} />
            </View>

            <Text style={styles.actionLabel}>Recevoir</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowTopUp(true)}
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionPurple,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIcon}>
              <RefreshCw size={18} color={COLORS.purple} />
            </View>

            <Text style={styles.actionLabel}>Recharger</Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("transactions")}
            style={({ pressed }) => [
              styles.actionCard,
              styles.actionOrange,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.actionIcon}>
              <History size={18} color={COLORS.orange} />
            </View>

            <Text style={styles.actionLabel}>Historique</Text>
          </Pressable>
        </View>

        {/* ================================================================
            TABS
        ================================================================ */}

        <View style={styles.tabsContainer}>
          {(
            [
              ["overview", "Aperçu"],
              ["transactions", "Transactions"],
              ["budget", "Budget"],
            ] as const
          ).map(([tab, label]) => {
            const selected = activeTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [
                  styles.tab,
                  selected && styles.tabSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.tabText, selected && styles.tabTextSelected]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ================================================================
            OVERVIEW
        ================================================================ */}

        {activeTab === "overview" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>ACTIVITÉ RÉELLE</Text>
                <Text style={styles.sectionTitle}>Votre portefeuille</Text>
              </View>

              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIcon,
                    { backgroundColor: COLORS.greenSoft },
                  ]}
                >
                  <ArrowDownLeft size={16} color={COLORS.green} />
                </View>

                <Text style={styles.statValue}>
                  {formatAmount(monthIn, currency)}
                </Text>

                <Text style={styles.statLabel}>Entrées ce mois</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[styles.statIcon, { backgroundColor: COLORS.redSoft }]}
                >
                  <ArrowUpRight size={16} color={COLORS.red} />
                </View>

                <Text style={styles.statValue}>
                  {formatAmount(monthOut, currency)}
                </Text>

                <Text style={styles.statLabel}>Sorties ce mois</Text>
              </View>
            </View>

            <View style={styles.realDataCard}>
              <View style={styles.realDataIcon}>
                <Shield size={20} color={COLORS.green} />
              </View>

              <View style={styles.realDataContent}>
                <Text style={styles.realDataTitle}>Solde issu du ledger</Text>

                <Text style={styles.realDataDescription}>
                  Le solde affiché provient uniquement des transactions
                  financières confirmées dans Convex. Aucune simulation locale
                  n'est utilisée.
                </Text>
              </View>
            </View>

            <View style={styles.recentHeader}>
              <Text style={styles.sectionEyebrow}>DERNIERS MOUVEMENTS</Text>

              <Pressable onPress={() => setActiveTab("transactions")}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </Pressable>
            </View>

            {transactionsLoading ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="small" color={COLORS.green} />
                <Text style={styles.inlineLoadingText}>
                  Chargement des transactions…
                </Text>
              </View>
            ) : realTransactions.length === 0 ? (
              <EmptyTransactions />
            ) : (
              <View style={styles.transactionList}>
                {realTransactions.slice(0, 5).map((tx) => (
                  <TransactionRow key={tx._id} transaction={tx} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ================================================================
            TRANSACTIONS
        ================================================================ */}

        {activeTab === "transactions" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>HISTORIQUE</Text>

                <Text style={styles.sectionTitle}>Transactions</Text>
              </View>

              {!transactionsLoading && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>
                    {realTransactions.length}
                  </Text>
                </View>
              )}
            </View>

            {transactionsLoading ? (
              <View style={styles.loadingPanel}>
                <ActivityIndicator size="small" color={COLORS.green} />
                <Text style={styles.loadingPanelText}>
                  Chargement de votre historique…
                </Text>
              </View>
            ) : realTransactions.length === 0 ? (
              <EmptyTransactions />
            ) : (
              <View style={styles.transactionList}>
                {realTransactions.map((tx) => (
                  <TransactionRow key={tx._id} transaction={tx} expanded />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ================================================================
            BUDGET
        ================================================================ */}

        {activeTab === "budget" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionEyebrow}>PILOTAGE FINANCIER</Text>

                <Text style={styles.sectionTitle}>Budget mensuel</Text>
              </View>
            </View>

            {budgetLoading ? (
              <View style={styles.loadingPanel}>
                <ActivityIndicator size="small" color={COLORS.green} />
                <Text style={styles.loadingPanelText}>
                  Chargement du budget…
                </Text>
              </View>
            ) : !budget ? (
              <View style={styles.emptyBudgetCard}>
                <View style={styles.emptyBudgetIcon}>
                  <WalletIcon size={28} color={COLORS.purple} />
                </View>

                <Text style={styles.emptyBudgetTitle}>
                  Aucun budget enregistré
                </Text>

                <Text style={styles.emptyBudgetDescription}>
                  Créez votre premier budget pour suivre vos dépenses
                  directement depuis DébrouillePay.
                </Text>

                <Pressable
                  disabled={budgetSaving}
                  onPress={() => void handleCreateBudget()}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                    budgetSaving && styles.disabled,
                  ]}
                >
                  {budgetSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Plus size={17} color="#FFFFFF" />
                  )}

                  <Text style={styles.primaryButtonText}>Créer mon budget</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.budgetSummary}>
                  <View>
                    <Text style={styles.budgetSummaryLabel}>DÉPENSÉ</Text>

                    <Text style={styles.budgetSummaryValue}>
                      {formatAmount(totalSpent, budget.currency)}
                    </Text>

                    <Text style={styles.budgetSummarySecondary}>
                      sur {formatAmount(totalBudget, budget.currency)}
                    </Text>
                  </View>

                  <View style={styles.budgetRemaining}>
                    <Text style={styles.budgetRemainingLabel}>RESTANT</Text>

                    <Text
                      style={[
                        styles.budgetRemainingValue,
                        {
                          color:
                            budgetRemaining < 0 ? COLORS.red : COLORS.green,
                        },
                      ]}
                    >
                      {formatAmount(
                        Math.max(0, budgetRemaining),
                        budget.currency,
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.budgetProgressTrack}>
                  <View
                    style={[
                      styles.budgetProgressFill,
                      {
                        width: `${Math.min(
                          Math.max(totalSpent / Math.max(totalBudget, 1), 0) *
                            100,
                          100,
                        )}%`,
                        backgroundColor:
                          totalSpent > totalBudget
                            ? COLORS.red
                            : totalSpent >= totalBudget * 0.8
                              ? COLORS.orange
                              : COLORS.green,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.categoryTitle}>PAR CATÉGORIE</Text>

                <View style={styles.categoryList}>
                  {categories.map((category) => {
                    const percentage =
                      category.allocated > 0
                        ? (category.spent / category.allocated) * 100
                        : 0;

                    const over = category.spent > category.allocated;

                    const alert = percentage >= 80;

                    const editing = editingCategory === category.name;

                    return (
                      <View
                        key={category.name}
                        style={[
                          styles.categoryCard,
                          over && styles.categoryCardOver,
                        ]}
                      >
                        <View style={styles.categoryHeader}>
                          <View style={styles.categoryIdentity}>
                            <View style={styles.categoryDot} />

                            <View>
                              <Text style={styles.categoryName}>
                                {category.name}
                              </Text>

                              <Text style={styles.categoryAmounts}>
                                {formatAmount(category.spent, budget.currency)}{" "}
                                /{" "}
                                {formatAmount(
                                  category.allocated,
                                  budget.currency,
                                )}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.categoryActions}>
                            {over && (
                              <Text style={styles.overBudgetBadge}>
                                DÉPASSÉ
                              </Text>
                            )}

                            {alert && !over && (
                              <AlertTriangle size={15} color={COLORS.orange} />
                            )}

                            {editing ? (
                              <>
                                <TextInput
                                  value={editingValue}
                                  onChangeText={setEditingValue}
                                  keyboardType="numeric"
                                  autoFocus
                                  style={styles.categoryInput}
                                  placeholder="0"
                                  placeholderTextColor={COLORS.textMuted}
                                />

                                <Pressable
                                  disabled={budgetSaving}
                                  onPress={() =>
                                    void handleSaveBudgetCategory(category.name)
                                  }
                                >
                                  <Check size={17} color={COLORS.green} />
                                </Pressable>

                                <Pressable
                                  disabled={budgetSaving}
                                  onPress={() => {
                                    setEditingCategory(null);
                                    setEditingValue("");
                                  }}
                                >
                                  <X size={17} color={COLORS.red} />
                                </Pressable>
                              </>
                            ) : (
                              <Pressable
                                onPress={() => {
                                  setEditingCategory(category.name);
                                  setEditingValue(String(category.allocated));
                                }}
                              >
                                <Edit3 size={16} color={COLORS.textMuted} />
                              </Pressable>
                            )}
                          </View>
                        </View>

                        <View style={styles.categoryProgressTrack}>
                          <View
                            style={[
                              styles.categoryProgressFill,
                              {
                                width: `${Math.min(
                                  Math.max(percentage, 0),
                                  100,
                                )}%`,
                                backgroundColor: over
                                  ? COLORS.red
                                  : alert
                                    ? COLORS.orange
                                    : COLORS.green,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}
          </View>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* ================================================================
          TOP UP MODAL
      ================================================================ */}

      <Modal
        visible={showTopUp}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (!topUpSubmitting) {
            setShowTopUp(false);
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Recharger le Wallet</Text>

                <Text style={styles.modalSubtitle}>
                  Paiement Mobile Money réel
                </Text>
              </View>

              <Pressable
                disabled={topUpSubmitting}
                onPress={() => setShowTopUp(false)}
                style={styles.modalClose}
              >
                <X size={18} color={COLORS.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.realPaymentNotice}>
              <Shield size={17} color={COLORS.green} />

              <Text style={styles.realPaymentNoticeText}>
                Aucun solde ne sera ajouté avant la confirmation réelle du
                provider.
              </Text>
            </View>

            <Text style={styles.fieldLabel}>OPÉRATEUR</Text>

            <View style={styles.providerGrid}>
              {PROVIDERS.map((provider) => {
                const selected = topUpProvider === provider.id;

                return (
                  <Pressable
                    key={provider.id}
                    disabled={topUpSubmitting}
                    onPress={() => setTopUpProvider(provider.id)}
                    style={({ pressed }) => [
                      styles.providerCard,
                      selected && {
                        borderColor: provider.accent,
                        backgroundColor: `${provider.accent}18`,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.providerDot,
                        {
                          backgroundColor: provider.accent,
                        },
                      ]}
                    />

                    <Text
                      style={[
                        styles.providerLabel,
                        selected && {
                          color: provider.accent,
                        },
                      ]}
                    >
                      {provider.shortLabel}
                    </Text>

                    {selected && (
                      <CheckCircle2 size={14} color={provider.accent} />
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.fieldLabel}>NUMÉRO MOBILE MONEY</Text>

            <TextInput
              value={topUpPhone}
              onChangeText={setTopUpPhone}
              keyboardType="phone-pad"
              editable={!topUpSubmitting}
              placeholder="+243 ..."
              placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput}
            />

            <Text style={styles.fieldLabel}>MONTANT — CDF</Text>

            <View style={styles.quickAmounts}>
              {[1000, 2500, 5000, 10000].map((amount) => {
                const selected = topUpAmount === String(amount);

                return (
                  <Pressable
                    key={amount}
                    disabled={topUpSubmitting}
                    onPress={() => setTopUpAmount(String(amount))}
                    style={({ pressed }) => [
                      styles.quickAmount,
                      selected && styles.quickAmountSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.quickAmountText,
                        selected && styles.quickAmountTextSelected,
                      ]}
                    >
                      {amount.toLocaleString("fr-FR")}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={topUpAmount}
              onChangeText={setTopUpAmount}
              keyboardType="numeric"
              editable={!topUpSubmitting}
              placeholder="Montant personnalisé"
              placeholderTextColor={COLORS.textMuted}
              style={styles.modalInput}
            />

            <Pressable
              disabled={topUpSubmitting}
              onPress={() => void handleTopUp()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                topUpSubmitting && styles.disabled,
              ]}
            >
              {topUpSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Plus size={17} color="#FFFFFF" />
              )}

              <Text style={styles.primaryButtonText}>
                {topUpSubmitting
                  ? "Connexion au provider…"
                  : "Lancer la recharge"}
              </Text>
            </Pressable>

            <Text style={styles.modalFootnote}>
              Le crédit du Wallet intervient uniquement après confirmation
              serveur du paiement.
            </Text>
          </View>
        </View>
      </Modal>

      {/* ================================================================
          SEND INFORMATION
      ================================================================ */}

      <Modal
        visible={showSendInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSendInfo(false)}
      >
        <View style={styles.centerModalOverlay}>
          <View style={styles.infoModal}>
            <View style={styles.infoModalIcon}>
              <Send size={24} color={COLORS.green} />
            </View>

            <Text style={styles.infoModalTitle}>Transfert sortant</Text>

            <Text style={styles.infoModalDescription}>
              Le Payment Core actuel ne finalise pas encore les opérations
              sortantes. Le flux `peer_transfer` / retrait reste volontairement
              bloqué tant que le provider ne dispose pas d'une implémentation
              sortante complète.
            </Text>

            <View style={styles.infoSecurityBox}>
              <Shield size={16} color={COLORS.green} />

              <Text style={styles.infoSecurityText}>
                Aucun débit fictif ne sera effectué. Aucun `walletTransaction`
                completed ne sera créé pour contourner cette protection.
              </Text>
            </View>

            <Pressable
              onPress={() => setShowSendInfo(false)}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ============================================================================
// TRANSACTION ROW
// ============================================================================

function TransactionRow({
  transaction,
  expanded = false,
}: {
  transaction: {
    _id: Id<"walletTransactions">;
    type:
      | "deposit"
      | "withdrawal"
      | "transfer"
      | "payment"
      | "refund"
      | "reward";
    amount: number;
    currency: string;
    description: string;
    status: "pending" | "completed" | "failed";
    provider?:
      | "orange_money"
      | "mpesa"
      | "airtel_money"
      | "mtn_momo"
      | "internal";
    completedAt?: string;
    counterpartName?: string;
    externalReference?: string;
  };
  expanded?: boolean;
}): React.ReactElement {
  const incoming =
    transaction.type === "deposit" ||
    transaction.type === "refund" ||
    transaction.type === "reward";

  const statusColor =
    transaction.status === "completed"
      ? COLORS.green
      : transaction.status === "pending"
        ? COLORS.yellow
        : COLORS.red;

  const statusBackground =
    transaction.status === "completed"
      ? COLORS.greenSoft
      : transaction.status === "pending"
        ? COLORS.yellowSoft
        : COLORS.redSoft;

  return (
    <View style={styles.transactionCard}>
      <View
        style={[
          styles.transactionIcon,
          {
            backgroundColor: incoming ? COLORS.greenSoft : COLORS.redSoft,
          },
        ]}
      >
        {incoming ? (
          <ArrowDownLeft size={18} color={COLORS.green} />
        ) : (
          <ArrowUpRight size={18} color={COLORS.red} />
        )}
      </View>

      <View style={styles.transactionMain}>
        <Text numberOfLines={1} style={styles.transactionDescription}>
          {transaction.description}
        </Text>

        <View style={styles.transactionMeta}>
          {transaction.status === "completed" ? (
            <CheckCircle2 size={11} color={statusColor} />
          ) : transaction.status === "pending" ? (
            <Clock size={11} color={statusColor} />
          ) : (
            <AlertCircle size={11} color={statusColor} />
          )}

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusBackground,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color: statusColor,
                },
              ]}
            >
              {getStatusLabel(transaction.status)}
            </Text>
          </View>
        </View>

        {expanded && (
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionDetailText}>
              {getTransactionDate(transaction)}
              {getTransactionTime(transaction)
                ? ` · ${getTransactionTime(transaction)}`
                : ""}
            </Text>

            {transaction.provider && (
              <Text style={styles.transactionDetailText}>
                {getProviderLabel(transaction.provider)}
              </Text>
            )}

            {transaction.counterpartName && (
              <Text style={styles.transactionDetailText}>
                {transaction.counterpartName}
              </Text>
            )}

            {transaction.externalReference && (
              <Text numberOfLines={1} style={styles.transactionReference}>
                Réf. {transaction.externalReference}
              </Text>
            )}
          </View>
        )}
      </View>

      <Text
        style={[
          styles.transactionAmount,
          {
            color: incoming ? COLORS.green : COLORS.red,
          },
        ]}
      >
        {incoming ? "+" : "-"}
        {formatAmount(transaction.amount, transaction.currency)}
      </Text>
    </View>
  );
}

// ============================================================================
// EMPTY TRANSACTIONS
// ============================================================================

function EmptyTransactions(): React.ReactElement {
  return (
    <View style={styles.emptyTransactions}>
      <View style={styles.emptyTransactionsIcon}>
        <History size={30} color={COLORS.textMuted} />
      </View>

      <Text style={styles.emptyTransactionsTitle}>Aucun mouvement</Text>

      <Text style={styles.emptyTransactionsDescription}>
        Vos transactions confirmées apparaîtront ici automatiquement.
      </Text>
    </View>
  );
}

// ============================================================================
// EXPORT
// ============================================================================

export default function WalletPage({
  onBack,
}: {
  onBack: () => void;
}): React.ReactElement {
  return (
    <WalletErrorBoundary>
      <AuthLoading>
        <WalletLoading />
      </AuthLoading>

      <Unauthenticated>
        <WalletUnauthenticated onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <WalletInner onBack={onBack} />
      </Authenticated>
    </WalletErrorBoundary>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  backgroundGlowOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(16,185,129,0.045)",
    top: -120,
    right: -100,
  },

  backgroundGlowTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(99,102,241,0.04)",
    bottom: 100,
    left: -160,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 54,
    paddingHorizontal: 18,
  },

  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.45,
  },

  // --------------------------------------------------------------------------
  // LOADING
  // --------------------------------------------------------------------------

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
    paddingHorizontal: 30,
  },

  loadingLogo: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
  },

  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },

  // --------------------------------------------------------------------------
  // ERROR
  // --------------------------------------------------------------------------

  errorScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  errorIcon: {
    width: 70,
    height: 70,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.redSoft,
    marginBottom: 20,
  },

  errorTitle: {
    color: COLORS.text,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  errorDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },

  // --------------------------------------------------------------------------
  // UNAUTHENTICATED
  // --------------------------------------------------------------------------

  unauthenticatedScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  backButton: {
    position: "absolute",
    top: 54,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  unauthenticatedIcon: {
    width: 86,
    height: 86,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },

  unauthenticatedTitle: {
    color: COLORS.text,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  unauthenticatedDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 330,
  },

  // --------------------------------------------------------------------------
  // HEADER
  // --------------------------------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  headerSubtitle: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },

  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  secureText: {
    color: COLORS.green,
    fontSize: 9,
    fontWeight: "800",
  },

  // --------------------------------------------------------------------------
  // MULTI CURRENCY
  // --------------------------------------------------------------------------

  multiCurrencyNotice: {
    flexDirection: "row",
    gap: 11,
    padding: 13,
    borderRadius: 17,
    backgroundColor: COLORS.blueSoft,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.15)",
    marginBottom: 14,
  },

  multiCurrencyTextContainer: {
    flex: 1,
  },

  multiCurrencyTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 3,
  },

  multiCurrencyDescription: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  // --------------------------------------------------------------------------
  // BALANCE
  // --------------------------------------------------------------------------

  balanceCard: {
    minHeight: 220,
    borderRadius: 28,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    overflow: "hidden",
    marginBottom: 16,
  },

  balanceCardGlow: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(16,185,129,0.055)",
    right: -65,
    top: -65,
  },

  balanceTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 27,
  },

  balanceBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  walletMiniIcon: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
  },

  balanceBrandTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },

  balanceBrandSubtitle: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 2,
  },

  protectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  protectedText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  balanceLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  balanceValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  balanceValue: {
    flexShrink: 1,
    color: COLORS.text,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -1.1,
  },

  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.09)",
  },

  currencyLine: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },

  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  currencyPillText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "700",
  },

  balanceFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 28,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.07)",
  },

  balanceFooterDivider: {
    width: 1,
    height: 30,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: 20,
  },

  balanceFooterLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 4,
  },

  balanceFooterValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  incomeValue: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: "800",
  },

  expenseValue: {
    color: COLORS.red,
    fontSize: 11,
    fontWeight: "800",
  },

  // --------------------------------------------------------------------------
  // ACTIONS
  // --------------------------------------------------------------------------

  actionsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },

  actionCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
  },

  actionGreen: {
    backgroundColor: COLORS.greenSoft,
    borderColor: "rgba(16,185,129,0.15)",
  },

  actionBlue: {
    backgroundColor: COLORS.blueSoft,
    borderColor: "rgba(59,130,246,0.15)",
  },

  actionPurple: {
    backgroundColor: COLORS.purpleSoft,
    borderColor: "rgba(139,92,246,0.15)",
  },

  actionOrange: {
    backgroundColor: COLORS.orangeSoft,
    borderColor: "rgba(249,115,22,0.15)",
  },

  actionIcon: {
    marginBottom: 7,
  },

  actionLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },

  // --------------------------------------------------------------------------
  // TABS
  // --------------------------------------------------------------------------

  tabsContainer: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 22,
  },

  tab: {
    flex: 1,
    minHeight: 37,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  tabSelected: {
    backgroundColor: COLORS.greenSoft,
  },

  tabText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "700",
  },

  tabTextSelected: {
    color: COLORS.green,
  },

  // --------------------------------------------------------------------------
  // SECTIONS
  // --------------------------------------------------------------------------

  section: {
    gap: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionEyebrow: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.4,
  },

  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginTop: 4,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: COLORS.greenSoft,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.green,
  },

  liveText: {
    color: COLORS.green,
    fontSize: 8,
    fontWeight: "900",
  },

  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },

  statCard: {
    flex: 1,
    minHeight: 115,
    borderRadius: 20,
    padding: 14,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  statValue: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  statLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 4,
  },

  realDataCard: {
    flexDirection: "row",
    gap: 12,
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.14)",
  },

  realDataIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.1)",
  },

  realDataContent: {
    flex: 1,
  },

  realDataTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 4,
  },

  realDataDescription: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 15,
  },

  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },

  seeAll: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "800",
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
  },

  countBadgeText: {
    color: COLORS.green,
    fontSize: 10,
    fontWeight: "900",
  },

  // --------------------------------------------------------------------------
  // LOADING PANELS
  // --------------------------------------------------------------------------

  inlineLoading: {
    minHeight: 90,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  inlineLoadingText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  loadingPanel: {
    minHeight: 180,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  loadingPanelText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },

  // --------------------------------------------------------------------------
  // TRANSACTIONS
  // --------------------------------------------------------------------------

  transactionList: {
    gap: 8,
  },

  transactionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 17,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionMain: {
    flex: 1,
    minWidth: 0,
  },

  transactionDescription: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 5,
  },

  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },

  statusText: {
    fontSize: 7,
    fontWeight: "900",
  },

  transactionDetails: {
    marginTop: 6,
    gap: 2,
  },

  transactionDetailText: {
    color: COLORS.textMuted,
    fontSize: 8,
  },

  transactionReference: {
    color: COLORS.textMuted,
    fontSize: 8,
  },

  transactionAmount: {
    fontSize: 10,
    fontWeight: "900",
    flexShrink: 0,
  },

  // --------------------------------------------------------------------------
  // EMPTY
  // --------------------------------------------------------------------------

  emptyTransactions: {
    minHeight: 190,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTransactionsIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 13,
  },

  emptyTransactionsTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 5,
  },

  emptyTransactionsDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },

  // --------------------------------------------------------------------------
  // BUDGET
  // --------------------------------------------------------------------------

  emptyBudgetCard: {
    minHeight: 310,
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyBudgetIcon: {
    width: 68,
    height: 68,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.purpleSoft,
    marginBottom: 17,
  },

  emptyBudgetTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 7,
  },

  emptyBudgetDescription: {
    color: COLORS.textMuted,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
    maxWidth: 290,
    marginBottom: 20,
  },

  budgetSummary: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    padding: 18,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  budgetSummaryLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  budgetSummaryValue: {
    color: COLORS.text,
    fontSize: 23,
    fontWeight: "900",
  },

  budgetSummarySecondary: {
    color: COLORS.textMuted,
    fontSize: 9,
    marginTop: 3,
  },

  budgetRemaining: {
    alignItems: "flex-end",
  },

  budgetRemainingLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 5,
  },

  budgetRemainingValue: {
    fontSize: 15,
    fontWeight: "900",
  },

  budgetProgressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  budgetProgressFill: {
    height: "100%",
    borderRadius: 8,
  },

  categoryTitle: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.3,
    marginTop: 5,
  },

  categoryList: {
    gap: 8,
  },

  categoryCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  categoryCardOver: {
    backgroundColor: COLORS.redSoft,
    borderColor: "rgba(239,68,68,0.18)",
  },

  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  categoryIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
  },

  categoryDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.green,
  },

  categoryName: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },

  categoryAmounts: {
    color: COLORS.textMuted,
    fontSize: 8,
    marginTop: 3,
  },

  categoryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  overBudgetBadge: {
    color: COLORS.red,
    fontSize: 7,
    fontWeight: "900",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: COLORS.redSoft,
  },

  categoryInput: {
    width: 76,
    height: 31,
    borderRadius: 9,
    paddingHorizontal: 8,
    color: COLORS.text,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    fontSize: 10,
    textAlign: "right",
  },

  categoryProgressTrack: {
    height: 6,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },

  categoryProgressFill: {
    height: "100%",
    borderRadius: 6,
  },

  // --------------------------------------------------------------------------
  // PRIMARY BUTTON
  // --------------------------------------------------------------------------

  primaryButton: {
    minHeight: 49,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 18,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.18)",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  // --------------------------------------------------------------------------
  // MODAL
  // --------------------------------------------------------------------------

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  modalCard: {
    maxHeight: "92%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  modalHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 18,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 3,
  },

  modalClose: {
    width: 35,
    height: 35,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
  },

  realPaymentNotice: {
    flexDirection: "row",
    gap: 9,
    padding: 11,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoft,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.13)",
    marginBottom: 18,
  },

  realPaymentNoticeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
    marginBottom: 7,
    marginTop: 3,
  },

  providerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 13,
  },

  providerCard: {
    width: "48%",
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  providerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  providerLabel: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },

  modalInput: {
    minHeight: 47,
    borderRadius: 14,
    paddingHorizontal: 14,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    fontSize: 12,
    marginBottom: 11,
  },

  quickAmounts: {
    flexDirection: "row",
    gap: 7,
    marginBottom: 8,
  },

  quickAmount: {
    flex: 1,
    minHeight: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  quickAmountSelected: {
    backgroundColor: COLORS.purpleSoft,
    borderColor: "rgba(139,92,246,0.4)",
  },

  quickAmountText: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: "800",
  },

  quickAmountTextSelected: {
    color: COLORS.purple,
  },

  modalFootnote: {
    color: COLORS.textMuted,
    fontSize: 8,
    lineHeight: 13,
    textAlign: "center",
    marginTop: 9,
  },

  // --------------------------------------------------------------------------
  // INFO MODAL
  // --------------------------------------------------------------------------

  centerModalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  infoModal: {
    width: "100%",
    borderRadius: 26,
    padding: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  infoModalIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.greenSoft,
    marginBottom: 16,
  },

  infoModalTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 8,
  },

  infoModalDescription: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
    marginBottom: 15,
  },

  infoSecurityBox: {
    flexDirection: "row",
    gap: 9,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.greenSoft,
    marginBottom: 17,
  },

  infoSecurityText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 9,
    lineHeight: 14,
  },

  bottomSpace: {
    height: 45,
  },
});

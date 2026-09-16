import React, { useMemo, useState } from "react";

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
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Banknote,
  Check,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Heart,
  Info,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Shield,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react-native";

import { useQuery } from "convex/react";

import { Clipboard } from "@react-native-clipboard/clipboard";

import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

import { api } from "@/convex/_generated/api.js";

import { Skeleton } from "@/components/ui/skeleton.tsx";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type TransactionFilter =
  | "all"
  | "incoming"
  | "outgoing"
  | "recharge"
  | "payment";

type TransactionRecord = {
  _id: string;
  type?: string;
  amount: number;
  currency?: string;
  description?: string;
  completedAt?: number;
  createdAt?: number;
};

type WalletSnapshot = {
  balance?: number;
  monthIn?: number;
  monthOut?: number;
  currency?: string;
};

/* ============================================================================
 * DESIGN
 * ========================================================================== */

const COLORS = {
  background: "#050812",
  surface: "rgba(255,255,255,0.045)",
  surfaceStrong: "rgba(255,255,255,0.065)",
  border: "rgba(255,255,255,0.075)",
  borderStrong: "rgba(255,255,255,0.11)",

  white: "#FFFFFF",
  text: "#E4E4E7",
  muted: "#71717A",
  muted2: "#52525B",

  green: "#10B981",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  orange: "#F97316",
  red: "#EF4444",
};

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getCurrency(currency?: string): string {
  const value = typeof currency === "string" ? currency.trim() : "";

  return value || "—";
}

function formatMoney(amount: number, currency?: string): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const safeCurrency = getCurrency(currency);

  return `${Math.abs(safeAmount).toLocaleString("fr-FR")} ${safeCurrency}`;
}

function formatCompactMoney(amount: number, currency?: string): string {
  const safeAmount = Math.abs(Number.isFinite(amount) ? amount : 0);

  const code = getCurrency(currency);

  if (safeAmount >= 1_000_000) {
    return `${(safeAmount / 1_000_000).toFixed(1)} M ${code}`;
  }

  if (safeAmount >= 1_000) {
    return `${(safeAmount / 1_000).toFixed(1)} k ${code}`;
  }

  return formatMoney(safeAmount, code);
}

function formatDate(value?: number): string {
  if (!value || !Number.isFinite(value)) {
    return "Date indisponible";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date indisponible";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function normalizeTransactionType(type?: string): TransactionFilter {
  switch (type) {
    case "deposit":
    case "reward":
    case "refund":
      return "incoming";

    case "withdrawal":
    case "transfer":
      return "outgoing";

    case "payment":
      return "payment";

    default:
      return "outgoing";
  }
}

function isIncoming(type?: string): boolean {
  return type === "deposit" || type === "reward" || type === "refund";
}

/* ============================================================================
 * FILTERS
 * ========================================================================== */

const FILTERS: Array<{
  key: TransactionFilter;
  label: string;
}> = [
  {
    key: "all",
    label: "Tout",
  },
  {
    key: "incoming",
    label: "Reçus",
  },
  {
    key: "outgoing",
    label: "Envois",
  },
  {
    key: "recharge",
    label: "Recharges",
  },
  {
    key: "payment",
    label: "Paiements",
  },
];

/* ============================================================================
 * TRANSACTION ICON
 * ========================================================================== */

function TransactionIcon({ type }: { type?: string }) {
  const incoming = isIncoming(type);

  let icon = <Send size={16} color={COLORS.blue} />;

  if (type === "deposit") {
    icon = <ArrowDownLeft size={16} color={COLORS.green} />;
  }

  if (type === "withdrawal") {
    icon = <ArrowUpRight size={16} color={COLORS.red} />;
  }

  if (type === "payment") {
    icon = <Banknote size={16} color={COLORS.purple} />;
  }

  if (type === "reward") {
    icon = <Heart size={16} color={COLORS.orange} />;
  }

  if (type === "refund") {
    icon = <RefreshCw size={16} color={COLORS.green} />;
  }

  return (
    <View
      style={[
        styles.transactionIcon,
        {
          backgroundColor: incoming
            ? "rgba(16,185,129,0.09)"
            : "rgba(59,130,246,0.09)",
        },
      ]}
    >
      {icon}
    </View>
  );
}

/* ============================================================================
 * ACTION CARD
 * ========================================================================== */

function WalletAction({
  icon,
  title,
  subtitle,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.walletAction, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.walletActionIcon,
          {
            backgroundColor: `${color}12`,
          },
        ]}
      >
        {icon}
      </View>

      <Text numberOfLines={1} style={styles.walletActionTitle}>
        {title}
      </Text>

      <Text numberOfLines={1} style={styles.walletActionSubtitle}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

/* ============================================================================
 * WALLET HEADER
 * ========================================================================== */

function WalletHeader({
  onBack,
  balanceVisible,
  onToggleBalance,
  onReceive,
}: {
  onBack: () => void;
  balanceVisible: boolean;
  onToggleBalance: () => void;
  onReceive: () => void;
}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerIdentity}>
        <View style={styles.walletLogo}>
          <Wallet size={18} color={COLORS.green} strokeWidth={2.2} />
        </View>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>DébrouillePay</Text>

          <Text style={styles.headerSubtitle}>
            Paiements · Wallet · Finance
          </Text>
        </View>
      </View>

      <View style={styles.headerActions}>
        <Pressable onPress={onToggleBalance} style={styles.headerAction}>
          {balanceVisible ? (
            <Eye size={16} color="#A1A1AA" />
          ) : (
            <EyeOff size={16} color="#A1A1AA" />
          )}
        </Pressable>

        <Pressable
          onPress={onReceive}
          style={[styles.headerAction, styles.receiveHeaderAction]}
        >
          <QrCode size={16} color="#60A5FA" />
        </Pressable>
      </View>
    </View>
  );
}

/* ============================================================================
 * BALANCE CARD
 * ========================================================================== */

function BalanceCard({
  wallet,
  transactions,
  balanceVisible,
  onSend,
  onReceive,
  onTopup,
}: {
  wallet: WalletSnapshot | null | undefined;

  transactions: TransactionRecord[] | undefined;

  balanceVisible: boolean;

  onSend: () => void;
  onReceive: () => void;
  onTopup: () => void;
}) {
  const balance = Number(wallet?.balance ?? 0);

  const monthIn = Number(wallet?.monthIn ?? 0);

  const monthOut = Number(wallet?.monthOut ?? 0);

  const currency =
    wallet?.currency ||
    transactions?.find((tx) => Boolean(tx.currency))?.currency ||
    undefined;

  return (
    <View style={styles.balanceCard}>
      <View style={styles.balanceGlow} />

      <View style={styles.balanceTop}>
        <View>
          <View style={styles.balanceLabelRow}>
            <Text style={styles.balanceLabel}>Solde disponible</Text>

            <View style={styles.secureBadge}>
              <Shield size={10} color={COLORS.green} />

              <Text style={styles.secureBadgeText}>Ledger</Text>
            </View>
          </View>

          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            style={styles.balanceValue}
          >
            {balanceVisible ? formatMoney(balance, currency) : "••••••••"}
          </Text>
        </View>

        <View style={styles.currencyBadge}>
          <Globe size={12} color="#60A5FA" />

          <Text style={styles.currencyBadgeText}>{getCurrency(currency)}</Text>
        </View>
      </View>

      <View style={styles.balanceDivider} />

      <View style={styles.monthStats}>
        <View style={styles.monthStat}>
          <View
            style={[
              styles.monthStatIcon,
              {
                backgroundColor: "rgba(16,185,129,0.11)",
              },
            ]}
          >
            <TrendingUp size={12} color={COLORS.green} />
          </View>

          <View>
            <Text style={styles.monthStatLabel}>Entrées</Text>

            <Text style={styles.monthStatValue}>
              {formatCompactMoney(monthIn, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.monthSeparator} />

        <View style={styles.monthStat}>
          <View
            style={[
              styles.monthStatIcon,
              {
                backgroundColor: "rgba(239,68,68,0.10)",
              },
            ]}
          >
            <TrendingDown size={12} color={COLORS.red} />
          </View>

          <View>
            <Text style={styles.monthStatLabel}>Sorties</Text>

            <Text style={styles.monthStatValue}>
              {formatCompactMoney(monthOut, currency)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionGrid}>
        <WalletAction
          icon={<Send size={16} color={COLORS.green} />}
          title="Envoyer"
          subtitle="Transfert"
          color={COLORS.green}
          onPress={onSend}
        />

        <WalletAction
          icon={<ArrowDownLeft size={17} color={COLORS.blue} />}
          title="Recevoir"
          subtitle="Identifiant"
          color={COLORS.blue}
          onPress={onReceive}
        />

        <WalletAction
          icon={<RefreshCw size={16} color={COLORS.purple} />}
          title="Recharger"
          subtitle="Mobile Money"
          color={COLORS.purple}
          onPress={onTopup}
        />
      </View>
    </View>
  );
}

/* ============================================================================
 * TRANSACTION ITEM
 * ========================================================================== */

function TransactionItem({ transaction }: { transaction: TransactionRecord }) {
  const incoming = isIncoming(transaction.type);

  const amount = Number(transaction.amount ?? 0);

  const currency = transaction.currency;

  return (
    <View style={styles.transactionItem}>
      <TransactionIcon type={transaction.type} />

      <View style={styles.transactionMiddle}>
        <Text numberOfLines={1} style={styles.transactionTitle}>
          {transaction.description || transaction.type || "Transaction"}
        </Text>

        <View style={styles.transactionMeta}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>
              {transaction.type || "transaction"}
            </Text>
          </View>

          <Clock size={10} color="#3F3F46" />

          <Text numberOfLines={1} style={styles.transactionDate}>
            {formatDate(transaction.completedAt ?? transaction.createdAt)}
          </Text>
        </View>
      </View>

      <View style={styles.transactionAmountWrap}>
        <Text
          style={[
            styles.transactionAmount,
            {
              color: incoming ? COLORS.green : COLORS.red,
            },
          ]}
        >
          {incoming ? "+" : "-"}
          {formatMoney(amount, currency)}
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * RECEIVE MODAL
 * ========================================================================== */

function ReceiveModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  /*
   * Aucun identifiant de wallet n'est actuellement retourné par
   * getWalletBalance dans le contrat fourni.
   *
   * On ne fabrique donc ni téléphone, ni adresse, ni QR code.
   */
  const copyUnavailable = () => {
    Clipboard.setString("").catch(() => {});

    setCopied(true);

    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Recevoir un paiement</Text>

              <Text style={styles.sheetSubtitle}>Identité de paiement</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          <View style={styles.unavailablePanel}>
            <View style={styles.unavailableIcon}>
              <QrCode size={27} color="#60A5FA" />
            </View>

            <Text style={styles.unavailableTitle}>
              Identifiant de réception non exposé par le backend
            </Text>

            <Text style={styles.unavailableText}>
              Le contrat actuellement fourni à l'application retourne le solde
              et les transactions, mais pas encore d'adresse de wallet, de
              numéro de réception ou de payload QR.
            </Text>

            <View style={styles.integrityPanel}>
              <Shield size={15} color={COLORS.green} />

              <Text style={styles.integrityPanelText}>
                Aucun QR code fictif, numéro téléphonique ou identifiant
                financier n'est généré.
              </Text>
            </View>

            <Pressable
              onPress={copyUnavailable}
              style={styles.disabledLikeButton}
            >
              {copied ? (
                <Check size={15} color={COLORS.green} />
              ) : (
                <Copy size={15} color="#71717A" />
              )}

              <Text style={styles.disabledLikeText}>
                {copied
                  ? "Aucun identifiant à copier"
                  : "Identifiant non disponible"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * PAYMENT ACTION MODAL
 * ========================================================================== */

function BackendActionModal({
  visible,
  onClose,
  mode,
}: {
  visible: boolean;
  onClose: () => void;
  mode: "send" | "topup";
}) {
  const isSend = mode === "send";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.modalSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>
                {isSend ? "Envoyer de l'argent" : "Recharger le wallet"}
              </Text>

              <Text style={styles.sheetSubtitle}>DébrouillePay</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          <View style={styles.actionUnavailable}>
            <View
              style={[
                styles.actionUnavailableIcon,
                {
                  backgroundColor: isSend
                    ? "rgba(16,185,129,0.08)"
                    : "rgba(139,92,246,0.08)",
                },
              ]}
            >
              {isSend ? (
                <Send size={24} color={COLORS.green} />
              ) : (
                <RefreshCw size={24} color={COLORS.purple} />
              )}
            </View>

            <Text style={styles.actionUnavailableTitle}>
              Opération financière en attente d'un contrat de paiement réel
            </Text>

            <Text style={styles.actionUnavailableText}>
              Le backend actuellement exposé à cette page possède une mutation
              de journalisation de wallet, mais ne fournit pas ici de contrat
              complet permettant de réaliser un transfert externe ou une
              recharge Mobile Money.
            </Text>

            <View style={styles.securityNotice}>
              <Shield size={15} color={COLORS.green} />

              <Text style={styles.securityNoticeText}>
                Pour éviter une fausse transaction, cette version ne modifie pas
                le solde lorsqu'un paiement réel n'a pas été confirmé par le
                prestataire.
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closePrimaryButton}>
              <Text style={styles.closePrimaryButtonText}>Compris</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * SEARCH / FILTER BAR
 * ========================================================================== */

function TransactionToolbar({
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: {
  filter: TransactionFilter;
  onFilterChange: (value: TransactionFilter) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <>
      <View style={styles.searchBox}>
        <Search size={15} color="#52525B" />

        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Rechercher une transaction…"
          placeholderTextColor="#52525B"
          style={styles.searchInput}
        />

        {search.length > 0 ? (
          <Pressable onPress={() => onSearchChange("")}>
            <X size={14} color="#71717A" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map(({ key, label }) => {
          const active = filter === key;

          return (
            <Pressable
              key={key}
              onPress={() => onFilterChange(key)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterText, active && styles.filterTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </>
  );
}

/* ============================================================================
 * MAIN AUTHENTICATED
 * ========================================================================== */

function PaiementInner({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState<TransactionFilter>("all");

  const [search, setSearch] = useState("");

  const [balanceVisible, setBalanceVisible] = useState(true);

  const [showReceive, setShowReceive] = useState(false);

  const [actionMode, setActionMode] = useState<"send" | "topup" | null>(null);

  const walletQuery = useQuery(api.finances.getWalletBalance, {});

  const transactionsQuery = useQuery(api.finances.getWalletTransactions, {
    limit: 30,
  });

  const transactions = (transactionsQuery ?? []) as TransactionRecord[];

  const wallet = walletQuery as WalletSnapshot | null | undefined;

  const filteredTransactions = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return transactions.filter((tx) => {
      const transactionFilter = normalizeTransactionType(tx.type);

      const matchesFilter = filter === "all" || transactionFilter === filter;

      if (!matchesFilter) {
        return false;
      }

      if (normalized.length === 0) {
        return true;
      }

      const haystack = [tx.description, tx.type, tx.currency]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalized);
    });
  }, [transactions, filter, search]);

  const currency =
    wallet?.currency ||
    transactions.find((tx) => Boolean(tx.currency))?.currency;

  return (
    <View style={styles.screen}>
      <WalletHeader
        onBack={onBack}
        balanceVisible={balanceVisible}
        onToggleBalance={() => setBalanceVisible((value) => !value)}
        onReceive={() => setShowReceive(true)}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          wallet={wallet}
          transactions={transactions}
          balanceVisible={balanceVisible}
          onSend={() => setActionMode("send")}
          onReceive={() => setShowReceive(true)}
          onTopup={() => setActionMode("topup")}
        />

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Activité financière</Text>

            <Text style={styles.sectionSubtitle}>
              Les opérations retournées par votre wallet.
            </Text>
          </View>

          <View style={styles.secureLabel}>
            <Shield size={11} color={COLORS.green} />

            <Text style={styles.secureLabelText}>Sécurisé</Text>
          </View>
        </View>

        <TransactionToolbar
          filter={filter}
          onFilterChange={setFilter}
          search={search}
          onSearchChange={setSearch}
        />

        <View style={styles.transactionCountRow}>
          <Text style={styles.transactionCount}>
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""}
          </Text>

          {currency ? (
            <View style={styles.currencySmallBadge}>
              <Globe size={10} color="#71717A" />

              <Text style={styles.currencySmallBadgeText}>{currency}</Text>
            </View>
          ) : null}
        </View>

        {transactionsQuery === undefined ? (
          <View style={styles.loadingTransactions}>
            <ActivityIndicator size="small" color={COLORS.green} />

            <Text style={styles.loadingText}>Chargement du wallet…</Text>
          </View>
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyTransactions}>
            <View style={styles.emptyIcon}>
              <Wallet size={26} color="#3F3F46" />
            </View>

            <Text style={styles.emptyTitle}>Aucune transaction</Text>

            <Text style={styles.emptyText}>
              {search.trim()
                ? "Aucune opération ne correspond à votre recherche."
                : "Aucune transaction n'est retournée par votre wallet."}
            </Text>
          </View>
        ) : (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction) => (
              <TransactionItem
                key={transaction._id}
                transaction={transaction}
              />
            ))}
          </View>
        )}

        <View style={styles.financialIntegrity}>
          <View style={styles.financialIntegrityIcon}>
            <Shield size={15} color={COLORS.green} />
          </View>

          <View style={styles.financialIntegrityBody}>
            <Text style={styles.financialIntegrityTitle}>
              Intégrité financière
            </Text>

            <Text style={styles.financialIntegrityText}>
              Le solde et l'historique affichés sont issus des fonctions Convex
              actuellement connectées. Cette interface ne simule pas de
              paiement, de recharge ou de transfert.
            </Text>
          </View>
        </View>

        <View style={styles.globalArchitecture}>
          <Globe size={16} color="#60A5FA" />

          <View style={styles.globalArchitectureBody}>
            <Text style={styles.globalArchitectureTitle}>
              DébrouillePay — architecture mondiale
            </Text>

            <Text style={styles.globalArchitectureText}>
              Les paiements internationaux doivent être traités avec des
              devises, opérateurs, rails de paiement, contrôles de conformité et
              statuts de transaction fournis par le backend. Aucun pays n'est
              imposé dans cette interface.
            </Text>
          </View>
        </View>
      </ScrollView>

      <ReceiveModal
        visible={showReceive}
        onClose={() => setShowReceive(false)}
      />

      {actionMode ? (
        <BackendActionModal
          visible
          mode={actionMode}
          onClose={() => setActionMode(null)}
        />
      ) : null}
    </View>
  );
}

/* ============================================================================
 * ROOT
 * ========================================================================== */

export default function PaiementPage({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <AuthLoading>
        <View style={styles.authLoading}>
          <Skeleton className="h-12 w-full rounded-xl" />

          <Skeleton className="h-48 w-full rounded-3xl" />

          <Skeleton className="h-20 w-full rounded-2xl" />
        </View>
      </AuthLoading>

      <Unauthenticated>
        <View style={styles.unauthenticated}>
          <Pressable onPress={onBack} style={styles.unauthenticatedBack}>
            <ArrowLeft size={18} color="#FFFFFF" />
          </Pressable>

          <View style={styles.unauthenticatedIcon}>
            <Wallet size={35} color="#71717A" />
          </View>

          <Text style={styles.unauthenticatedTitle}>DébrouillePay</Text>

          <Text style={styles.unauthenticatedText}>
            Connectez-vous pour accéder à votre wallet et à votre historique
            financier.
          </Text>
        </View>
      </Unauthenticated>

      <Authenticated>
        <PaiementInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* HEADER */

  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  headerIdentity: {
    flex: 1,
    marginLeft: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  walletLogo: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  headerTitles: {
    marginLeft: 9,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: -0.3,
  },

  headerSubtitle: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 7.5,
    fontWeight: "700",
  },

  headerActions: {
    flexDirection: "row",
    gap: 6,
  },

  headerAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  receiveHeaderAction: {
    backgroundColor: "rgba(59,130,246,0.07)",
    borderColor: "rgba(59,130,246,0.14)",
  },

  /* CONTENT */

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 42,
  },

  /* BALANCE */

  balanceCard: {
    position: "relative",
    overflow: "hidden",
    padding: 16,
    borderRadius: 23,
    backgroundColor: "rgba(16,185,129,0.055)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.18)",
  },

  balanceGlow: {
    position: "absolute",
    width: 190,
    height: 190,
    right: -85,
    top: -95,
    borderRadius: 95,
    backgroundColor: "rgba(16,185,129,0.06)",
  },

  balanceTop: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  balanceLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  balanceLabel: {
    color: "rgba(167,243,208,0.58)",
    fontSize: 8,
    fontWeight: "800",
  },

  secureBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  secureBadgeText: {
    color: "rgba(110,231,183,0.72)",
    fontSize: 6,
    fontWeight: "900",
  },

  balanceValue: {
    marginTop: 7,
    maxWidth: 245,
    color: COLORS.white,
    fontSize: 27,
    fontWeight: "900",
    letterSpacing: -1,
  },

  currencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(59,130,246,0.07)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.12)",
  },

  currencyBadgeText: {
    color: "#93C5FD",
    fontSize: 7,
    fontWeight: "900",
  },

  balanceDivider: {
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  monthStats: {
    flexDirection: "row",
    alignItems: "center",
  },

  monthStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  monthStatIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  monthStatLabel: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: "700",
  },

  monthStatValue: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 9,
    fontWeight: "900",
  },

  monthSeparator: {
    width: 1,
    height: 31,
    marginHorizontal: 8,
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  actionGrid: {
    marginTop: 13,
    flexDirection: "row",
    gap: 7,
  },

  walletAction: {
    flex: 1,
    minHeight: 70,
    paddingHorizontal: 5,
    paddingVertical: 9,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  walletActionIcon: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  walletActionTitle: {
    marginTop: 5,
    color: COLORS.text,
    fontSize: 7.5,
    fontWeight: "900",
  },

  walletActionSubtitle: {
    marginTop: 2,
    color: COLORS.muted2,
    fontSize: 6.5,
    fontWeight: "600",
  },

  /* SECTION */

  sectionHeader: {
    marginTop: 17,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "900",
  },

  sectionSubtitle: {
    marginTop: 3,
    color: COLORS.muted2,
    fontSize: 7.5,
    fontWeight: "600",
  },

  secureLabel: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16,185,129,0.06)",
  },

  secureLabelText: {
    color: "rgba(110,231,183,0.75)",
    fontSize: 6.5,
    fontWeight: "900",
  },

  /* SEARCH */

  searchBox: {
    minHeight: 41,
    paddingHorizontal: 11,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  searchInput: {
    flex: 1,
    marginLeft: 7,
    padding: 0,
    color: COLORS.white,
    fontSize: 8.5,
    fontWeight: "600",
  },

  filterRow: {
    paddingVertical: 8,
    gap: 6,
  },

  filterChip: {
    minHeight: 30,
    paddingHorizontal: 11,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  filterChipActive: {
    backgroundColor: "rgba(16,185,129,0.10)",
    borderColor: "rgba(16,185,129,0.20)",
  },

  filterText: {
    color: COLORS.muted,
    fontSize: 7.5,
    fontWeight: "800",
  },

  filterTextActive: {
    color: "#6EE7B7",
  },

  transactionCountRow: {
    marginBottom: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  transactionCount: {
    color: COLORS.muted2,
    fontSize: 7,
    fontWeight: "800",
  },

  currencySmallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  currencySmallBadgeText: {
    color: COLORS.muted,
    fontSize: 6.5,
    fontWeight: "800",
  },

  /* TRANSACTIONS */

  transactionList: {
    gap: 7,
  },

  transactionItem: {
    minHeight: 65,
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  transactionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  transactionMiddle: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },

  transactionTitle: {
    color: COLORS.text,
    fontSize: 8.5,
    fontWeight: "800",
  },

  transactionMeta: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  typeBadge: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  typeBadgeText: {
    color: COLORS.muted,
    fontSize: 5.8,
    fontWeight: "800",
  },

  transactionDate: {
    flexShrink: 1,
    color: "#3F3F46",
    fontSize: 6.8,
    fontWeight: "600",
  },

  transactionAmountWrap: {
    marginLeft: 7,
    alignItems: "flex-end",
  },

  transactionAmount: {
    fontSize: 8.5,
    fontWeight: "900",
  },

  /* EMPTY */

  loadingTransactions: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 8,
    color: COLORS.muted2,
    fontSize: 8,
    fontWeight: "700",
  },

  emptyTransactions: {
    minHeight: 190,
    paddingHorizontal: 25,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 63,
    height: 63,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  emptyTitle: {
    marginTop: 11,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "900",
  },

  emptyText: {
    maxWidth: 270,
    marginTop: 5,
    color: COLORS.muted2,
    fontSize: 7.5,
    lineHeight: 12,
    textAlign: "center",
  },

  /* INTEGRITY */

  financialIntegrity: {
    marginTop: 12,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(16,185,129,0.035)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.085)",
  },

  financialIntegrityIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,185,129,0.08)",
  },

  financialIntegrityBody: {
    flex: 1,
    marginLeft: 8,
  },

  financialIntegrityTitle: {
    color: "#6EE7B7",
    fontSize: 8,
    fontWeight: "900",
  },

  financialIntegrityText: {
    marginTop: 3,
    color: "#52525B",
    fontSize: 7,
    lineHeight: 12,
  },

  globalArchitecture: {
    marginTop: 9,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(59,130,246,0.035)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.08)",
  },

  globalArchitectureBody: {
    flex: 1,
    marginLeft: 7,
  },

  globalArchitectureTitle: {
    color: "#93C5FD",
    fontSize: 8,
    fontWeight: "900",
  },

  globalArchitectureText: {
    marginTop: 3,
    color: "#475569",
    fontSize: 7,
    lineHeight: 12,
  },

  /* MODALS */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.78)",
  },

  modalSheet: {
    maxHeight: "90%",
    paddingBottom: 28,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#090D19",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.085)",
  },

  sheetHandle: {
    width: 40,
    height: 4,
    marginTop: 9,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    minHeight: 63,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  sheetTitle: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "900",
  },

  sheetSubtitle: {
    marginTop: 3,
    color: COLORS.muted2,
    fontSize: 7,
    fontWeight: "700",
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  /* RECEIVE */

  unavailablePanel: {
    margin: 15,
    padding: 18,
    borderRadius: 20,
    alignItems: "center",
    backgroundColor: "rgba(59,130,246,0.035)",
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.08)",
  },

  unavailableIcon: {
    width: 63,
    height: 63,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(59,130,246,0.08)",
  },

  unavailableTitle: {
    marginTop: 13,
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  unavailableText: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 14,
    textAlign: "center",
  },

  integrityPanel: {
    width: "100%",
    marginTop: 14,
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(16,185,129,0.045)",
  },

  integrityPanelText: {
    flex: 1,
    marginLeft: 7,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  disabledLikeButton: {
    width: "100%",
    minHeight: 43,
    marginTop: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  disabledLikeText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: "800",
  },

  /* ACTION */

  actionUnavailable: {
    padding: 18,
    alignItems: "center",
  },

  actionUnavailableIcon: {
    width: 63,
    height: 63,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

  actionUnavailableTitle: {
    marginTop: 13,
    color: COLORS.text,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },

  actionUnavailableText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 8,
    lineHeight: 14,
    textAlign: "center",
  },

  securityNotice: {
    width: "100%",
    marginTop: 14,
    padding: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(16,185,129,0.045)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.08)",
  },

  securityNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#64748B",
    fontSize: 7.5,
    lineHeight: 12,
  },

  closePrimaryButton: {
    width: "100%",
    minHeight: 45,
    marginTop: 14,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.green,
  },

  closePrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  /* AUTH */

  authLoading: {
    flex: 1,
    padding: 16,
    gap: 12,
  },

  unauthenticated: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  unauthenticatedBack: {
    position: "absolute",
    top: 14,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  unauthenticatedIcon: {
    width: 78,
    height: 78,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  unauthenticatedTitle: {
    marginTop: 15,
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "900",
  },

  unauthenticatedText: {
    maxWidth: 290,
    marginTop: 6,
    color: COLORS.muted2,
    fontSize: 8.5,
    lineHeight: 14,
    textAlign: "center",
  },
});

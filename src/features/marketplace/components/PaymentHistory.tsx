// src/features/marketplace/components/PaymentHistory.tsx

import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react-native";

interface Payment {
  id: string;
  date: Date;
  amount: number;
  currency: string;
  type: "payment" | "refund" | "deposit" | "withdrawal";
  status: "pending" | "completed" | "failed" | "cancelled";
  description: string;
  reference?: string;
}

type PaymentFilter = "all" | "payment" | "refund" | "deposit" | "withdrawal";

type SortOrder = "desc" | "asc";

const MOCK_PAYMENTS: Payment[] = [
  {
    id: "1",
    date: new Date(2025, 6, 15),
    amount: 15000,
    currency: "XAF",
    type: "payment",
    status: "completed",
    description: "Achat de iPhone 15 Pro Max",
    reference: "CMD-2025-001",
  },
  {
    id: "2",
    date: new Date(2025, 6, 12),
    amount: 5000,
    currency: "XAF",
    type: "refund",
    status: "pending",
    description: "Remboursement partiel - Colis non reçu",
    reference: "CMD-2025-002",
  },
  {
    id: "3",
    date: new Date(2025, 6, 10),
    amount: 25000,
    currency: "XAF",
    type: "deposit",
    status: "completed",
    description: "Dépôt sur le compte wallet",
    reference: "DEP-2025-001",
  },
  {
    id: "4",
    date: new Date(2025, 6, 8),
    amount: 8000,
    currency: "XAF",
    type: "payment",
    status: "failed",
    description: "Achat de Smartwatch",
    reference: "CMD-2025-003",
  },
  {
    id: "5",
    date: new Date(2025, 6, 5),
    amount: 3000,
    currency: "XAF",
    type: "withdrawal",
    status: "completed",
    description: "Retrait vers compte mobile money",
    reference: "WTH-2025-001",
  },
];

const FILTERS: { value: PaymentFilter; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "payment", label: "Paiement" },
  { value: "refund", label: "Remboursement" },
  { value: "deposit", label: "Dépôt" },
  { value: "withdrawal", label: "Retrait" },
];

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setPayments(MOCK_PAYMENTS);
      setLoading(false);
    }, 800);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((payment) => filter === "all" || payment.type === filter)
      .sort((a, b) => {
        const dateA = a.date.getTime();
        const dateB = b.date.getTime();

        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [payments, filter, sortOrder]);

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={14} color="#4ade80" />;

      case "pending":
        return <Clock size={14} color="#facc15" />;

      case "failed":
        return <XCircle size={14} color="#f87171" />;

      case "cancelled":
        return <AlertCircle size={14} color="#f87171" />;

      default:
        return null;
    }
  };

  const getTypeIcon = (type: Payment["type"]) => {
    switch (type) {
      case "payment":
        return <ArrowUpRight size={16} color="#fb923c" />;

      case "refund":
        return <ArrowDownLeft size={16} color="#4ade80" />;

      case "deposit":
        return <ArrowDownLeft size={16} color="#60a5fa" />;

      case "withdrawal":
        return <ArrowUpRight size={16} color="#f87171" />;

      default:
        return <CreditCard size={16} color="rgba(255,255,255,0.4)" />;
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy HH:mm", {
      locale: fr,
    });
  };

  return (
    <View className="p-4">
      {/* En-tête */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-base font-bold text-white">
          Historique des paiements
        </Text>

        <Pressable
          onPress={() => {
            setSortOrder((previous) => (previous === "desc" ? "asc" : "desc"));
          }}
          className="flex-row items-center gap-1"
        >
          <RefreshCw size={14} color="rgba(255,255,255,0.45)" />

          <Text className="text-xs text-white/40">
            {sortOrder === "desc" ? "Plus récents" : "Plus anciens"}
          </Text>
        </Pressable>
      </View>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="gap-2"
      >
        {FILTERS.map((item) => {
          const isActive = filter === item.value;

          return (
            <Pressable
              key={item.value}
              onPress={() => {
                setFilter(item.value);
              }}
              className={`rounded-full border px-3 py-1.5 ${
                isActive
                  ? "border-orange-500/30 bg-orange-500/30"
                  : "border-white/5 bg-white/5"
              }`}
            >
              <Text
                className={`text-[10px] font-medium ${
                  isActive ? "text-orange-400" : "text-white/40"
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Chargement */}
      {loading ? (
        <View className="items-center justify-center py-8">
          <Loader2 size={24} color="rgba(255,255,255,0.4)" />
        </View>
      ) : filteredPayments.length === 0 ? (
        <View className="items-center justify-center py-8">
          <Text className="text-sm text-white/30">
            Aucun paiement trouvé pour ces critères.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {filteredPayments.map((payment) => (
            <View
              key={payment.id}
              className="flex-row items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3"
            >
              {/* Icône */}
              <View className="h-9 w-9 items-center justify-center rounded-full bg-white/10">
                {getTypeIcon(payment.type)}
              </View>

              {/* Informations */}
              <View className="flex-1">
                <View className="flex-row items-start justify-between gap-2">
                  <Text
                    className="flex-1 text-sm font-medium text-white"
                    numberOfLines={2}
                  >
                    {payment.description}
                  </Text>

                  <Text className="text-sm font-bold text-white">
                    {payment.amount} {payment.currency}
                  </Text>
                </View>

                <View className="mt-1 flex-row flex-wrap items-center gap-2">
                  <Text className="text-[10px] text-white/40">
                    {formatDate(payment.date)}
                  </Text>

                  <View className="flex-row items-center gap-1">
                    {getStatusIcon(payment.status)}

                    <Text className="text-[10px] capitalize text-white/40">
                      {payment.status}
                    </Text>
                  </View>

                  {payment.reference ? (
                    <Text className="text-[10px] text-white/20">
                      Réf: {payment.reference}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

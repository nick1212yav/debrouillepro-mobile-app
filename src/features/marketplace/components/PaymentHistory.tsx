import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/PaymentHistory.tsx
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Loader2,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
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

// Données simulées pour l'exemple
// À remplacer par une vraie requête Convex
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

export function PaymentHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "payment" | "refund" | "deposit" | "withdrawal"
  >("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Dans un vrai projet, on remplacerait par une requête Convex
  // const paymentsData = useQuery(api.commerce.getPaymentHistory, {});
  // useEffect(() => {
  //   if (paymentsData) {
  //     setPayments(paymentsData.map(adaptPayment));
  //     setLoading(false);
  //   }
  // }, [paymentsData]);

  // Simulation du chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setPayments(MOCK_PAYMENTS);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredPayments = payments
    .filter((p) => filter === "all" || p.type === filter)
    .sort((a, b) => {
      const dateA = a.date.getTime();
      const dateB = b.date.getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const getStatusIcon = (status: Payment["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={14} className="text-green-400" />;
      case "pending":
        return <Clock size={14} className="text-yellow-400" />;
      case "failed":
      case "cancelled":
        return <XCircle size={14} className="text-red-400" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: Payment["type"]) => {
    switch (type) {
      case "payment":
        return <ArrowUpRight size={14} className="text-orange-400" />;
      case "refund":
        return <ArrowDownLeft size={14} className="text-green-400" />;
      case "deposit":
        return <ArrowDownLeft size={14} className="text-blue-400" />;
      case "withdrawal":
        return <ArrowUpRight size={14} className="text-red-400" />;
      default:
        return <CreditCard size={14} className="text-white/40" />;
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy HH:mm", { locale: fr });
  };

  return (
    <View className="space-y-4 p-4">{}<View className="flex items-center justify-between"><Text className="text-white font-bold text-base">Historique des paiements
        </Text><Pressable onPress={() =>
            setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"))} className="text-xs text-white/40 transition-colors flex items-center gap-1"><RefreshCw size={12} />{sortOrder === "desc" ? "Plus récents" : "Plus anciens"}</Pressable></View>{}<View className="flex gap-1.5 flex-wrap">{(["all", "payment", "refund", "deposit", "withdrawal"] as const).map(
          (type) => (
            <Pressable key={type} onPress={() => setFilter(type)} className={`
              px-3 py-1 rounded-full text-[10px] font-medium transition-all
              ${
                filter === type
                  ? "bg-orange-500/30 text-orange-400 border border-orange-500/30"
                  : "bg-white/5 text-white/40 hover:text-white/70 border border-white/5"
              }
            `}>{type === "all"
                ? "Tous"
                : type.charAt(0).toUpperCase() + type.slice(1)}</Pressable>
          ),
        )}</View>{}{loading ? (
        <View className="flex items-center justify-center py-8"><Loader2 size={24} className="text-white/40 animate-spin" /></View>
      ) : filteredPayments.length === 0 ? (
        <View className="text-center py-8 text-white/30 text-sm"><Text>Aucun paiement trouvé pour ces critères.</Text></View>
      ) : (
        <View className="space-y-2.5">{filteredPayments.map((payment) => (
            <View key={payment.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/5"><View className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">{getTypeIcon(payment.type)}</View><View className="flex-1 min-w-0"><View className="flex items-center justify-between"><Text className="text-white font-medium text-sm truncate">{payment.description}</Text><Text className="text-white font-bold text-sm">{payment.amount}{payment.currency}</Text></View><View className="flex items-center gap-2 mt-0.5"><Text className="text-white/40 text-[10px]">{formatDate(payment.date)}</Text><Text className="flex items-center gap-1">{getStatusIcon(payment.status)}<Text className="text-white/40 text-[10px] capitalize">{payment.status}</Text></Text>{payment.reference && (
                    <Text className="text-white/20 text-[10px]">
                      Réf: {payment.reference}
                    </Text>
                  )}</View></View></View>
          ))}</View>
      )}</View>
  );
}

import { View, Text, Pressable, TextInput, Alert } from "react-native";
// src/features/marketplace/components/MarketplaceInvoices.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  FileText,
  Download,
  Eye,
  Search,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  File,
  ArrowUp,
  ArrowDown,
} from "lucide-react-native";

interface Invoice {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  buyerName: string;
  buyerEmail: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  pdfUrl?: string;
}

// Données simulées pour l'exemple
const MOCK_INVOICES: Invoice[] = [
  {
    id: "1",
    number: "INV-2025-001",
    date: new Date(2025, 6, 15),
    dueDate: new Date(2025, 7, 15),
    amount: 150000,
    currency: "XAF",
    status: "paid",
    buyerName: "Jean M.",
    buyerEmail: "jean.m@example.com",
    items: [
      {
        description: "iPhone 15 Pro Max 256GB",
        quantity: 1,
        unitPrice: 150000,
        total: 150000,
      },
    ],
  },
  {
    id: "2",
    number: "INV-2025-002",
    date: new Date(2025, 6, 12),
    dueDate: new Date(2025, 7, 12),
    amount: 85000,
    currency: "XAF",
    status: "pending",
    buyerName: "Marie L.",
    buyerEmail: "marie.l@example.com",
    items: [
      {
        description: "Smartwatch étanche",
        quantity: 2,
        unitPrice: 42500,
        total: 85000,
      },
    ],
  },
  {
    id: "3",
    number: "INV-2025-003",
    date: new Date(2025, 6, 8),
    dueDate: new Date(2025, 7, 8),
    amount: 230000,
    currency: "XAF",
    status: "overdue",
    buyerName: "Paul D.",
    buyerEmail: "paul.d@example.com",
    items: [
      {
        description: "Ordinateur portable",
        quantity: 1,
        unitPrice: 230000,
        total: 230000,
      },
    ],
  },
  {
    id: "4",
    number: "INV-2025-004",
    date: new Date(2025, 6, 5),
    dueDate: new Date(2025, 7, 5),
    amount: 120000,
    currency: "XAF",
    status: "cancelled",
    buyerName: "Sophie K.",
    buyerEmail: "sophie.k@example.com",
    items: [
      {
        description: "Tablette graphique",
        quantity: 1,
        unitPrice: 120000,
        total: 120000,
      },
    ],
  },
  {
    id: "5",
    number: "INV-2025-005",
    date: new Date(2025, 6, 2),
    dueDate: new Date(2025, 7, 2),
    amount: 45000,
    currency: "XAF",
    status: "paid",
    buyerName: "Luc B.",
    buyerEmail: "luc.b@example.com",
    items: [
      {
        description: "Casque audio",
        quantity: 2,
        unitPrice: 22500,
        total: 45000,
      },
    ],
  },
];

type StatusFilter = "all" | "paid" | "pending" | "overdue" | "cancelled";

export function MarketplaceInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "status">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Remplacer par une vraie requête Convex
  // const invoicesData = useQuery(api.commerce.getInvoices, {});
  // useEffect(() => {
  //   if (invoicesData) {
  //     setInvoices(invoicesData.map(adaptInvoice));
  //     setLoading(false);
  //   }
  // }, [invoicesData]);

  // Simulation de chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(MOCK_INVOICES);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Filtres et tri
  const filteredInvoices = invoices
    .filter((inv) => {
      const matchesStatus =
        statusFilter === "all" || inv.status === statusFilter;
      const matchesSearch =
        inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.buyerEmail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        const dateA = a.date.getTime();
        const dateB = b.date.getTime();
        return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
      }
      if (sortBy === "amount") {
        return sortOrder === "desc" ? b.amount - a.amount : a.amount - b.amount;
      }
      if (sortBy === "status") {
        const statusOrder = { paid: 0, pending: 1, overdue: 2, cancelled: 3 };
        const valA = statusOrder[a.status];
        const valB = statusOrder[b.status];
        return sortOrder === "desc" ? valB - valA : valA - valB;
      }
      return 0;
    });

  const totalAmount = filteredInvoices.reduce(
    (sum, inv) => sum + inv.amount,
    0,
  );
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.status === "pending")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleDownload = (invoice: Invoice) => {
    // Simuler le téléchargement
    console.log("Téléchargement de la facture", invoice.number);
    Alert.alert(String(`Téléchargement de la facture ${invoice.number} (simulation)`));
  };

  const handleView = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    console.log("Affichage de la facture", invoice.number);
  };

  const getStatusIcon = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={14} className="text-green-400" />;
      case "pending":
        return <Clock size={14} className="text-yellow-400" />;
      case "overdue":
        return <AlertCircle size={14} className="text-red-400" />;
      case "cancelled":
        return <XCircle size={14} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: Invoice["status"]) => {
    switch (status) {
      case "paid":
        return "Payée";
      case "pending":
        return "En attente";
      case "overdue":
        return "En retard";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter((i) => i.status === "paid").length,
    pending: invoices.filter((i) => i.status === "pending").length,
    overdue: invoices.filter((i) => i.status === "overdue").length,
    cancelled: invoices.filter((i) => i.status === "cancelled").length,
  };

  return (
    <View className="space-y-5 p-4">
      {/* En‑tête avec résumé */}
      <View className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <View>
          <Text className="text-white font-bold text-lg">Factures</Text>
          <Text className="text-white/40 text-xs">
            Gérez vos factures et suivez vos paiements
          </Text>
        </View>
        <View className="flex items-center gap-3">
          <View className="flex items-center gap-1 bg-white/5 rounded-xl px-3 py-1.5">
            <Text className="text-white/40 text-xs">Total</Text>
            <Text className="text-white font-bold text-sm">
              {totalAmount.toLocaleString()} FCFA
            </Text>
          </View>
          <View className="flex items-center gap-1 bg-green-500/10 rounded-xl px-3 py-1.5 border border-green-500/20">
            <Text className="text-green-400 text-xs">Payé</Text>
            <Text className="text-green-400 font-bold text-sm">
              {paidAmount.toLocaleString()} FCFA
            </Text>
          </View>
          {pendingAmount > 0 && (
            <View className="flex items-center gap-1 bg-yellow-500/10 rounded-xl px-3 py-1.5 border border-yellow-500/20">
              <Text className="text-yellow-400 text-xs">En attente</Text>
              <Text className="text-yellow-400 font-bold text-sm">
                {pendingAmount.toLocaleString()} FCFA
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Barre de recherche et filtres */}
      <View className="flex flex-col sm:flex-row gap-2.5">
        <View className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <TextInput
           
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder="Rechercher une facture..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/5 text-white text-sm placeholder-white/25 outline-none"
          />
        </View>
        <View className="flex gap-1.5 flex-wrap bg-white/5 rounded-xl p-1">
          {(["all", "paid", "pending", "overdue", "cancelled"] as const).map(
            (status) => (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`
                px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap
                ${
                  statusFilter === status
                    ? "bg-orange-500 text-white"
                    : "text-white/40 hover:text-white/80"
                }
              `}
              >
                {status === "all" ? "Toutes" : getStatusLabel(status)}
                <Text className="ml-1 text-[10px] opacity-60">
                  ({statusCounts[status]})
                </Text>
              </Pressable>
            ),
          )}
        </View>
        <View className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {(["date", "amount", "status"] as const).map((field) => (
            <Pressable
              key={field}
              onPress={() => {
                if (sortBy === field) {
                  setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
                } else {
                  setSortBy(field);
                  setSortOrder("desc");
                }
              }}
              className={`
                px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all flex items-center gap-0.5
                ${
                  sortBy === field
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70"
                }
              `}
            >
              {field === "date"
                ? "Date"
                : field === "amount"
                  ? "Montant"
                  : "Statut"}
              {sortBy === field &&
                (sortOrder === "desc" ? (
                  <ArrowUp size={10} />
                ) : (
                  <ArrowDown size={10} />
                ))}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Liste des factures */}
      {loading ? (
        <View className="flex items-center justify-center py-12">
          <Loader2 size={24} className="text-white/40 animate-spin" />
        </View>
      ) : filteredInvoices.length === 0 ? (
        <View className="text-center py-12 text-white/30 text-sm">
          <FileText size={32} className="mx-auto mb-3 text-white/20" />
          <Text>Aucune facture trouvée.</Text></View>
      ) : (
        <View className="space-y-2.5">
          {filteredInvoices.map((invoice) => (
            <View
              key={invoice.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5"
            >
              <View className="flex-1 min-w-0">
                <View className="flex items-center gap-2">
                  <File size={14} className="text-orange-400 flex-shrink-0" />
                  <Text className="text-white font-medium text-sm truncate">
                    {invoice.number}
                  </Text>
                  <Text className="flex items-center gap-1">
                    {getStatusIcon(invoice.status)}
                    <Text
                      className={`text-[10px] font-medium ${
                        invoice.status === "paid"
                          ? "text-green-400"
                          : invoice.status === "pending"
                            ? "text-yellow-400"
                            : invoice.status === "overdue"
                              ? "text-red-400"
                              : "text-gray-400"
                      }`}
                    >
                      {getStatusLabel(invoice.status)}
                    </Text>
                  </Text>
                </View>
                <View className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-white/40">
                  <Text className="flex items-center gap-1">
                    <User size={10} />
                    {invoice.buyerName}
                  </Text>
                  <Text className="flex items-center gap-1">
                    <Calendar size={10} />
                    {format(invoice.date, "dd MMM yyyy", { locale: fr })}
                  </Text>
                  <Text className="flex items-center gap-1">
                    <Calendar size={10} />
                    Échéance:{" "}
                    {format(invoice.dueDate, "dd MMM yyyy", { locale: fr })}
                  </Text>
                </View>
              </View>
              <View className="flex items-center gap-4 sm:ml-auto">
                <Text className="text-white font-bold text-sm">
                  {invoice.amount.toLocaleString()} {invoice.currency}
                </Text>
                <View className="flex items-center gap-1.5">
                  <Pressable
                    onPress={() => handleView(invoice)}
                    className="p-1.5 rounded-lg bg-white/5 text-white/40"
                    accessibilityLabel="Voir"
                  >
                    <Eye size={14} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDownload(invoice)}
                    className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400"
                    accessibilityLabel="Télécharger"
                  >
                    <Download size={14} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination simulée */}
      {filteredInvoices.length > 0 && (
        <View className="flex items-center justify-center gap-1 pt-2">
          {[1, 2, 3].map((page) => (
            <Pressable
              key={page}
              className={`
                w-8 h-8 rounded-lg text-xs font-medium transition-all
                ${
                  page === 1
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-white/40 hover:text-white/70"
                }
              `}
            >
              {page}
            </Pressable>
          ))}
        </View>
      )}

      {/* Modal de détail (simulé) */}
      {selectedInvoice && (
        <Pressable
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onPress={() => setSelectedInvoice(null)}
        >
          <Pressable
            className="max-w-md w-full rounded-3xl p-6 bg-[#0e0e22] border border-white/10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex items-center justify-between mb-4">
              <Text className="text-white font-bold">Détail facture</Text>
              <Pressable
                onPress={() => setSelectedInvoice(null)}
                className="text-white/40"
              >
                <Text>✕</Text></Pressable>
            </View>
            <View className="space-y-3 text-sm">
              <View className="flex justify-between">
                <Text className="text-white/40">Numéro</Text>
                <Text className="text-white font-medium">
                  {selectedInvoice.number}
                </Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Client</Text>
                <Text className="text-white">{selectedInvoice.buyerName}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Email</Text>
                <Text className="text-white">{selectedInvoice.buyerEmail}</Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Date</Text>
                <Text className="text-white">
                  {format(selectedInvoice.date, "dd MMM yyyy", { locale: fr })}
                </Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Échéance</Text>
                <Text className="text-white">
                  {format(selectedInvoice.dueDate, "dd MMM yyyy", {
                    locale: fr,
                  })}
                </Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Montant</Text>
                <Text className="text-white font-bold">
                  {selectedInvoice.amount.toLocaleString()}{" "}
                  {selectedInvoice.currency}
                </Text>
              </View>
              <View className="flex justify-between">
                <Text className="text-white/40">Statut</Text>
                <Text
                  className={`flex items-center gap-1 ${
                    selectedInvoice.status === "paid"
                      ? "text-green-400"
                      : selectedInvoice.status === "pending"
                        ? "text-yellow-400"
                        : selectedInvoice.status === "overdue"
                          ? "text-red-400"
                          : "text-gray-400"
                  }`}
                >
                  {getStatusIcon(selectedInvoice.status)}
                  {getStatusLabel(selectedInvoice.status)}
                </Text>
              </View>
              <View className="pt-3 border-t border-white/5 flex gap-2">
                <Pressable
                  onPress={() => handleDownload(selectedInvoice)}
                  className="flex-1 py-2 rounded-xl bg-orange-500 text-white text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Download size={14} /> <Text>Télécharger</Text></Pressable>
                <Pressable
                  onPress={() => setSelectedInvoice(null)}
                  className="flex-1 py-2 rounded-xl bg-white/5 text-white/60 text-sm font-medium"
                >
                  <Text>Fermer</Text></Pressable>
              </View>
            </View>
          </Pressable>
        </Pressable>
      )}
    </View>
  );
}

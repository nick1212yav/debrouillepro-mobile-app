import { View, Text, Pressable, Alert } from "react-native";

// src/features/marketplace/components/InvoiceViewer.tsx
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Download,
  Printer,
  X,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  CreditCard,
} from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";

interface InvoiceViewerProps {
  invoiceId: string | Id<"orders">;
  onClose?: () => void;
  onDownload?: (invoiceId: string) => void;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface InvoiceData {
  id: string;
  number: string;
  date: Date;
  dueDate: Date;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "cancelled";
  buyerName: string;
  buyerEmail: string;
  buyerAddress?: string;
  sellerName: string;
  sellerEmail: string;
  sellerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  pdfUrl?: string;
}

// Données simulées (à remplacer par une vraie requête Convex)
const MOCK_INVOICES: Record<string, InvoiceData> = {
  "1": {
    id: "1",
    number: "INV-2025-001",
    date: new Date(2025, 6, 15),
    dueDate: new Date(2025, 7, 15),
    amount: 150000,
    currency: "XAF",
    status: "paid",
    buyerName: "Jean M.",
    buyerEmail: "jean.m@example.com",
    buyerAddress: "123 Avenue de la République, Kinshasa",
    sellerName: "DébrouillePro Marketplace",
    sellerEmail: "marketplace@debrouillepro.com",
    sellerAddress: "456 Boulevard du Commerce, Kinshasa",
    items: [
      {
        description: "iPhone 15 Pro Max 256GB",
        quantity: 1,
        unitPrice: 150000,
        total: 150000,
      },
    ],
    subtotal: 150000,
    tax: 0,
    total: 150000,
    notes: "Paiement reçu le 15/07/2025",
  },
  "2": {
    id: "2",
    number: "INV-2025-002",
    date: new Date(2025, 6, 12),
    dueDate: new Date(2025, 7, 12),
    amount: 85000,
    currency: "XAF",
    status: "pending",
    buyerName: "Marie L.",
    buyerEmail: "marie.l@example.com",
    buyerAddress: "78 Rue des Artisans, Kinshasa",
    sellerName: "DébrouillePro Marketplace",
    sellerEmail: "marketplace@debrouillepro.com",
    sellerAddress: "456 Boulevard du Commerce, Kinshasa",
    items: [
      {
        description: "Smartwatch étanche",
        quantity: 2,
        unitPrice: 42500,
        total: 85000,
      },
    ],
    subtotal: 85000,
    tax: 0,
    total: 85000,
    notes: "En attente de paiement",
  },
  "3": {
    id: "3",
    number: "INV-2025-003",
    date: new Date(2025, 6, 8),
    dueDate: new Date(2025, 7, 8),
    amount: 230000,
    currency: "XAF",
    status: "overdue",
    buyerName: "Paul D.",
    buyerEmail: "paul.d@example.com",
    buyerAddress: "12 Place de l'Indépendance, Kinshasa",
    sellerName: "DébrouillePro Marketplace",
    sellerEmail: "marketplace@debrouillepro.com",
    sellerAddress: "456 Boulevard du Commerce, Kinshasa",
    items: [
      {
        description: "Ordinateur portable",
        quantity: 1,
        unitPrice: 230000,
        total: 230000,
      },
    ],
    subtotal: 230000,
    tax: 0,
    total: 230000,
    notes: "Paiement en retard",
  },
};

export function InvoiceViewer({
  invoiceId,
  onClose,
  onDownload,
}: InvoiceViewerProps) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dans un vrai projet, on remplacerait par une vraie requête Convex
  // const invoiceData = useQuery(api.commerce.getInvoice, { invoiceId });
  // useEffect(() => {
  //   if (invoiceData) {
  //     setInvoice(adaptInvoice(invoiceData));
  //     setLoading(false);
  //   }
  // }, [invoiceData]);

  // Simulation de chargement
  useEffect(() => {
    const timer = setTimeout(() => {
      const data = MOCK_INVOICES[invoiceId as string];
      if (data) {
        setInvoice(data);
        setLoading(false);
      } else {
        setError("Facture non trouvée");
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [invoiceId]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(invoiceId);
    } else {
      // Simulation de téléchargement
      console.log("Téléchargement de la facture", invoice?.number);
      Alert.alert(String(`Téléchargement de la facture ${invoice?.number} (simulation)`));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusIcon = (status: InvoiceData["status"]) => {
    switch (status) {
      case "paid":
        return <CheckCircle size={16} className="text-green-400" />;
      case "pending":
        return <Clock size={16} className="text-yellow-400" />;
      case "overdue":
        return <AlertCircle size={16} className="text-red-400" />;
      case "cancelled":
        return <XCircle size={16} className="text-gray-400" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: InvoiceData["status"]) => {
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

  if (loading) {
    return (
      <View className="flex items-center justify-center py-12"><Loader2 size={24} className="text-white/40 animate-spin" /></View>
    );
  }

  if (error || !invoice) {
    return (
      <View className="text-center py-12 text-white/40 text-sm"><FileText size={32} className="mx-auto mb-3 text-white/20" />{error || "Facture introuvable"}</View>
    );
  }

  return (
    <View className="space-y-4 p-4 print:p-0">{}<View className="flex items-center justify-between print:hidden"><Text className="text-white font-bold text-lg">Facture</Text><View className="flex items-center gap-2"><Pressable onPress={handleDownload} className="p-2 rounded-xl bg-orange-500/20 text-orange-400 transition-colors flex items-center gap-2 text-sm font-medium"><Download size={14} /><Text>Télécharger</Text></Pressable><Pressable onPress={handlePrint} className="p-2 rounded-xl bg-white/5 text-white/60 transition-colors flex items-center gap-2 text-sm font-medium"><Printer size={14} /><Text>Imprimer</Text></Pressable>{onClose && (
            <Pressable onPress={onClose} className="p-2 rounded-xl bg-white/5 text-white/60 transition-colors"><X size={18} /></Pressable>
          )}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/5 p-5 print:bg-transparent print:border-0">{}<View className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10"><View><Text className="text-white font-bold text-xl">Facture</Text><Text className="text-white/40 text-sm">{invoice.number}</Text></View><View className="text-right"><View className="flex items-center gap-2 justify-end">{getStatusIcon(invoice.status)}<Text className={`text-sm font-semibold ${
                  invoice.status === "paid"
                    ? "text-green-400"
                    : invoice.status === "pending"
                      ? "text-yellow-400"
                      : invoice.status === "overdue"
                        ? "text-red-400"
                        : "text-gray-400"
                }`}>{getStatusLabel(invoice.status)}</Text></View><Text className="text-white/30 text-xs">Date: {format(invoice.date, "dd MMM yyyy", { locale: fr })}</Text></View></View>{}<View className="gap-4 py-4 border-b border-white/10"><View><Text className="text-white/30 text-xs font-medium uppercase tracking-wider">Vendeur
            </Text><Text className="text-white font-medium">{invoice.sellerName}</Text><Text className="text-white/60 text-sm">{invoice.sellerEmail}</Text>{invoice.sellerAddress && (
              <Text className="text-white/40 text-xs">{invoice.sellerAddress}</Text>
            )}</View><View><Text className="text-white/30 text-xs font-medium uppercase tracking-wider">Client
            </Text><Text className="text-white font-medium">{invoice.buyerName}</Text><Text className="text-white/60 text-sm">{invoice.buyerEmail}</Text>{invoice.buyerAddress && (
              <Text className="text-white/40 text-xs">{invoice.buyerAddress}</Text>
            )}</View></View>{}<View className="py-3 flex flex-wrap gap-4 justify-between border-b border-white/10"><View><Text className="text-white/30 text-xs uppercase tracking-wider">Date d'émission
            </Text><Text className="text-white text-sm">{format(invoice.date, "dd MMM yyyy", { locale: fr })}</Text></View><View><Text className="text-white/30 text-xs uppercase tracking-wider">Date d'échéance
            </Text><Text className="text-white text-sm">{format(invoice.dueDate, "dd MMM yyyy", { locale: fr })}</Text></View><View><Text className="text-white/30 text-xs uppercase tracking-wider">Devise
            </Text><Text className="text-white text-sm">{invoice.currency}</Text></View></View>{}<View className="py-4"><table className="w-full text-sm"><thead><tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider"><th className="text-left py-2"><Text>Description</Text></th><th className="text-right py-2"><Text>Qté</Text></th><th className="text-right py-2"><Text>Prix unitaire</Text></th><th className="text-right py-2"><Text>Total</Text></th></tr></thead><tbody>{invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5 last:border-0">
                  <td className="py-2 text-white">{item.description}</td>
                  <td className="py-2 text-right text-white/70">
                    {item.quantity}
                  </td>
                  <td className="py-2 text-right text-white/70">
                    {item.unitPrice.toLocaleString()}
                  </td>
                  <td className="py-2 text-right text-white font-medium">
                    {item.total.toLocaleString()}
                  </td>
                </tr>
              ))}</tbody><tfoot><tr><td colSpan={3} className="text-right text-white/60 text-sm pt-3"><Text>Sous‑total</Text></td><td className="text-right text-white pt-3">{invoice.subtotal.toLocaleString()}{invoice.currency}</td></tr>{invoice.tax > 0 && (
                <tr>
                  <td colSpan={3} className="text-right text-white/60 text-sm">
                    Taxes
                  </td>
                  <td className="text-right text-white">
                    {invoice.tax.toLocaleString()} {invoice.currency}
                  </td>
                </tr>
              )}<tr><td colSpan={3} className="text-right text-white font-bold text-base pt-2"><Text>Total</Text></td><td className="text-right text-white font-bold text-base pt-2">{invoice.total.toLocaleString()}{invoice.currency}</td></tr></tfoot></table></View>{}{invoice.notes && (
          <View className="pt-3 border-t border-white/10">
            <Text className="text-white/30 text-xs uppercase tracking-wider">
              Notes
            </Text>
            <Text className="text-white/70 text-sm">{invoice.notes}</Text>
          </View>
        )}</View></View>
  );
}

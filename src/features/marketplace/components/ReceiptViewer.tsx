import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
// src/features/marketplace/components/ReceiptViewer.tsx
import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, Download, Printer } from "lucide-react-native";
import type { Id } from "@/convex/_generated/dataModel";
import { formatDate, formatPrice } from "../utils/formatter";

interface ReceiptViewerProps {
  receiptId: Id<"orders"> | Id<"walletTransactions"> | string;
  type?: "order" | "transaction";
  onClose?: () => void;
}

// ─── Stub pour simuler la récupération des données ──────────────────────────

type ReceiptData = {
  id: string;
  date: string;
  status: string;
  currency: string;
  buyer?: string;
  seller?: string;
  items?: Array<{ name: string; quantity: number; price: number }>;
  total?: number;
  amount?: number;
  paymentMethod?: string;
  type?: string;
  description?: string;
  counterparty?: string;
  reference?: string;
};

const MOCK_ORDER_RECEIPT: ReceiptData = {
  id: "order_123",
  date: formatDate(Date.now() - 86400000),
  status: "delivered",
  currency: "XAF",
  buyer: "Jean M.",
  seller: "DébrouillePro",
  items: [
    { name: "iPhone 15 Pro Max", quantity: 1, price: 150000 },
    { name: "Coque de protection", quantity: 2, price: 5000 },
  ],
  total: 160000,
  paymentMethod: "Mobile Money",
};

const MOCK_TRANSACTION_RECEIPT: ReceiptData = {
  id: "txn_456",
  date: formatDate(Date.now() - 3600000),
  status: "completed",
  currency: "XAF",
  amount: 75000,
  type: "deposit",
  description: "Dépôt wallet",
  counterparty: "Système",
  reference: "REF-2025-001",
};

// ─── Hook stub ──────────────────────────────────────────────────────────────

function useReceiptStub(
  receiptId: string,
  type: "order" | "transaction",
): { data: ReceiptData | null; isLoading: boolean } {
  const [data, setData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!receiptId) {
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      // Simuler des données en fonction du type
      if (type === "order") {
        setData({ ...MOCK_ORDER_RECEIPT, id: receiptId });
      } else {
        setData({ ...MOCK_TRANSACTION_RECEIPT, id: receiptId });
      }
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, [receiptId, type]);

  return { data, isLoading };
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ReceiptViewer({
  receiptId,
  type = "order",
  onClose,
}: ReceiptViewerProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  // ✅ Utilisation du stub au lieu de useQuery
  const { data: receiptData, isLoading } = useReceiptStub(
    receiptId as string,
    type,
  );

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      undefined;
      setIsPrinting(false);
    }, 300);
  };

  const handleDownload = () => {
    UIService.openToast("Téléchargement en cours de développement...", "info");
  };

  if (!receiptId) {
    return (
      <View className="text-white/40 text-center p-8">
        <Text>Aucun reçu à afficher</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-white/40 animate-spin" />
        <Text className="ml-3 text-white/40">Chargement...</Text>
      </View>
    );
  }

  if (!receiptData) {
    return (
      <View className="text-white/40 text-center p-8">
        <Text>Reçu introuvable</Text>
      </View>
    );
  }

  // ✅ Vérification sécurisée de items (pour éviter l'erreur "possibly undefined")
  const items = receiptData.items || [];

  return (
    <View className="flex flex-col gap-4">
      {/* En‑tête */}
      <View className="flex items-center justify-between">
        <View className="flex items-center gap-3">
          {onClose && (
            <Pressable
              onPress={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5"
            >
              <ArrowLeft size={16} className="text-white" />
            </Pressable>
          )}
          <Text className="text-white font-bold text-lg">Reçu</Text>
        </View>
        <View className="flex items-center gap-2">
          <Pressable
            onPress={handlePrint}
            className="p-2 rounded-xl bg-white/5"
            accessibilityLabel="Imprimer"
          >
            <Printer size={18} className="text-white/60" />
          </Pressable>
          <Pressable
            onPress={handleDownload}
            className="p-2 rounded-xl bg-white/5"
            accessibilityLabel="Télécharger"
          >
            <Download size={18} className="text-white/60" />
          </Pressable>
        </View>
      </View>

      {/* Corps du reçu */}
      <View
        className="bg-white/5 rounded-2xl p-6 space-y-4 border border-white/5"
        id="receipt-content"
      >
        {/* En‑tête du reçu */}
        <View className="text-center border-b border-white/10 pb-4">
          <Text className="text-white font-bold text-xl">DÉBROUILLE PRO</Text>
          <Text className="text-white/40 text-xs">Reçu officiel</Text>
        </View>

        {/* Infos */}
        <View className="gap-3 text-sm">
          <View>
            <Text className="text-white/40">Référence</Text>
            <Text className="text-white font-medium">{receiptData.id}</Text>
          </View>
          <View>
            <Text className="text-white/40">Date</Text>
            <Text className="text-white font-medium">{receiptData.date}</Text>
          </View>
          <View>
            <Text className="text-white/40">Statut</Text>
            <Text
              className={`font-medium ${
                receiptData.status === "delivered" ||
                receiptData.status === "completed"
                  ? "text-green-400"
                  : "text-yellow-400"
              }`}
            >
              {receiptData.status}
            </Text>
          </View>
          {type === "order" && (
            <>
              <View>
                <Text className="text-white/40">Client</Text>
                <Text className="text-white font-medium">{receiptData.buyer}</Text>
              </View>
              <View>
                <Text className="text-white/40">Vendeur</Text>
                <Text className="text-white font-medium">{receiptData.seller}</Text>
              </View>
            </>
          )}
          {type === "transaction" && (
            <>
              <View>
                <Text className="text-white/40">Type</Text>
                <Text className="text-white font-medium">{receiptData.type}</Text>
              </View>
              <View>
                <Text className="text-white/40">Contrepartie</Text>
                <Text className="text-white font-medium">
                  {receiptData.counterparty}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Détails */}
        {type === "order" && (
          <View className="space-y-2">
            <View className="flex justify-between text-sm border-b border-white/5 pb-2">
              <Text className="text-white/40">Article</Text>
              <Text className="text-white/40">Qté</Text>
              <Text className="text-white/40">Prix</Text>
            </View>
            {/* ✅ Utilisation de `items` (sécurisé) */}
            {items.map((item: any, idx: number) => (
              <View key={idx} className="flex justify-between text-sm">
                <Text className="text-white">{item.name}</Text>
                <Text className="text-white/60">{item.quantity}</Text>
                <Text className="text-white">
                  {formatPrice(item.price, receiptData.currency)}
                </Text>
              </View>
            ))}
            <View className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <Text className="text-white font-bold">Total</Text>
              <Text className="text-white font-bold">
                {formatPrice(receiptData.total || 0, receiptData.currency)}
              </Text>
            </View>
            <View>
              <Text className="text-white/40 text-sm">Moyen de paiement</Text>
              <Text className="text-white text-sm">{receiptData.paymentMethod}</Text>
            </View>
          </View>
        )}

        {type === "transaction" && (
          <View className="space-y-2">
            <View>
              <Text className="text-white/40">Description</Text>
              <Text className="text-white">{receiptData.description}</Text>
            </View>
            <View className="flex justify-between border-t border-white/10 pt-2 mt-2">
              <Text className="text-white font-bold">Montant</Text>
              <Text className="text-white font-bold">
                {formatPrice(receiptData.amount || 0, receiptData.currency)}
              </Text>
            </View>
            <View>
              <Text className="text-white/40">Référence</Text>
              <Text className="text-white text-sm">{receiptData.reference}</Text>
            </View>
          </View>
        )}

        {/* Pied de page */}
        <View className="border-t border-white/10 pt-4 text-center text-white/30 text-xs">
          <Text>
            <Text>Ce reçu fait foi de transaction. Conservez-le pour vos archives.</Text></Text>
          <Text className="mt-1"><Text>DÉBROUILLE PRO -</Text>{new Date().getFullYear()}</Text>
        </View>
      </View>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #receipt-content, #receipt-content * { visibility: visible; }
          #receipt-content { position: absolute; left: 0; top: 0; width: 100%; background: white; color: black; padding: 20px; }
          #receipt-content .text-white { color: #000 !important; }
          #receipt-content .text-white\\/40 { color: #666 !important; }
          #receipt-content .text-white\\/60 { color: #888 !important; }
          #receipt-content .bg-white\\/5 { background: #f5f5f5 !important; }
          #receipt-content .border-white\\/5 { border-color: #ddd !important; }
          #receipt-content .border-white\\/10 { border-color: #ccc !important; }
        }
      `}</style>
    </View>
  );
}

import { View, Text } from "react-native";

// src/features/transport/components/InvoiceViewer.tsx
import { useState } from "react";
import { Receipt, Download, Loader2 } from "lucide-react-native"; // ✅ Ajout de Loader2
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMobilityPrice } from "../utils/distance";

interface InvoiceViewerProps {
  invoiceId: string;
  amount: number;
  currency: string;
  origin: string;
  destination: string;
  date: string;
  driverName: string;
  paymentMethod: string;
  onBack?: () => void;
}

export function InvoiceViewer({
  invoiceId,
  amount,
  currency,
  origin,
  destination,
  date,
  driverName,
  paymentMethod,
  onBack,
}: InvoiceViewerProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      toast.success("Facture PDF téléchargée avec succès ! [2]");
    }, 2000);
  };

  return (
    <View className="p-6 rounded-3xl border border-white/5 bg-white/[0.02] space-y-6 max-w-sm mx-auto shadow-2xl"><View className="text-center space-y-2"><View className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center mx-auto text-emerald-400"><Receipt size={24} /></View><View className="space-y-0.5"><Text className="text-white font-black text-base">Paiement Réussi [2]
          </Text><Text className="text-[10px] text-white/40 font-mono uppercase">Réf : {invoiceId}</Text></View></View><View className="space-y-3 border-y border-white/5 py-4"><View className="flex justify-between text-xs"><Text className="text-white/40">Trajet [2]</Text><Text className="text-white font-bold text-right truncate max-w-[200px]">{origin}→ {destination}</Text></View><View className="flex justify-between text-xs"><Text className="text-white/40">Date & Heure</Text><Text className="text-white font-bold">{date}</Text></View><View className="flex justify-between text-xs"><Text className="text-white/40">Conducteur</Text><Text className="text-white font-bold">{driverName}</Text></View><View className="flex justify-between text-xs"><Text className="text-white/40">Méthode de règlement</Text><Text className="text-white font-bold uppercase">{paymentMethod}</Text></View></View><View className="flex items-center justify-between"><Text className="text-xs text-white/40">Montant payé (TTC) [2]</Text><Text className="text-xl font-black text-violet-400">{formatMobilityPrice(amount, currency)}[2]
        </Text></View><View className="space-y-2 pt-2"><Button onPress={handleDownload} disabled={downloading} className="w-full h-11 rounded-xl text-xs font-bold gap-2 bg-violet-600 text-white">{downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              <Download size={14} />
              Télécharger le reçu PDF [2]
            </>
          )}</Button>{onBack && (
          <Button
            onPress={onBack}
            variant="outline"
            className="w-full h-11 rounded-xl text-xs font-bold text-white/60 border-white/10"
          >
            Fermer
          </Button>
        )}</View></View>
  );
}

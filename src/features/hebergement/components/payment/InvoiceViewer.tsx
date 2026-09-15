import { View, Pressable, Text, Alert } from "react-native";
import React from "react";
import { Receipt, Download, FileText, ArrowLeft } from "lucide-react-native";

interface InvoiceViewerProps {
  invoiceId: string;
  guestName: string;
  accommodationTitle: string;
  dates: string;
  amount: number;
  currency?: string;
  onBack?: () => void;
  className?: string;
}

export const InvoiceViewer: React.FC<InvoiceViewerProps> = ({
  invoiceId,
  guestName,
  accommodationTitle,
  dates,
  amount,
  currency = "FCFA",
  onBack,
  className = "",
}) => {
  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("fr-FR").format(val);
  };

  return (
    <View className={`p-4 md:p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 ${className}`}>{}<View className="flex items-center justify-between border-b border-white/5 pb-3"><View className="flex items-center gap-2">{onBack && (
            <Pressable onPress={onBack} className="p-1 rounded-lg bg-white/5 text-white"><ArrowLeft size={16} /></Pressable>
          )}<Text className="text-sm font-semibold text-white flex items-center gap-1.5"><Receipt size={16} className="text-indigo-400" /><Text>Facture</Text></Text></View><Pressable onPress={() => Alert.alert("Téléchargement de la facture...")} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/80 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase"><Download size={12} /><Text>Télécharger</Text></Pressable></View>{}<View className="flex flex-col gap-3 p-4 rounded-xl bg-black/40 border border-white/5 text-xs text-white/70"><View className="flex justify-between items-baseline"><Text className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Référence
          </Text><Text className="font-bold text-white uppercase">{invoiceId}</Text></View><View className="flex justify-between items-baseline"><Text className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Client
          </Text><Text className="font-medium text-white">{guestName}</Text></View><View className="flex justify-between items-baseline"><Text className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Hébergement
          </Text><Text className="font-medium text-white max-w-[150px] truncate">{accommodationTitle}</Text></View><View className="flex justify-between items-baseline"><Text className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Dates
          </Text><Text className="font-medium text-white">{dates}</Text></View><View className="border-t border-white/5 pt-3 flex justify-between items-baseline mt-1"><Text className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Montant total réglé
          </Text><Text className="text-base font-black text-emerald-400">{formatPrice(amount)}{currency}</Text></View></View><View className="flex items-center gap-2 text-white/40 text-[9px] justify-center bg-white/5 p-2 rounded-lg border border-white/5"><FileText size={12} className="text-indigo-400" /><Text>Document officiel DébrouillePro généré automatiquement</Text></View></View>
  );
};

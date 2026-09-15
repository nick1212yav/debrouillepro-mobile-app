import { View, Pressable, Text } from "react-native";
import { Download, FileText } from "lucide-react-native";

interface ReceiptDownloadProps {
  invoiceNumber: string;
  onDownload?: () => void;
}

export function ReceiptDownload({
  invoiceNumber,
  onDownload,
}: ReceiptDownloadProps) {
  const triggerExport = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    // Simulation standard d'impression du document
    window.print();
  };

  return (
    <View className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between gap-4 text-left"><View className="flex items-center gap-2.5 min-w-0"><FileText size={16} className="text-orange-400 shrink-0" /><View className="min-w-0"><Text className="block text-[8px] text-white/30 uppercase font-black">Historique comptable
          </Text><Text className="text-xs text-white/85 truncate block font-bold">Justificatif_{invoiceNumber}.pdf
          </Text></View></View><Pressable onPress={triggerExport} className="px-3.5 py-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 shrink-0"><Download size={13} />Export
      </Pressable></View>
  );
}

import { View, Text } from "react-native";

// src/features/transport/components/ReceiptDownload.tsx
import { useState } from "react";
import { Download, Check, Ticket, QrCode } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ReceiptDownloadProps {
  bookingId: string;
  passengerName: string;
  origin: string;
  destination: string;
  date: string;
}

export function ReceiptDownload({
  bookingId,
  passengerName,
  origin,
  destination,
  date,
}: ReceiptDownloadProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = () => {
    // Simuler le téléchargement du PDF de billet d'embarquement [2]
    setTimeout(() => {
      setDownloaded(true);
      toast.success(
        "Billet d'embarquement enregistré dans votre appareil ! [2]",
      );
    }, 1500);
  };

  return (
    <View className="p-5 rounded-3xl border border-white/5 bg-white/[0.02] space-y-4 max-w-sm mx-auto text-center shadow-2xl"><View className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400"><Ticket size={22} /></View><View className="space-y-1"><Text className="text-white font-black text-sm">Billet de transport prêt [2]
        </Text><Text className="text-[10px] text-white/40 font-mono uppercase">ID : {bookingId}</Text></View>{}<View className="p-3 bg-white rounded-xl w-44 mx-auto flex flex-col items-center gap-1.5 shadow-inner"><QrCode size={90} className="text-black" /><Text className="text-[8px] font-mono text-black font-bold tracking-widest">{bookingId.substring(0, 12).toUpperCase()}</Text></View>{}<View className="text-left text-xs p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1"><Text className="text-white/40">Passager :{" "}<strong className="text-white font-bold">{passengerName}</strong></Text><Text className="text-white/40">Trajet :{" "}<strong className="text-white font-bold">{origin}→ {destination}[2]
          </strong></Text><Text className="text-white/40">Départ : <strong className="text-white font-bold">{date}</strong></Text></View><Button onPress={handleDownload} disabled={downloaded} className={`w-full h-11 rounded-xl text-xs font-bold gap-1.5 transition-all ${downloaded ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-violet-600 hover:bg-violet-700 text-white"}`}>{downloaded ? (
          <>
            <Check size={14} /> Billet téléchargé [2]
          </>
        ) : (
          <>
            <Download size={14} /> Obtenir mon billet d'embarquement [2]
          </>
        )}</Button></View>
  );
}

import { View, Text, Pressable } from "react-native";
import React, { useState } from "react";
import {
  Key,
  Wifi,
  DoorOpen,
  HelpCircle,
  ShieldCheck,
  Copy,
  Check,
} from "lucide-react-native";
import { toast } from "sonner";
import { Clipboard } from "@react-native-clipboard/clipboard";

interface AccommodationCheckInProps {
  checkInInstructions?: {
    keyLocation: string;
    keyCode: string;
    wifiName: string;
    wifiCode: string;
    gateCode?: string;
  };
  className?: string;
}

export const AccommodationCheckIn: React.FC<AccommodationCheckInProps> = ({
  checkInInstructions,
  className = "",
}) => {
  const [copiedWifi, setCopiedWifi] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const data = checkInInstructions || {
    keyLocation:
      "Boîte à clés sécurisée près de la porte principale d'entrée, côté droit.",
    keyCode: "4589",
    wifiName: "Villa_Mer_5G",
    wifiCode: "A0b1C2d3E4",
    gateCode: "#1990*",
  };

  const copyToClipboard = (text: string, type: "wifi" | "key") => {
    Clipboard.setString(text);
    toast.success("Copié dans le presse-papiers !");
    if (type === "wifi") {
      setCopiedWifi(true);
      setTimeout(() => setCopiedWifi(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <View className={`p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-4 ${className}`}><View className="flex items-center gap-2 pb-3 border-b border-white/5"><DoorOpen size={18} className="text-indigo-400" /><Text className="text-sm font-bold text-white">Guide d'Entrée & Installation
        </Text></View><View className="flex flex-col gap-3.5">{}<View className="p-3.5 rounded-xl bg-black/25 border border-white/5 flex items-start gap-3"><View className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5"><Key size={16} /></View><View className="flex-1 min-w-0 flex flex-col gap-1"><Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Accès aux clés
            </Text><Text className="text-xs text-white/75 leading-relaxed">{data.keyLocation}</Text><View className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg border border-white/5 mt-1"><Text className="text-xs font-mono font-black text-white tracking-widest">{data.keyCode}</Text><Pressable onPress={() => copyToClipboard(data.keyCode, "key")} className="text-white/40 transition-all">{copiedKey ? (
                  <Check size={12} className="text-emerald-400" />
                ) : (
                  <Copy size={12} />
                )}</Pressable></View></View></View>{}<View className="p-3.5 rounded-xl bg-black/25 border border-white/5 flex items-start gap-3"><View className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5"><Wifi size={16} /></View><View className="flex-1 min-w-0 flex flex-col gap-1"><Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Connexion WiFi
            </Text><View className="flex flex-col gap-1 text-xs"><View className="flex justify-between items-center text-white/80"><Text>Réseau : <strong>{data.wifiName}</strong></Text></View><View className="flex items-center justify-between bg-white/5 px-2 py-1.5 rounded-lg border border-white/5"><Text className="font-mono text-xs text-white/95">{data.wifiCode}</Text><Pressable onPress={() => copyToClipboard(data.wifiCode, "wifi")} className="text-white/40 transition-all">{copiedWifi ? (
                    <Check size={12} className="text-emerald-400" />
                  ) : (
                    <Copy size={12} />
                  )}</Pressable></View></View></View></View>{}{data.gateCode && (
          <View className="p-3.5 rounded-xl bg-black/25 border border-white/5 flex items-start gap-3"><View className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5"><ShieldCheck size={16} /></View><View className="flex-1 min-w-0 flex flex-col gap-1"><Text className="text-[9px] text-white/40 uppercase font-bold tracking-wider">Code Portail / Résidence
              </Text><Text className="text-xs font-mono font-bold text-white">{data.gateCode}</Text></View></View>
        )}</View><View className="flex items-center gap-1.5 text-white/30 text-[9px] justify-center mt-1"><HelpCircle size={12} /><Text>Besoin d'aide ? Contactez l'assistance DébrouillePro</Text></View></View>
  );
};

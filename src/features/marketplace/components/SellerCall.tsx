import { View, Pressable, Text } from "react-native";

// src/features/marketplace/components/SellerCall.tsx
import { useState } from "react";
import { Phone, PhoneOff, X } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  sellerName: string;
  sellerPhone?: string;
  onClose: () => void;
}

export function SellerCall({ sellerName, sellerPhone, onClose }: Props) {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const startCall = () => {
    if (!sellerPhone) {
      toast.error("Numéro de téléphone non disponible");
      return;
    }
    setIsCalling(true);
    setTimeout(() => {
      setIsConnected(true);
      toast.success("Appel connecté");
    }, 1500);
  };

  const endCall = () => {
    setIsConnected(false);
    setIsCalling(false);
    toast.info("Appel terminé");
    onClose();
  };

  return (
    <View className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"><View className="w-full max-w-sm rounded-3xl p-6 text-center" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><Pressable onPress={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/5"><X size={16} className="text-white" /></Pressable><View className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white bg-orange-500">{sellerName[0]}</View><Text className="text-white font-bold text-lg">{sellerName}</Text><Text className="text-white/40 text-sm mb-6">{isConnected
            ? "En ligne"
            : isCalling
              ? "Appel en cours..."
              : "Prêt à appeler"}</Text>{!isCalling ? (
          <Pressable onPress={startCall} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{  }}>
            <Phone size={18} /> Appeler
          </Pressable>
        ) : (
          <Pressable onPress={endCall} className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2" style={{  }}>
            <PhoneOff size={18} /> Raccrocher
          </Pressable>
        )}{sellerPhone && (
          <Text className="text-white/30 text-xs mt-4">📞 {sellerPhone}</Text>
        )}</View></View>
  );
}

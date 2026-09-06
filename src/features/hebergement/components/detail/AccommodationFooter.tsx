import { View, Text } from "react-native";
import React from "react";
import { ShieldCheck } from "lucide-react-native";

export const AccommodationFooter: React.FC = () => {
  return (
    <View className="p-6 text-center flex flex-col items-center gap-2 bg-[#020617]/40 border-t border-white/5 mt-6 pb-24">
      <View className="flex items-center gap-1 text-white/30 text-[10px]">
        <ShieldCheck size={12} />
        <Text><Text>Transaction sécurisée DébrouillePay</Text></Text>
      </View>
      <Text className="text-[9px] text-white/20 leading-relaxed">
        <Text>Toutes les réservations sont soumises à nos conditions générales d'utilisation. Les images et informations fournies relèvent de la responsabilité exclusive de l'hôte.</Text></Text>
    </View>
  );
};

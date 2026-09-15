import { View, Text } from "react-native";
import { Shield, CheckCircle, AlertCircle } from "lucide-react-native";

interface Props {
  isVerified?: boolean;
  isTrusted?: boolean;
  hasPaymentProtection?: boolean;
  sellerId?: string; // pour éventuellement récupérer des infos
}

export function AnnonceSafety({
  isVerified = false,
  isTrusted = false,
  hasPaymentProtection = false,
}: Props) {
  const items = [
    { icon: Shield, label: "Identité vérifiée", active: isVerified },
    { icon: Shield, label: "Vendeur de confiance", active: isTrusted },
    { icon: Shield, label: "Paiement sécurisé", active: hasPaymentProtection },
  ];

  return (
    <View className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"><View className="flex items-center gap-2 mb-2"><CheckCircle size={16} className="text-emerald-400" /><Text className="text-sm font-medium text-emerald-400">Sécurité</Text></View><View className="flex flex-wrap gap-3">{items.map((item) => (
          <View key={item.label} className="flex items-center gap-1.5">
            {item.active ? (
              <CheckCircle size={12} className="text-emerald-400" />
            ) : (
              <AlertCircle size={12} className="text-white/20" />
            )}
            <Text className={`text-xs ${item.active ? "text-white/70" : "text-white/30"}`}>
              {item.label}
            </Text>
          </View>
        ))}</View></View>
  );
}

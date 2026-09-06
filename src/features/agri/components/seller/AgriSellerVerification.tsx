import { View, Text } from "react-native";
// src/features/agri/components/seller/AgriSellerVerification.tsx
import { ShieldCheck, CheckCircle } from "lucide-react-native";

interface AgriSellerVerificationProps {
  sellerName: string;
}

export function AgriSellerVerification({
  sellerName,
}: AgriSellerVerificationProps) {
  const checks = [
    "Coordonnées de l'exploitation vérifiées sur le terrain",
    "Identité légale et registre de commerce validés",
    "Charte de qualité DébrouillePro signée",
    "Zéro litige de livraison sur les 30 derniers jours",
  ];

  return (
    <View className="w-full rounded-[28px] bg-emerald-500/5 border border-emerald-500/10 p-5 space-y-3.5">
      <View className="flex items-center gap-2.5 text-emerald-400">
        <ShieldCheck size={18} />
        <Text className="text-xs font-extrabold uppercase tracking-wider">
          Producteur Vérifié
        </Text>
      </View>
      <Text className="text-[10px] text-white/50 leading-relaxed">
        Le label de confiance certifie que l'exploitation de{" "}
        <strong>{sellerName}</strong> a fait l'objet d'un audit de conformité
        par les agents DébrouillePro :
      </Text>
      <View className="flex flex-col gap-2">
        {checks.map((check, i) => (
          <View
            key={i}
            className="flex items-start gap-2 text-[10px] text-white/70"
          >
            <CheckCircle
              size={12}
              className="text-emerald-400 mt-0.5 flex-shrink-0"
            />
            <Text>{check}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

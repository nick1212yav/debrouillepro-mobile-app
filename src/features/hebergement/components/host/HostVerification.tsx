import { View, Text } from "react-native";
import React from "react";
import {
  CheckCircle2,
  ShieldCheck,
  Mail,
  Phone,
  Fingerprint,
} from "lucide-react-native";

interface HostVerificationProps {
  verifications?: {
    identity: boolean;
    phone: boolean;
    email: boolean;
  };
  className?: string;
}

export const HostVerification: React.FC<HostVerificationProps> = ({
  verifications,
  className = "",
}) => {
  const checkList = verifications || {
    identity: true,
    phone: true,
    email: true,
  };

  const verifs = [
    {
      label: "Pièce d'identité vérifiée",
      verified: checkList.identity,
      icon: Fingerprint,
    },
    {
      label: "Numéro de téléphone validé",
      verified: checkList.phone,
      icon: Phone,
    },
    {
      label: "Adresse e-mail confirmée",
      verified: checkList.email,
      icon: Mail,
    },
  ];

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 ${className}`}><Text className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck size={14} className="text-indigo-400" /><Text>Sécurité & Vérifications</Text></Text><View className="flex flex-col gap-2">{verifs.map((v, i) => {
          const Icon = v.icon;
          return (
            <View key={i} className="flex items-center justify-between p-2 rounded-xl bg-black/20 border border-white/5 text-xs"><View className="flex items-center gap-2 text-white/70"><Icon size={14} className="text-indigo-400 shrink-0" /><Text>{v.label}</Text></View>{v.verified ? (
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
              ) : (
                <Text className="text-[9px] text-white/20 font-bold uppercase">
                  Non validé
                </Text>
              )}</View>
          );
        })}</View></View>
  );
};

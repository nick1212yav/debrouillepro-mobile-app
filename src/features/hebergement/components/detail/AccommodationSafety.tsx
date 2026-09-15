import { View, Text } from "react-native";
import React from "react";
import { Shield, Eye, Flame, AlertOctagon } from "lucide-react-native";

export const AccommodationSafety: React.FC = () => {
  const safeties = [
    {
      label: "Détecteur de monoxyde de carbone",
      present: true,
      icon: AlertOctagon,
    },
    { label: "Détecteur de fumée", present: true, icon: Flame },
    { label: "Extincteur d'incendie", present: true, icon: Shield },
    { label: "Caméras de surveillance extérieures", present: true, icon: Eye },
  ];

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">Santé & Sécurité
      </Text><View className="gap-3">{safeties.map((s, i) => {
          const Icon = s.icon;
          return (
            <View key={i} className="flex items-center gap-2"><View className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0"><Icon size={14} /></View><Text className="text-xs text-white/70">{s.label}</Text></View>
          );
        })}</View></View>
  );
};

import { View, Text } from "react-native";
import React from "react";
import { Clock, Ban, CheckCircle2 } from "lucide-react-native";

interface AccommodationRulesProps {
  rules?: {
    pets?: boolean;
    smoking?: boolean;
    children?: boolean;
    parties?: boolean;
    checkIn?: string;
    checkOut?: string;
  };
}

export const AccommodationRules: React.FC<AccommodationRulesProps> = ({
  rules,
}) => {
  const displayRules = rules || {
    pets: false,
    smoking: false,
    children: true,
    parties: false,
    checkIn: "14:00 - 22:00",
    checkOut: "08:00 - 11:00",
  };

  const checkList = [
    { label: "Fêtes autorisées", allowed: displayRules.parties },
    { label: "Logement non-fumeur", allowed: !displayRules.smoking },
    { label: "Animaux acceptés", allowed: displayRules.pets },
    { label: "Adapté aux enfants", allowed: displayRules.children },
  ];

  return (
    <View className="p-4 md:p-6 border-b border-white/5"><Text className="text-white font-semibold text-sm mb-3">Règlement intérieur
      </Text><View className="gap-4 mb-4"><View className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1"><View className="flex items-center gap-1.5 text-white/50 text-xs"><Clock size={14} className="text-indigo-400" /><Text>Arrivée</Text></View><Text className="text-xs font-bold text-white">{displayRules.checkIn}</Text></View><View className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-1"><View className="flex items-center gap-1.5 text-white/50 text-xs"><Clock size={14} className="text-indigo-400" /><Text>Départ</Text></View><Text className="text-xs font-bold text-white">{displayRules.checkOut}</Text></View></View><View className="gap-2">{checkList.map((item, i) => (
          <View key={i} className="flex items-center gap-2">
            {item.allowed ? (
              <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            ) : (
              <Ban size={14} className="text-rose-400 shrink-0" />
            )}
            <Text className="text-xs text-white/70">{item.label}</Text>
          </View>
        ))}</View></View>
  );
};

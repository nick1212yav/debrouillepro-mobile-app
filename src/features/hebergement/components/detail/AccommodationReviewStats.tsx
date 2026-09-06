import { View, Text } from "react-native";
import React from "react";

export const AccommodationReviewStats: React.FC = () => {
  const stats = [
    { label: "Propreté", value: 4.9 },
    { label: "Communication", value: 4.8 },
    { label: "Emplacement", value: 4.9 },
    { label: "Rapport qualité/prix", value: 4.7 },
  ];

  return (
    <View className="p-4 md:p-6 border-b border-white/5">
      <Text className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">
        Détail des évaluations
      </Text>
      <View className="gap-4">
        {stats.map((stat, i) => (
          <View key={i} className="flex flex-col gap-1.5">
            <View className="flex justify-between text-xs">
              <Text className="text-white/70">{stat.label}</Text>
              <Text className="font-semibold text-white">
                {stat.value.toFixed(1)}
              </Text>
            </View>
            <View className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <View
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                style={{ width: `${(stat.value / 5) * 100}%` }}
              />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

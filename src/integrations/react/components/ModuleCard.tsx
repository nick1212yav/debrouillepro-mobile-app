import { View, Text } from "react-native";
import React from "react";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";
import { buildCardData } from "../../../core/sdk/engines/CardEngine";

interface Props {
  moduleId: string;
  publication: any;
  onClick?: () => void;
  render?: (data: any) => React.ReactNode;
}

export function ModuleCard({ moduleId, publication, onClick, render }: Props) {
  const manifest = ModuleRegistry.get(moduleId);
  if (!manifest) return null;

  const cardData = buildCardData(publication, manifest);

  if (render) {
    return <View onPress={onClick}>{render(cardData)}</View>;
  }

  return (
    <View onPress={onClick} className="bg-white/5 rounded-xl p-4 transition-colors"><Text className="text-white font-semibold">{cardData.hero}</Text>{manifest.card.sections?.map((key: string) => (
        <View key={key} className="mt-2 text-sm text-white/60">{cardData[key]}</View>
      ))}<View className="mt-3 flex gap-3 flex-wrap">{manifest.card.metrics?.map((metricKey: string) => {
          const metric = manifest.metrics.find((m) => m.key === metricKey);
          if (!metric) return null;
          const value = publication.meta?.[metricKey];
          if (value === undefined || value === null) return null;
          return (
            <Text key={metricKey} className="text-xs text-white/40">
              {metric.icon} {metric.format ? metric.format(value) : value}
              {metric.unit && ` ${metric.unit}`}
            </Text>
          );
        })}</View></View>
  );
}

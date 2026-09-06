import { Pressable, View, Text } from "react-native";
import React from "react";
import { ModuleRegistry } from "../../../core/sdk/registry/ModuleRegistry";
import { ActionRegistry } from "../../../core/sdk/registry/ActionRegistry";
import { buildDetailSections } from "../../../core/sdk/engines/DetailEngine";
import type { ActionContext } from "../../../core/sdk/types";

interface Props {
  moduleId: string;
  publication: any;
  context?: Partial<ActionContext>;
}

export function ModuleDetail({ moduleId, publication, context = {} }: Props) {
  const manifest = ModuleRegistry.get(moduleId);
  if (!manifest) return <View className="text-red-400"><Text>Module introuvable</Text></View>;

  const sections = buildDetailSections(publication, manifest);
  const meta = publication.meta || {};

  const fullContext: ActionContext = {
    publication,
    user: context?.user || null,
    services: context?.services || {},
    navigate: context?.navigate || (() => {}),
    ui: context?.ui || {
      openSheet: () => {},
      openModal: () => {},
      openDrawer: () => {},
      openPlayer: () => {},
      openViewer: () => {},
      openToast: () => {},
    },
  };

  return (
    <View className="space-y-6">
      <View className="flex items-center gap-3">
        <Text className="text-3xl">{manifest.info.icon}</Text>
        <View>
          <Text className="text-xl font-bold text-white">{publication.title}</Text>
          <Text className="text-sm text-white/50">{manifest.info.label}</Text>
        </View>
      </View>

      <View className="gap-2">
        {manifest.metrics.map((metric) => {
          const value = meta[metric.key];
          if (value === undefined || value === null) return null;
          return (
            <View key={metric.key} className="bg-white/5 rounded-lg p-3">
              <Text className="text-xs text-white/40">{metric.label}</Text>
              <Text className="text-sm font-medium text-white">
                {metric.icon} {metric.format ? metric.format(value) : value}
                {metric.unit && ` ${metric.unit}`}
              </Text>
            </View>
          );
        })}
      </View>

      {sections.map((section) => (
        <View key={section.label}>
          <Text className="text-sm font-medium text-white/70 mb-2">
            {section.label}
          </Text>
          <Text className="text-sm text-white/60">
            {String(section.value)}
          </Text>
        </View>
      ))}

      <View className="flex flex-wrap gap-2">
        {manifest.actions.map((action) => {
          // ✅ Utiliser `visible` (pas `visibleIf`)
          if (action.visible && !action.visible(fullContext)) return null;
          return (
            <Pressable
              key={action.id}
              onPress={() => ActionRegistry.execute(action.id, fullContext)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white"
            >
              {action.icon && <Text className="mr-2">{action.icon}</Text>}
              {action.label}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

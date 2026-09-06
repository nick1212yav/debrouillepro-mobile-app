import { View, Text, Pressable } from "react-native";
import React from "react";

import type { ModuleCardItem } from "../types/home-section.types";

/**
 * ============================================================
 * DÉBROUILLEPRO — ModuleSuggestionCard
 * ============================================================
 *
 * Carte de suggestion d'un module Home.
 *
 * Le composant respecte strictement le contrat
 * ModuleCardItem.
 *
 * ============================================================
 */

export interface ModuleSuggestionCardProps {
  /**
   * Module à afficher.
   */
  item: ModuleCardItem;

  /**
   * Action déclenchée lors du clic.
   */
  onClick?: () => void;
}

export function ModuleSuggestionCard({
  item,
  onClick,
}: ModuleSuggestionCardProps) {
  return (
    <Pressable
     
      onPress={onClick}
      className="group w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
    >
      <View className="flex items-center gap-4">
        {/* ==================================================
            ICON
            ================================================== */}
        <View
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600/30 to-indigo-700/30 text-xl"
         
        >
          {item.icon ?? "◈"}
        </View>

        {/* ==================================================
            CONTENT
            ================================================== */}
        <View className="min-w-0 flex-1">
          <Text className="truncate text-sm font-bold text-white">
            {item.label}
          </Text>

          {item.description && (
            <Text className="mt-1 text-xs text-gray-400">
              {item.description}
            </Text>
          )}
        </View>

        {/* ==================================================
            ARROW
            ================================================== */}
        <Text
          className="shrink-0 text-gray-500"
        >
          <Text>→</Text></Text>
      </View>
    </Pressable>
  );
}

export default ModuleSuggestionCard;

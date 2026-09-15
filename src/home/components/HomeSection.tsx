import { View, Text, Pressable } from "react-native";
import React from "react";

import type {
  HomeSectionData,
  HomeSectionItem,
} from "../types/home-section.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import { RecommendationCard } from "./RecommendationCard";
import { OpportunityCard } from "./OpportunityCard";
import { NearbyCard } from "./NearbyCard";
import { ContinueCard } from "./ContinueCard";
import { ModuleSuggestionCard } from "./ModuleSuggestionCard";

export interface HomeSectionProps {
  section: HomeSectionData;

  onItemClick?: (item: HomeSectionItem) => void;

  onAction?: (action: string, item: HomeSectionItem) => void;

  className?: string;
}

function isRecommendation(item: HomeSectionItem): item is RecommendationItem {
  const value = item as unknown as Record<string, unknown>;

  return (
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.route === "string" &&
    typeof value.score === "number" &&
    typeof value.relevance === "string"
  );
}

function isModuleCard(item: HomeSectionItem): boolean {
  const value = item as unknown as Record<string, unknown>;

  return typeof value.label === "string" && typeof value.route === "string";
}

function getItemId(item: HomeSectionItem, index: number): string {
  const value = item as unknown as {
    id?: string;
    _id?: string;
  };

  return value.id ?? value._id ?? `section-item-${index}`;
}

export function HomeSection({
  section,
  onItemClick,
  onAction,
  className = "",
}: HomeSectionProps) {
  const items = section.items ?? [];

  if (items.length === 0) {
    return null;
  }

  const sectionType = String(section.type);

  const renderItem = (item: HomeSectionItem, index: number) => {
    const key = getItemId(item, index);

    const click = () => onItemClick?.(item);

    if (sectionType === "opportunities" || sectionType === "opportunity") {
      if (isRecommendation(item)) {
        return (
          <OpportunityCard
            key={key}
            item={item}
            onPress={click}
            onAction={(action) => onAction?.(action, item)}
          />
        );
      }
    }

    if (sectionType === "nearby") {
      if (isRecommendation(item)) {
        return (
          <NearbyCard
            key={key}
            item={item}
            onPress={click}
            onAction={(action) => onAction?.(action, item)}
          />
        );
      }
    }

    if (sectionType === "continue") {
      if (isRecommendation(item)) {
        return (
          <ContinueCard
            key={key}
            item={item}
            onPress={click}
            onAction={(action) => onAction?.(action, item)}
          />
        );
      }
    }

    if (isModuleCard(item)) {
      return (
        <ModuleSuggestionCard key={key} item={item as never} onPress={click} />
      );
    }

    if (isRecommendation(item)) {
      return (
        <RecommendationCard
          key={key}
          item={item}
          onPress={click}
          onAction={(action) => onAction?.(action, item)}
        />
      );
    }

    return (
      <View key={key} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">{(
          item as unknown as {
            title?: string;
          }
        ).title ?? "Contenu"}</View>
    );
  };

  return (
    <View className={`space-y-4 ${className}`} accessibilityLabel={section.title}><View className="flex items-start justify-between gap-4"><View className="min-w-0"><View className="flex items-center gap-2">{section.icon && <Text className="text-lg">{section.icon}</Text>}<Text className="text-lg font-bold text-white">{section.title}</Text></View>{section.subtitle && (
            <Text className="mt-1 text-sm text-gray-400">{section.subtitle}</Text>
          )}</View>{section.actions && section.actions.length > 0 && (
          <View className="flex shrink-0 gap-2">
            {section.actions.map((action, index) => (
              <Pressable key={action.id ?? `section-action-${index}`} onPress={() =>
                  onAction?.(String(action.id ?? "action"), items[0])
                } className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-gray-300 transition">
                {action.label}
              </Pressable>
            ))}
          </View>
        )}</View><View className={
          sectionType === "nearby" ||
          sectionType === "opportunities" ||
          sectionType === "recommendations"
            ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
            : "space-y-3"
        }>{items.map(renderItem)}</View></View>
  );
}

export default HomeSection;

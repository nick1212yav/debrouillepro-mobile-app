import { View, Text, Pressable, Image } from "react-native";
import React from "react";

import type {
  FeedItem,
  HomeSection,
  HomeSectionData,
  HomeSectionItem,
} from "../types/home-section.types";

import type { RecommendationItem } from "../types/home-recommendation.types";

import { HomeSection as HomeSectionComponent } from "./HomeSection";

/**
 * ============================================================
 * DÉBROUILLEPRO — HomeFeed
 * ============================================================
 *
 * Orchestrateur visuel du Home.
 *
 * Architecture :
 *
 * useHome()
 *    ↓
 * HomeFeed
 *    ↓
 * HomeSection
 *    ↓
 * Cards spécialisées
 *
 * IMPORTANT :
 * - aucune logique métier
 * - aucun accès Convex
 * - aucun ranking
 * - aucun calcul de recommandation
 *
 * Le composant ne fait que transformer les données
 * Home en interface utilisateur.
 * ============================================================
 */

export interface HomeFeedProps {
  /**
   * Sections générées par HomeEngine / Convex.
   */
  sections?: HomeSection[];

  /**
   * Ancien format plat conservé pour compatibilité.
   */
  items?: HomeSectionItem[];

  /**
   * État de chargement.
   */
  isLoading?: boolean;

  /**
   * Erreur éventuelle.
   */
  error?: string | null;

  /**
   * Message lorsqu'aucune donnée n'est disponible.
   */
  emptyMessage?: string;

  /**
   * Clic sur un élément.
   */
  onItemClick?: (item: HomeSectionItem) => void;

  /**
   * Action déclenchée depuis une carte ou une section.
   */
  onAction?: (action: string, item?: HomeSectionItem) => void;

  /**
   * Action "Voir tout" / action de section.
   */
  onSectionAction?: (action: string, section: HomeSection) => void;

  /**
   * Sections à masquer.
   */
  hiddenSections?: string[];

  /**
   * Classe CSS externe.
   */
  className?: string;
}

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function normalizeSectionData(section: HomeSection): HomeSectionData {
  return (
    section.data ?? {
      type: section.type,
      title: section.title,
      subtitle: section.subtitle,
      items: section.items ?? [],
      isLoading: section.isLoading ?? false,
      error: section.error ?? null,
      icon: section.icon,
      actions: section.actions,
      metadata: section.metadata,
    }
  );
}

function getItemKey(item: HomeSectionItem, index: number): string {
  const value = item as unknown as {
    id?: string;
    _id?: string;
  };

  return value.id ?? value._id ?? `home-feed-item-${index}`;
}

/**
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function HomeFeed({
  sections = [],
  items = [],
  isLoading = false,
  error = null,
  emptyMessage = "Aucun contenu disponible pour le moment.",
  onItemClick,
  onAction,
  onSectionAction,
  hiddenSections = [],
  className = "",
}: HomeFeedProps) {
  /**
   * ----------------------------------------------------------
   * LOADING GLOBAL
   * ----------------------------------------------------------
   */

  if (isLoading) {
    return (
      <View className={`space-y-6 ${className}`}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View key={`home-feed-skeleton-${index}`} className="space-y-4">
            <View className="h-6 w-40 animate-pulse rounded-lg bg-white/5" />

            <View className="gap-3">
              {Array.from({ length: 3 }).map((_, cardIndex) => (
                <View
                  key={`home-card-skeleton-${index}-${cardIndex}`}
                  className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5"
                />
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  /**
   * ----------------------------------------------------------
   * ERROR GLOBAL
   * ----------------------------------------------------------
   */

  if (error) {
    return (
      <View
        className={`rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200 ${className}`}
        accessibilityRole="alert"
      >
        {error}
      </View>
    );
  }

  /**
   * ----------------------------------------------------------
   * SECTIONS VISIBLES
   * ----------------------------------------------------------
   */

  const hidden = new Set(hiddenSections);

  const visibleSections = sections.filter(
    (section) => !hidden.has(String(section.type)) && section.visible !== false,
  );

  /**
   * ----------------------------------------------------------
   * NO SECTIONS → COMPATIBILITÉ ITEMS
   * ----------------------------------------------------------
   *
   * Tant que certaines parties de Home utilisent encore
   * l'ancien format plat, on continue de pouvoir afficher
   * items directement.
   */

  if (visibleSections.length === 0 && items.length > 0) {
    return (
      <View className={`space-y-4 ${className}`}>
        <LegacyItems
          items={items}
          onItemClick={onItemClick}
          onAction={onAction}
        />
      </View>
    );
  }

  /**
   * ----------------------------------------------------------
   * EMPTY
   * ----------------------------------------------------------
   */

  if (visibleSections.length === 0) {
    return (
      <View
        className={`rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center ${className}`}
      >
        <View className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-xl">
          <Text>✨</Text></View>

        <Text className="text-sm text-gray-400">{emptyMessage}</Text>
      </View>
    );
  }

  /**
   * ----------------------------------------------------------
   * SECTIONS
   * ----------------------------------------------------------
   */

  return (
    <View className={`space-y-8 ${className}`}>
      {visibleSections.map((section) => {
        const sectionData = normalizeSectionData(section);

        /**
         * Section vide :
         * HomeSection gère déjà ce cas.
         */
        if (sectionData.items.length === 0) {
          return null;
        }

        return (
          <HomeSectionComponent
            key={section.id ?? `home-section-${section.type}`}
            section={sectionData}
            onItemClick={onItemClick}
            onAction={(action, item) => onAction?.(action, item)}
            className="w-full"
          />
        );
      })}
    </View>
  );
}

/**
 * ============================================================
 * LEGACY ITEMS
 * ============================================================
 *
 * Compatibilité temporaire avec l'ancien HomeFeed.
 *
 * Cette partie pourra disparaître lorsque toute la Home
 * consommera exclusivement HomeSection[].
 * ============================================================
 */

interface LegacyItemsProps {
  items: HomeSectionItem[];

  onItemClick?: (item: HomeSectionItem) => void;

  onAction?: (action: string, item: HomeSectionItem) => void;
}

function LegacyItems({ items, onItemClick, onAction }: LegacyItemsProps) {
  return (
    <View className="space-y-3">
      {items.map((item, index) => {
        const key = getItemKey(item, index);

        return (
          <LegacyItem
            key={key}
            item={item}
            onPress={() => onItemClick?.(item)}
            onAction={(action) => onAction?.(action, item)}
          />
        );
      })}
    </View>
  );
}

/**
 * ============================================================
 * LEGACY ITEM
 * ============================================================
 */

interface LegacyItemProps {
  item: HomeSectionItem;

  onClick?: () => void;

  onAction?: (action: string) => void;
}

function LegacyItem({ item, onClick }: LegacyItemProps) {
  const value = item as unknown as Record<string, unknown>;

  /**
   * Recommendation.
   */
  if (
    typeof value.title === "string" &&
    typeof value.route === "string" &&
    typeof value.score === "number" &&
    typeof value.relevance === "string"
  ) {
    return (
      <LegacyRecommendation
        item={item as RecommendationItem}
        onPress={onClick}
      />
    );
  }

  /**
   * Module.
   */
  if (typeof value.label === "string" && typeof value.route === "string") {
    return <LegacyModule item={item} onPress={onClick} />;
  }

  /**
   * Feed classique.
   */
  return <LegacyFeed item={item as FeedItem} onPress={onClick} />;
}

/**
 ============================================================
 * LEGACY RECOMMENDATION
 * ============================================================
 */

function LegacyRecommendation({
  item,
  onClick,
}: {
  item: RecommendationItem;
  onClick?: () => void;
}) {
  return (
    <Pressable
     
      onPress={onClick}
      className="group w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
    >
      <View className="flex gap-4">
        {item.image ? (
          <Image
           
           
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
            loading="lazy"
           source={{ uri: item.image }} accessibilityLabel=""/>
        ) : (
          <View className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
            <Text>✨</Text></View>
        )}

        <View className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-blue-300">Recommandé</Text>

          <Text className="mt-1 text-sm font-semibold text-white">
            {item.title}
          </Text>

          {item.description && (
            <Text className="mt-1 text-xs text-gray-400">
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 ============================================================
 * LEGACY MODULE
 * ============================================================
 */

function LegacyModule({
  item,
  onClick,
}: {
  item: HomeSectionItem;
  onClick?: () => void;
}) {
  const value = item as unknown as {
    label?: string;
    title?: string;
    description?: string;
    icon?: string;
  };

  return (
    <Pressable
     
      onPress={onClick}
      className="group w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
    >
      <View className="flex items-center gap-4">
        <View className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-xl">
          {value.icon ?? "◈"}
        </View>

        <View className="min-w-0 flex-1">
          <Text className="truncate text-sm font-bold text-white">
            {value.label ?? value.title ?? "Module"}
          </Text>

          {value.description && (
            <Text className="mt-1 text-xs text-gray-400">
              {value.description}
            </Text>
          )}
        </View>

        <Text className="text-gray-500">
          →
        </Text>
      </View>
    </Pressable>
  );
}

/**
 ============================================================
 * LEGACY FEED
 * ============================================================
 */

function LegacyFeed({
  item,
  onClick,
}: {
  item: FeedItem;
  onClick?: () => void;
}) {
  return (
    <Pressable
     
      onPress={onClick}
      className="group w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
    >
      <View className="flex gap-4">
        {item.image ? (
          <Image
           
           
            className="h-20 w-20 shrink-0 rounded-xl object-cover"
            loading="lazy"
           source={{ uri: item.image }} accessibilityLabel=""/>
        ) : (
          <View className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
            <Text>◈</Text></View>
        )}

        <View className="min-w-0 flex-1">
          <Text className="text-xs font-medium text-blue-300">
            {item.moduleId ?? item.type}
          </Text>

          <Text className="mt-1 text-sm font-semibold text-white">
            {item.title ?? "Contenu"}
          </Text>

          {item.description && (
            <Text className="mt-1 text-xs text-gray-400">
              {item.description}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default HomeFeed;

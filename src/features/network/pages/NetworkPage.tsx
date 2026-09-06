import { View, Text, Pressable } from "react-native";
// src/features/network/pages/NetworkPage.tsx
import { useState, useCallback, useEffect } from "react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import type { Id } from "@/convex/_generated/dataModel";

// ✅ Importations corrigées depuis leurs répertoires réels pour éviter les collisions d'index [1]
import { NetworkHeader } from "../components/NetworkHeader";
import { NetworkSearch } from "../components/NetworkSearch";
import { NetworkStats } from "../components/NetworkStats";
import { NetworkTabs } from "../components/NetworkTabs";
import { NetworkSuggestions } from "../components/Network/NetworkSuggestions";
import { FollowersList } from "../components/Network/FollowersList";
import { FollowingList } from "../components/Network/FollowingList";
import { ConnectionRequests } from "../components/Network/ConnectionRequests";

import { NetworkFiltersSheet } from "../sheets";

// Hooks
import {
  useNetworkSuggestions,
  useNetworkFollowers,
  useNetworkFollowing,
  useNetworkAnalytics,
} from "../hooks";

// Types
import type { NetworkTab } from "../components/NetworkTabs";

interface NetworkPageProps {
  onBack: () => void;
  onViewProfile: (userId: Id<"users">) => void;
  onNavigate?: (page: string, params?: any) => void;
}

export default function NetworkPage({
  onBack,
  onViewProfile,
  onNavigate,
}: NetworkPageProps) {
  const { user: firebaseUser } = useFirebaseAuth();
  const userId = firebaseUser?.uid as Id<"users"> | undefined;

  const [activeTab, setActiveTab] = useState<NetworkTab>("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // ── Suggestions ──
  // ✅ Correction : Retrait de 'limit' non supporté par la signature du hook
  const { suggestions, isLoading: suggestionsLoading } = useNetworkSuggestions(
    {},
  );

  // ── Abonnés ──
  // ✅ Correction : Retrait de 'limit' non supporté par la signature du hook
  const {
    followers,
    isLoading: followersLoading,
    removeFollower,
  } = useNetworkFollowers({
    userId: userId!,
  });

  // ── Abonnements ──
  // ✅ Correction : Retrait de 'limit' non supporté par la signature du hook
  const {
    following,
    isLoading: followingLoading,
    unfollow,
  } = useNetworkFollowing({
    userId: userId!,
  });

  // ── Analytics ──
  const { analytics, isLoading: analyticsLoading } = useNetworkAnalytics({
    userId,
    period: "month",
  });

  // ── Gestionnaires ──
  const handleFollowToggle = useCallback(
    async (targetUserId: Id<"users">, isFollowing: boolean) => {
      // La logique de suivi est gérée par les composants individuels
      // via le FollowButton qui utilise directement la mutation.
      // On peut simplement rafraîchir les données si nécessaire.
      // Pour l'instant, on laisse les composants gérer.
    },
    [],
  );

  const handleRemoveFollower = useCallback(
    async (followerId: Id<"users">) => {
      await removeFollower(followerId);
      // Les données seront mises à jour automatiquement par le hook
    },
    [removeFollower],
  );

  const handleUnfollow = useCallback(
    async (targetUserId: Id<"users">) => {
      await unfollow(targetUserId);
    },
    [unfollow],
  );

  // ── Rendu du contenu selon l'onglet ──
  const renderContent = () => {
    switch (activeTab) {
      case "suggestions":
        return (
          <NetworkSuggestions
            suggestions={suggestions || []}
            totalCount={suggestions?.length || 0}
            isLoading={suggestionsLoading}
            onUserClick={onViewProfile}
            onFollowToggle={handleFollowToggle}
            onRefresh={() => {}}
            limit={10}
          />
        );
      case "followers":
        return (
          <FollowersList
            followers={followers || []}
            totalCount={followers?.length || 0}
            isLoading={followersLoading}
            isOwnProfile={true}
            onUserClick={onViewProfile}
            onRemoveFollower={handleRemoveFollower}
            limit={10}
          />
        );
      case "following":
        return (
          <FollowingList
            following={following || []}
            totalCount={following?.length || 0}
            isLoading={followingLoading}
            isOwnProfile={true}
            onUserClick={onViewProfile}
            onUnfollow={handleUnfollow}
            limit={10}
          />
        );
      case "companies":
        return (
          <View className="text-white/40 text-sm text-center py-8">
            <Text>Les entreprises apparaîtront ici.</Text></View>
        );
      case "opportunities":
        return (
          <View className="text-white/40 text-sm text-center py-8">
            <Text>Les opportunités (emplois, services) apparaîtront ici.</Text></View>
        );
      case "analytics":
        return (
          <View className="space-y-4">
            <View className="text-white/40 text-sm text-center py-8">
              {analyticsLoading ? "Chargement..." : "Statistiques du réseau"}
            </View>
            {analytics && (
              <View className="gap-3">
                <StatCard
                  label="Vues de profil"
                  value={analytics.profileViews}
                  change={analytics.profileViewsChange}
                />
                <StatCard
                  label="Abonnés gagnés"
                  value={analytics.connectionsGained}
                  change={analytics.connectionsGainedChange}
                />
                <StatCard
                  label="Taux d'engagement"
                  value={analytics.postsEngagement}
                  change={analytics.postsEngagementChange}
                  suffix="%"
                />
                <StatCard
                  label="Opportunités générées"
                  value={analytics.opportunitiesGenerated}
                  change={analytics.opportunitiesGeneratedChange}
                />
              </View>
            )}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View
      className="h-full flex flex-col overflow-hidden"
      style={{  }}
    >
      {/* Header */}
      <NetworkHeader
        onBack={onBack}
        title="Réseau"
        subtitle="Suggestions · Abonnés · Abonnements"
        showSearch
        onSearch={() => setFilterSheetOpen(true)}
        rightElement={
          <Pressable
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-indigo-500/15"
            onPress={() => setFilterSheetOpen(true)}
          >
            <Text className="text-indigo-400 text-sm">🔍</Text>
          </Pressable>
        }
      />

      {/* Stats */}
      <NetworkStats
        followerCount={followers?.length || 0}
        followingCount={following?.length || 0}
        isLoading={followersLoading || followingLoading}
      />

      {/* Search bar */}
      <View className="px-4 mb-4">
        <NetworkSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un profil, une entreprise..."
          onSearch={() => {}}
        />
      </View>

      {/* Tabs */}
      <NetworkTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        counts={{
          suggestions: suggestions?.length || 0,
          followers: followers?.length || 0,
          following: following?.length || 0,
        }}
      />

      {/* Content */}
      <View
        className="flex-1 overflow-y-auto px-4 pb-6"
        style={{  }}
      >
        {renderContent()}
      </View>

      {/* Filter Sheet */}
      <NetworkFiltersSheet
        isOpen={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        onApply={(filters) => {
          console.log("Filtres appliqués:", filters);
          setFilterSheetOpen(false);
        }}
      />
    </View>
  );
}

// ─── Composant auxiliaire ────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  change,
  suffix = "",
}: {
  label: string;
  value: number;
  change: number;
  suffix?: string;
}) {
  const isPositive = change >= 0;
  return (
    <View className="p-3 rounded-xl bg-white/5 border border-white/10">
      <Text className="text-white/40 text-[10px] uppercase tracking-wider">
        {label}
      </Text>
      <Text className="text-white font-bold text-lg mt-1">
        {value}
        {suffix}
      </Text>
      {change !== 0 && (
        <Text
          className={`text-xs font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}
        >
          {isPositive ? "↑" : "↓"} {Math.abs(change)}%
        </Text>
      )}
    </View>
  );
}

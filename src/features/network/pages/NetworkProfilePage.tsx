import { useRouter } from "expo-router";
import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
// src/features/network/pages/NetworkProfilePage.tsx
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ArrowLeft, Users, MapPin, Calendar, Briefcase } from "lucide-react-native";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";

// Composants du module
import {
  ProfileHeader,
  ProfileAbout,
  ProfileExperience,
  ProfileEducation,
  ProfileSkills,
} from "../components/Profile";

// Hooks
import {
  useNetworkProfile,
  useNetworkExperience,
  useNetworkEducation,
  useNetworkSkills,
} from "../hooks";

interface NetworkProfilePageProps {
  userId: Id<"users">;
  onBack: () => void;
}

export default function NetworkProfilePage({
  userId,
  onBack,
}: NetworkProfilePageProps) {
  const router = useRouter();
  const { user: firebaseUser } = useFirebaseAuth();
  const currentUserId = firebaseUser?.uid as Id<"users"> | undefined;
  const isOwnProfile = currentUserId === userId;

  // ── Données ──
  const { profile, isLoading: profileLoading } = useNetworkProfile(userId);

  // Statistiques de suivi – utilise api.network.getFollowStats (existe dans convex/network.ts)
  const followStats = useQuery(api.network.getFollowStats, { userId });
  const followerCount = followStats?.followerCount ?? 0;
  const followingCount = followStats?.followingCount ?? 0;
  const isFollowing = followStats?.isFollowing ?? false;
  const statsLoading = followStats === undefined;

  const { experiences, isLoading: expLoading } = useNetworkExperience({
    userId,
  });
  const { educations, isLoading: eduLoading } = useNetworkEducation({ userId });
  const { skills, isLoading: skillsLoading } = useNetworkSkills({ userId });

  // ── Gestionnaires ──
  const handleMessage = () => {
    UIService.openToast("Messagerie à venir", "info");
  };

  const handleShare = () => {
    undefined
      ?.writeText(undefined.href)
      .then(() => UIService.openToast("Lien copié", "success"))
      .catch(() => UIService.openToast("Partagez ce profil", "info"));
  };

  // ── Chargement ──
  if (profileLoading || statsLoading) {
    return (
      <View className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a] px-4 pt-12">
        <Skeleton className="h-10 w-10 rounded-2xl mb-6" />
        <Skeleton className="h-48 w-full rounded-3xl mb-4" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl mt-4" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="h-full flex flex-col items-center justify-center px-6 text-center bg-gradient-to-b from-[#020617] to-[#0a0a1a]">
        <Users size={44} className="text-white/10 mb-4" />
        <Text className="text-white font-bold">Profil introuvable</Text>
        <Text className="text-white/40 text-sm mt-2">
          Cet utilisateur n'existe pas ou n'est pas disponible.
        </Text>
        <Pressable
          onPress={onBack}
          className="mt-5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
        >
          <Text>Retour</Text></Pressable>
      </View>
    );
  }

  // Utiliser profile.joinedAt pour la date d'inscription
  const joinedDate = profile.joinedAt
    ? new Date(profile.joinedAt).toLocaleDateString("fr-FR")
    : "-";

  return (
    <View
      className="h-full overflow-y-auto bg-gradient-to-b from-[#020617] to-[#0a0a1a]"
      style={{  }}
    >
      {/* ─── Header ─── */}
      <View className="sticky top-0 z-30 flex items-center justify-between px-4 pt-10 pb-3 bg-[#020617]/80 border-b border-white/5">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/8"
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View className="flex items-center gap-2">
          <Pressable
            onPress={handleShare}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/8 border border-white/8"
          >
            <Users size={16} className="text-white" />
          </Pressable>
        </View>
      </View>

      <View className="px-4 pb-8">
        {/* ─── Profil ─── */}
        <ProfileHeader
          userId={userId}
          name={profile.name}
          avatar={profile.avatar}
          cover={profile.cover}
          headline={profile.headline}
          accessibilityRole={profile.roles?.[0]}
          city={profile.city}
          country={profile.country}
          verified={profile.verified}
          followerCount={followerCount}
          followingCount={followingCount}
          isFollowing={isFollowing}
          isOwnProfile={isOwnProfile}
          joinedAt={profile.joinedAt}
          onFollowToggle={() => {
            // Géré par le FollowButton interne
          }}
          onMessage={handleMessage}
          onShare={handleShare}
          isLoading={profileLoading}
        />

        {/* ─── À propos ─── */}
        <ProfileAbout
          bio={profile.bio}
          editable={isOwnProfile}
          onEdit={() => UIService.openToast("Modifier la bio", "info")}
          isLoading={profileLoading}
        />

        {/* ─── Expériences ─── */}
        <View className="mt-4">
          <ProfileExperience
            experiences={experiences || []}
            editable={isOwnProfile}
            onAdd={() => UIService.openToast("Ajouter une expérience", "info")}
            onEdit={() => UIService.openToast("Modifier l'expérience", "info")}
            onDelete={() => UIService.openToast("Supprimer l'expérience", "info")}
            isLoading={expLoading}
          />
        </View>

        {/* ─── Formations ─── */}
        <View className="mt-4">
          <ProfileEducation
            educations={educations || []}
            editable={isOwnProfile}
            onAdd={() => UIService.openToast("Ajouter une formation", "info")}
            onEdit={() => UIService.openToast("Modifier la formation", "info")}
            onDelete={() => UIService.openToast("Supprimer la formation", "info")}
            isLoading={eduLoading}
          />
        </View>

        {/* ─── Compétences ─── */}
        <View className="mt-4">
          <ProfileSkills
            skills={skills || []}
            editable={isOwnProfile}
            onAdd={() => UIService.openToast("Ajouter une compétence", "info")}
            onEdit={() => UIService.openToast("Modifier la compétence", "info")}
            onDelete={() => UIService.openToast("Supprimer la compétence", "info")}
            onEndorse={() => UIService.openToast("Recommandation ajoutée !", "success")}
            isLoading={skillsLoading}
          />
        </View>

        {/* ─── Statistiques ─── */}
        <View className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <Text className="text-white font-semibold text-sm mb-3">
            Statistiques
          </Text>
          <View className="gap-2 text-center">
            <View>
              <Text className="text-white font-bold">{followerCount}</Text>
              <Text className="text-white/40 text-xs">Abonnés</Text>
            </View>
            <View>
              <Text className="text-white font-bold">{followingCount}</Text>
              <Text className="text-white/40 text-xs">Abonnements</Text>
            </View>
            <View>
              <Text className="text-white font-bold">{joinedDate}</Text>
              <Text className="text-white/40 text-xs"><Text>Membre depuis</Text></Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

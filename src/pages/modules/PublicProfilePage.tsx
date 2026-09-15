import { View, Pressable, Text, Share } from "react-native";

// src/pages/modules/PublicProfilePage.tsx

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  FileText,
  Share2,
  Grid3X3,
  BadgeCheck,
  Sparkles,
} from "lucide-react-native";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";

// Imports types & composants du module Profile
import type { Id } from "@/convex/_generated/dataModel";
import type { PublicationType } from "@/hooks/use-publications.ts";
import {
  Avatar,
  FollowButton,
  MiniPubCard,
  FollowersList,
} from "@/features/profile";
import { Clipboard } from "@react-native-clipboard/clipboard";

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({
  value,
  label,
  onClick,
}: {
  value: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Pressable onPress={onClick} className="flex flex-col items-center gap-0.5" disabled={!onClick}><Text className="text-xl font-black text-white">{value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}</Text><Text className="text-xs text-white/40">{label}</Text></Pressable>
  );
}

// ─── Main Public Profile Page ─────────────────────────────────────────────────

interface PublicProfilePageProps {
  userId: Id<"users">;
  onBack: () => void;
}

function PublicProfileInner({ userId, onBack }: PublicProfilePageProps) {
  const [listType, setListType] = useState<"followers" | "following" | null>(
    null,
  );
  const profile = useQuery(api.follows.getPublicProfile, { userId });
  const publications = useQuery(api.follows.getPublicPublications, { userId });

  const role = profile?.roles?.[0];

  const handleShare = () => {
    const name = profile?.name ?? "Profil";
    if (navigator.share) {
      void Share.share({ message: String(`Découvrez le profil de ${name}`), title: `${name} – Débrouille Pro` });
    } else {
      void Clipboard.setString(`${name} – Débrouille Pro`);
      toast("Lien copié", { icon: "🔗" });
    }
  };

  const isLoading = profile === undefined;

  return (
    <View className="h-full flex flex-col overflow-hidden" style={{  }}>{}<View className="relative h-40 flex-shrink-0 overflow-hidden"><View className="absolute inset-0" style={{  }} /><View className="absolute inset-0 opacity-30" style={{  }} /><View className="absolute inset-0" style={{  }} /><Pressable onPress={onBack} className="absolute top-5 left-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><ArrowLeft size={18} className="text-white" /></Pressable><Pressable onPress={handleShare} className="absolute top-5 right-5 w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.45)" }}><Share2 size={16} className="text-white" /></Pressable></View>{}<View className="flex-1 overflow-y-auto" style={{  }}><View className="px-5 -mt-14 relative z-10"><View className="flex items-end justify-between mb-4">{isLoading ? (
              <Skeleton className="w-20 h-20 rounded-full" />
            ) : (
              <Avatar name={profile?.name} avatar={profile?.avatar} size={72} />
            )}<View className="flex items-center gap-2 pb-1 flex-wrap"><Authenticated>{!isLoading && profile && (
                  <FollowButton
                    userId={userId}
                    isFollowing={profile.isFollowedByMe}
                  />
                )}</Authenticated><Unauthenticated><SignInButton /></Unauthenticated></View></View>{isLoading ? (
            <View className="space-y-2 mb-4"><Skeleton className="h-6 w-40 rounded-xl" /><Skeleton className="h-4 w-64 rounded-xl" /></View>
          ) : (
            <>
              <View className="flex items-center gap-2 mb-1"><Text className="text-xl font-black text-white">{profile?.name ?? "Utilisateur"}</Text>{role === "professionnel" || role === "entreprise" ? (
                  <BadgeCheck size={18} className="text-blue-400" />
                ) : (
                  <CheckCircle2 size={18} className="text-green-400" />
                )}{role && (
                  <Text className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: role === "entreprise"
                                            ? "rgba(249,115,22,0.2)"
                                            : role === "professionnel"
                                              ? "rgba(99,102,241,0.2)"
                                              : "rgba(16,185,129,0.2)", color:
                                          role === "entreprise"
                                            ? "#fb923c"
                                            : role === "professionnel"
                                              ? "#818cf8"
                                              : "#34d399" }}>{role === "particulier"
                      ? "Particulier"
                      : role === "professionnel"
                        ? "Pro"
                        : "Entreprise"}</Text>
                )}</View>

              {profile?.bio && (
                <Text className="text-white/55 text-sm mb-3 leading-relaxed">{profile.bio}</Text>
              )}

              <View className="flex items-center gap-3 mb-4 flex-wrap text-xs text-white/40">{profile?.city && (
                  <Text className="flex items-center gap-1"><MapPin size={11} className="text-white/30" />{profile.city}{profile.country ? `, ${profile.country}` : ""}</Text>
                )}{profile?.interests && profile.interests.length > 0 && (
                  <Text className="flex items-center gap-1"><Sparkles size={11} className="text-indigo-400" />{profile.interests.slice(0, 3).join(", ")}</Text>
                )}</View>

              {/* Ligne des statistiques */}
              <View className="flex items-center gap-6 mb-5 px-1"><StatChip value={profile?.followerCount ?? 0} label="Abonnés" onPress={() => setListType("followers")} /><View className="w-px h-6 bg-white/10" /><StatChip value={profile?.followingCount ?? 0} label="Abonnements" onPress={() => setListType("following")} /><View className="w-px h-6 bg-white/10" /><StatChip value={profile?.publicationCount ?? 0} label="Publications" /></View>

              {/* Badges d'intérêts */}
              {profile?.interests && profile.interests.length > 0 && (
                <View className="flex gap-2 flex-wrap mb-5">{profile.interests.map((interest) => (
                    <Text key={interest} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: "rgba(99,102,241,0.15)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)", borderStyle: "solid", color: "#a5b4fc" }}>{interest}</Text>
                  ))}</View>
              )}
            </>
          )}{}<View className="mb-2"><View className="flex items-center gap-2 mb-3"><Grid3X3 size={14} className="text-white/40" /><Text className="text-xs font-bold text-white/50 uppercase tracking-wider">Publications
              </Text>{publications && (
                <Text className="text-white/25 text-xs">
                  ({publications.length})
                </Text>
              )}</View>{publications === undefined ? (
              <View className="gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-36 rounded-2xl" />
                ))}
              </View>
            ) : publications.length === 0 ? (
              <View className="text-center py-10">
                <FileText size={32} className="mx-auto mb-2 text-white/15" />
                <Text className="text-white/30 text-sm">Aucune publication</Text>
              </View>
            ) : (
              <View className="gap-3 pb-8">
                {publications.map((pub, i) => (
                  <View key={pub._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <MiniPubCard
                      pub={pub as typeof pub & { type: PublicationType }}
                    />
                  </View>
                ))}
              </View>
            )}</View></View></View>{}<View>{listType && (
          <FollowersList
            userId={userId}
            type={listType}
            onClose={() => setListType(null)}
          />
        )}</View></View>
  );
}

export default function PublicProfilePage({
  userId,
  onBack,
}: PublicProfilePageProps) {
  return <PublicProfileInner userId={userId} onBack={onBack} />;
}

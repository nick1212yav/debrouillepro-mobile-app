import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import {
  ArrowLeft,
  Trophy,
  Users,
  MapPin,
  Calendar,
  Star,
  Plus,
  Target,
  Shield,
} from "lucide-react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Authenticated, Unauthenticated } from "@/lib/convex-auth-compat";
const CLUBS = [
  {
    id: 1,
    name: "AS Abidjan FC",
    sport: "Football",
    members: 124,
    level: "Amateur",
    location: "Cocody",
    rating: 4.7,
    img: "https://images.unsplash.com/photo-1551958219-acbc595b53dd?w=400&h=200&fit=crop",
    color: "#6366F1",
  },
  {
    id: 2,
    name: "Basket Club Plateau",
    sport: "Basketball",
    members: 68,
    level: "Semi-pro",
    location: "Plateau",
    rating: 4.9,
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop",
    color: "#F97316",
  },
  {
    id: 3,
    name: "Tennis Marcory",
    sport: "Tennis",
    members: 45,
    level: "Amateur",
    location: "Marcory",
    rating: 4.5,
    img: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=200&fit=crop",
    color: "#FBBF24",
  },
  {
    id: 4,
    name: "Run Abidjan",
    sport: "Running",
    members: 312,
    level: "Tous niveaux",
    location: "Abidjan",
    rating: 4.8,
    img: "https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=400&h=200&fit=crop",
    color: "#10B981",
  },
];

const TOURNAMENTS = [
  {
    name: "Tournoi de Pâques Football",
    sport: "Football",
    date: "15-20 Juil 2025",
    teams: 16,
    prize: "500 000 FCFA",
    location: "Stade FHB",
    status: "Inscriptions ouvertes",
  },
  {
    name: "Championship Basketball",
    sport: "Basketball",
    date: "1-3 Août 2025",
    teams: 8,
    prize: "200 000 FCFA",
    location: "Salle Municipal",
    status: "Bientôt",
  },
  {
    name: "Open Tennis Abidjan",
    sport: "Tennis",
    date: "10-15 Août 2025",
    teams: 32,
    prize: "300 000 FCFA",
    location: "Tennis Club Cocody",
    status: "Inscriptions ouvertes",
  },
];

function SportContent() {
  const joinedClubIds = useQuery(api.localServices.listMyClubMemberships, {});
  const registeredTournaments = useQuery(
    api.localServices.listMyTournamentRegistrations,
    {},
  );
  const joinClubMut = useMutation(api.localServices.joinClub);
  const leaveClubMut = useMutation(api.localServices.leaveClub);
  const registerTournament = useMutation(api.localServices.registerTournament);
  const unregisterTournament = useMutation(
    api.localServices.unregisterTournament,
  );

  const [activeTab, setActiveTab] = useState("Clubs");
  const [filterSport, setFilterSport] = useState("Tous");

  const sports = ["Tous", "Football", "Basketball", "Tennis", "Running"];
  const filtered =
    filterSport === "Tous"
      ? CLUBS
      : CLUBS.filter((c) => c.sport === filterSport);

  const isJoined = (id: number) => joinedClubIds?.includes(id) ?? false;
  const isRegistered = (name: string) =>
    registeredTournaments?.some((t) => t.tournamentName === name) ?? false;

  const handleJoin = async (clubId: number) => {
    try {
      // ✅ Correction : cast temporaire pour le build (backend mock)
      await joinClubMut({ clubId: clubId as any });
      UIService.openToast("Club rejoint !", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const handleLeave = async (clubId: number) => {
    try {
      // ✅ Correction : cast temporaire pour le build (backend mock)
      await leaveClubMut({ clubId: clubId as any });
      UIService.openToast("Club quitté", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const handleRegister = async (name: string, sport: string) => {
    try {
      await registerTournament({ tournamentName: name, sport });
      UIService.openToast("Inscription confirmée !", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const handleUnregister = async (name: string) => {
    try {
      // ✅ Correction : ajout du champ sport manquant
      // On récupère le sport depuis TOURNAMENTS
      const tournament = TOURNAMENTS.find((t) => t.name === name);
      await unregisterTournament({
        tournamentName: name,
        sport: tournament?.sport || "Football",
      });
      UIService.openToast("Inscription annulée", "success");
    } catch {
      UIService.openToast("Erreur", "error");
    }
  };

  const stats = [
    {
      label: "Clubs rejoints",
      value: String(joinedClubIds?.length ?? 0),
      icon: Users,
      color: "#10B981",
    },
    {
      label: "Tournois",
      value: String(registeredTournaments?.length ?? 0),
      icon: Target,
      color: "#EC4899",
    },
    { label: "Matches joués", value: "23", icon: Shield, color: "#6366F1" },
    { label: "Victoires", value: "15", icon: Trophy, color: "#F59E0B" },
  ];

  return (
    <>
      <View className="flex gap-2 px-4 mb-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <View
            key={label}
            className="flex-1 p-2 rounded-xl text-center"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <Icon size={14} color={color} className="mx-auto mb-1" />
            <Text className="text-white font-bold text-sm">{value}</Text>
            <Text className="text-gray-500 text-xs leading-tight">{label}</Text>
          </View>
        ))}
      </View>

      <View
        className="flex gap-1 mx-4 mb-3 p-1 rounded-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        {["Clubs", "Tournois", "Classement"].map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: activeTab === tab ? "rgba(255,255,255,0.1)" : "transparent" }}
          >
            {tab}
          </Pressable>
        ))}
      </View>

      <View
        className="flex-1 overflow-y-auto px-4 pb-6 space-y-4"
        style={{  }}
      >
        {activeTab === "Clubs" && (
          <>
            <View
              className="flex gap-2 overflow-x-auto pb-1"
              style={{  }}
            >
              {sports.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setFilterSport(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: filterSport === s ? "#6366F1" : "rgba(255,255,255,0.06)" }}
                >
                  {s}
                </Pressable>
              ))}
            </View>
            {filtered.map((club, i) => (
              <View
                key={club.id}
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <View className="relative">
                  <Image
                   
                   
                    className="w-full h-32 object-cover"
                   source={{ uri: club.img }} accessibilityLabel={club.name}/>
                  <View
                    className="absolute inset-0"
                    style={{  }}
                  />
                  <Text
                    className="absolute top-3 right-3 text-xs px-2 py-1 rounded-full font-medium"
                    style={{ backgroundColor: `${club.color}CC`, color: "white" }}
                  >
                    {club.sport}
                  </Text>
                </View>
                <View className="p-3">
                  <View className="flex items-center justify-between mb-2">
                    <Text className="text-white font-bold text-sm">{club.name}</Text>
                    <View className="flex items-center gap-1">
                      <Star size={10} color="#F59E0B" fill="#F59E0B" />
                      <Text className="text-white text-xs">{club.rating}</Text>
                    </View>
                  </View>
                  <View className="flex items-center gap-3 mb-3">
                    <View className="flex items-center gap-1">
                      <MapPin size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">
                        {club.location}
                      </Text>
                    </View>
                    <View className="flex items-center gap-1">
                      <Users size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-xs">
                        {club.members} membres
                      </Text>
                    </View>
                    <Text
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#9CA3AF" }}
                    >
                      {club.level}
                    </Text>
                  </View>
                  {isJoined(club.id) ? (
                    <Pressable
                      onPress={() => handleLeave(club.id)}
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                    >
                      <Text>✓ Membre · Quitter</Text></Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleJoin(club.id)}
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: club.color }}
                    >
                      <Text>Rejoindre le club</Text></Pressable>
                  )}
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "Tournois" && (
          <>
            {TOURNAMENTS.map((t, i) => (
              <View
                key={i}
                className="p-4 rounded-2xl"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <View className="flex items-start justify-between gap-2 mb-3">
                  <Text className="text-white font-bold text-sm flex-1">
                    {t.name}
                  </Text>
                  <Text
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: t.status === "Inscriptions ouvertes"
                                              ? "rgba(16,185,129,0.15)"
                                              : "rgba(245,158,11,0.15)", color:
                                            t.status === "Inscriptions ouvertes"
                                              ? "#10B981"
                                              : "#F59E0B" }}
                  >
                    {t.status}
                  </Text>
                </View>
                <View className="gap-2 mb-3">
                  <View className="flex items-center gap-1">
                    <Calendar size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{t.date}</Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <MapPin size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">{t.location}</Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Users size={10} color="#9CA3AF" />
                    <Text className="text-gray-400 text-xs">
                      {t.teams} équipes
                    </Text>
                  </View>
                  <View className="flex items-center gap-1">
                    <Trophy size={10} color="#F59E0B" />
                    <Text className="text-yellow-400 text-xs">{t.prize}</Text>
                  </View>
                </View>
                {t.status === "Inscriptions ouvertes" &&
                  (isRegistered(t.name) ? (
                    <Pressable
                      onPress={() => handleUnregister(t.name)}
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
                    >
                      <Text>✓ Inscrit · Annuler</Text></Pressable>
                  ) : (
                    <Pressable
                      onPress={() => handleRegister(t.name, t.sport)}
                      className="w-full py-2 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: "#F59E0B" }}
                    >
                      <Text>S'inscrire</Text></Pressable>
                  ))}
              </View>
            ))}
          </>
        )}

        {activeTab === "Classement" && (
          <>
            <View
              className="p-3 rounded-xl"
              style={{ backgroundColor: "rgba(245,158,11,0.08)", borderWidth: 1, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}
            >
              <Text className="text-yellow-400 text-xs text-center font-medium">
                Classement régional Football – Juin 2025
              </Text>
            </View>
            {[
              {
                rank: 1,
                name: "AS Abidjan FC",
                pts: 87,
                w: 28,
                l: 5,
                emoji: "🥇",
              },
              {
                rank: 2,
                name: "Jeunesse FC",
                pts: 81,
                w: 26,
                l: 7,
                emoji: "🥈",
              },
              {
                rank: 3,
                name: "Sporting Yopougon",
                pts: 76,
                w: 24,
                l: 9,
                emoji: "🥉",
              },
              {
                rank: 4,
                name: "Racing Club Bouaké",
                pts: 72,
                w: 23,
                l: 10,
                emoji: "",
              },
              {
                rank: 5,
                name: "Mon Équipe",
                pts: 65,
                w: 20,
                l: 13,
                emoji: "⭐",
              },
            ].map((team, i) => (
              <View
                key={team.rank}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ backgroundColor: team.rank <= 3
                                      ? "rgba(245,158,11,0.06)"
                                      : "rgba(255,255,255,0.04)", borderWidth: 3, borderColor: "rgba(245,158,11,0.2)", borderStyle: "solid" }}
              >
                <Text className="text-lg w-8 text-center">
                  {team.emoji || team.rank}
                </Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">
                    {team.name}
                  </Text>
                  <Text className="text-gray-400 text-xs">
                    {team.w}V · {team.l}D
                  </Text>
                </View>
                <Text className="text-white font-bold">{team.pts} pts</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </>
  );
}

export default function SportPage({ onBack }: { onBack: () => void }) {
  return (
    <View
      className="h-full flex flex-col overflow-hidden"
      style={{  }}
    >
      <View className="flex items-center gap-3 px-4 pt-12 pb-4">
        <Pressable
          onPress={onBack}
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        >
          <ArrowLeft size={18} color="white" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white font-bold text-lg">Sport & Clubs</Text>
          <Text className="text-gray-400 text-xs">
            Clubs · Tournois · Performances
          </Text>
        </View>
        <Pressable
          className="p-2 rounded-full"
          style={{ backgroundColor: "rgba(99,102,241,0.2)" }}
        >
          <Plus size={18} color="#6366F1" />
        </Pressable>
      </View>

      <Authenticated>
        <SportContent />
      </Authenticated>
      <Unauthenticated>
        <View className="flex-1 flex flex-col">
          <View className="flex gap-2 px-4 mb-4">
            {[
              { label: "Clubs", value: "4+", color: "#10B981" },
              { label: "Tournois", value: "3", color: "#EC4899" },
              { label: "Sports", value: "5", color: "#6366F1" },
              { label: "Membres", value: "500+", color: "#F59E0B" },
            ].map(({ label, value, color }) => (
              <View
                key={label}
                className="flex-1 p-2 rounded-xl text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
              >
                <Text className="text-white font-bold text-sm" style={{ color }}>
                  {value}
                </Text>
                <Text className="text-gray-500 text-xs leading-tight">{label}</Text>
              </View>
            ))}
          </View>
          <View className="flex-1 flex items-center justify-center px-4">
            <View className="text-center">
              <Trophy size={48} className="mx-auto mb-3 text-yellow-400/30" />
              <Text className="text-white/60 text-sm mb-1">
                <Text>Connectez-vous pour rejoindre des clubs et tournois</Text></Text>
              <Text className="text-gray-500 text-xs">
                <Text>Suivez vos performances et compétitions</Text></Text>
            </View>
          </View>
        </View>
      </Unauthenticated>
    </View>
  );
}

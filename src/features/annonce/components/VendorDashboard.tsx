import { View, Text, Pressable, Image } from "react-native";
import { useState } from "react";
import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  TrendingUp,
} from "lucide-react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface Props {
  userId?: Id<"users">;
}

export function VendorDashboard({ userId }: Props) {
  const [tab, setTab] = useState<"overview" | "annonces" | "orders" | "stats">(
    "overview",
  );

  const stats = useQuery(api.annonceAnalytics.getVendorStats, { userId });
  const annonces = useQuery(api.publications.getMyPublications, {});

  if (stats === undefined) {
    return (
      <View className="text-white/40 text-sm">
        <Text>Chargement du tableau de bord...</Text></View>
    );
  }

  const statItems = [
    {
      label: "Annonces",
      value: stats.publications || 0,
      icon: Package,
      color: "#F59E0B",
    },
    {
      label: "Ventes",
      value: stats.sales || 0,
      icon: ShoppingBag,
      color: "#10B981",
    },
    {
      label: "Vues",
      value: stats.totalViews || 0,
      icon: TrendingUp,
      color: "#60A5FA",
    },
    {
      label: "Clients",
      value: stats.orders || 0,
      icon: Users,
      color: "#8B5CF6",
    },
  ];

  return (
    <View className="space-y-4">
      <View className="flex items-center justify-between">
        <Text className="text-white font-bold text-lg">
          Tableau de bord vendeur
        </Text>
        <View className="flex gap-1 bg-white/5 rounded-xl p-1">
          {["overview", "annonces", "orders", "stats"].map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                tab === t
                  ? "bg-white/10 text-white"
                  : "text-white/40 hover:text-white/60"
              }`}
            >
              {t === "overview"
                ? "Vue d'ensemble"
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </Pressable>
          ))}
        </View>
      </View>

      {tab === "overview" && (
        <View className="gap-3">
          {statItems.map((item) => (
            <View
              key={item.label}
              className="p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <View className="flex items-center justify-between">
                <item.icon size={16} style={{ color: item.color }} />
                <Text className="text-white font-bold text-lg">
                  {item.value}
                </Text>
              </View>
              <Text className="text-white/40 text-xs mt-1">{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {tab === "annonces" && (
        <View className="space-y-2">
          {annonces?.map((a) => (
            <View
              key={a._id}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <Image
               
               
                className="w-10 h-10 rounded-lg object-cover"
               source={{ uri: a.images?.[0] }} accessibilityLabel={a.title}/>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-sm truncate">{a.title}</Text>
                <Text className="text-white/40 text-xs">
                  {a.viewCount} vues · {a.likeCount} favoris
                </Text>
              </View>
              <Text className="text-white/30 text-xs">
                {a.status || "Actif"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {tab === "orders" && (
        <View className="space-y-2">
          <View className="text-white/40 text-sm text-center py-4">
            <Text>Fonctionnalité à venir : liste des commandes</Text></View>
        </View>
      )}
    </View>
  );
}

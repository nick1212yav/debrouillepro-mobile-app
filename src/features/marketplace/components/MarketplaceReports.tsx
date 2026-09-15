import { View, Text, Pressable } from "react-native";

// src/features/marketplace/components/MarketplaceReports.tsx
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  TrendingUp,
  ShoppingBag,
  Star,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown,
  Loader2,
  BarChart3,
  PieChart,
} from "lucide-react-native";

interface ReportStats {
  totalRevenue: number;
  totalOrders: number;
  averageRating: number;
  totalReviews: number;
  conversionRate: number;
  salesByDay: { date: string; count: number; revenue: number }[];
  salesByCategory: { category: string; revenue: number; orders: number }[];
  recentReviews: {
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
}

// Données simulées pour l'exemple
const MOCK_STATS: ReportStats = {
  totalRevenue: 1250000,
  totalOrders: 42,
  averageRating: 4.7,
  totalReviews: 28,
  conversionRate: 3.2,
  salesByDay: [
    { date: "2025-07-14", count: 3, revenue: 150000 },
    { date: "2025-07-15", count: 5, revenue: 210000 },
    { date: "2025-07-16", count: 2, revenue: 80000 },
    { date: "2025-07-17", count: 7, revenue: 320000 },
    { date: "2025-07-18", count: 4, revenue: 180000 },
    { date: "2025-07-19", count: 6, revenue: 250000 },
    { date: "2025-07-20", count: 3, revenue: 120000 },
  ],
  salesByCategory: [
    { category: "Électronique", revenue: 450000, orders: 12 },
    { category: "Mode", revenue: 280000, orders: 8 },
    { category: "Maison & Jardin", revenue: 210000, orders: 7 },
    { category: "Alimentation", revenue: 160000, orders: 9 },
    { category: "Autre", revenue: 150000, orders: 6 },
  ],
  recentReviews: [
    {
      id: "1",
      reviewerName: "Jean K.",
      rating: 5,
      comment: "Produit excellent, livraison rapide !",
      date: "2025-07-19",
    },
    {
      id: "2",
      reviewerName: "Marie L.",
      rating: 4,
      comment: "Bonne qualité, emballage soigné.",
      date: "2025-07-18",
    },
    {
      id: "3",
      reviewerName: "Paul D.",
      rating: 5,
      comment: "Parfait, conforme à la description.",
      date: "2025-07-17",
    },
  ],
};

export function MarketplaceReports() {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("week");

  // Remplacer par une vraie requête Convex
  // const statsData = useQuery(api.commerce.getSellerStats, { period });
  // useEffect(() => {
  //   if (statsData) {
  //     setStats(statsData);
  //     setLoading(false);
  //   }
  // }, [statsData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(MOCK_STATS);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <View className="flex items-center justify-center py-12"><Loader2 size={24} className="text-white/40 animate-spin" /></View>
    );
  }

  if (!stats) {
    return (
      <View className="text-center py-8 text-white/40 text-sm"><Text>Aucune donnée disponible.</Text></View>
    );
  }

  const maxRevenue = Math.max(...stats.salesByDay.map((d) => d.revenue));
  const maxCategoryRevenue = Math.max(
    ...stats.salesByCategory.map((c) => c.revenue),
  );

  return (
    <View className="space-y-6 p-4">{}<View className="flex items-center justify-between"><Text className="text-white font-bold text-lg">Rapports de vente</Text><View className="flex gap-1 bg-white/5 rounded-xl p-1">{(["week", "month", "year"] as const).map((p) => (
            <Pressable key={p} onPress={() => setPeriod(p)} className={`
                px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${period === p ? "bg-orange-500 text-white" : "text-white/40 hover:text-white/80"}
              `}>{p === "week" ? "Semaine" : p === "month" ? "Mois" : "Année"}</Pressable>
          ))}</View></View>{}<View className="gap-3"><View className="p-3 rounded-2xl bg-white/5 border border-white/5"><View className="flex items-center justify-between"><DollarSign size={16} className="text-orange-400" /><Text className="text-[10px] text-green-400 flex items-center"><ArrowUp size={10} />+12%
            </Text></View><Text className="text-white font-bold text-lg mt-1">{stats.totalRevenue.toLocaleString()}FCFA
          </Text><Text className="text-white/40 text-[10px]">Chiffre d'affaires</Text></View><View className="p-3 rounded-2xl bg-white/5 border border-white/5"><View className="flex items-center justify-between"><ShoppingBag size={16} className="text-blue-400" /></View><Text className="text-white font-bold text-lg mt-1">{stats.totalOrders}</Text><Text className="text-white/40 text-[10px]">Commandes</Text></View><View className="p-3 rounded-2xl bg-white/5 border border-white/5"><View className="flex items-center justify-between"><Star size={16} className="text-yellow-400" /></View><Text className="text-white font-bold text-lg mt-1">{stats.averageRating.toFixed(1)}★
          </Text><Text className="text-white/40 text-[10px]">Note moyenne ({stats.totalReviews}avis)
          </Text></View><View className="p-3 rounded-2xl bg-white/5 border border-white/5"><View className="flex items-center justify-between"><TrendingUp size={16} className="text-green-400" /></View><Text className="text-white font-bold text-lg mt-1">{stats.conversionRate}%
          </Text><Text className="text-white/40 text-[10px]">Taux de conversion</Text></View></View>{}<View className="rounded-2xl bg-white/5 border border-white/5 p-4"><Text className="text-white text-sm font-medium mb-3">Ventes quotidiennes (7 derniers jours)
        </Text><View className="flex items-end gap-1 h-32">{stats.salesByDay.map((day) => {
            const heightPercent =
              maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
            return (
              <View key={day.date} className="flex-1 flex flex-col items-center gap-1"><Text className="text-[8px] text-white/30">{day.revenue.toLocaleString()}</Text><View className="w-full rounded-t-lg bg-orange-500/80 transition-all" style={{ height: `${heightPercent}%`, minHeight: 4 }} /><Text className="text-[8px] text-white/30">{new Date(day.date).toLocaleDateString("fr", {
                    weekday: "short",
                  })}</Text></View>
            );
          })}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/5 p-4"><Text className="text-white text-sm font-medium mb-3">Répartition par catégorie
        </Text><View className="space-y-2">{stats.salesByCategory.map((cat) => {
            const widthPercent =
              maxCategoryRevenue > 0
                ? (cat.revenue / maxCategoryRevenue) * 100
                : 0;
            return (
              <View key={cat.category} className="flex items-center gap-2"><Text className="text-white/60 text-[10px] w-20 truncate">{cat.category}</Text><View className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full bg-orange-400/80 transition-all" style={{ width: `${widthPercent}%` }} /></View><Text className="text-white/60 text-[10px]">{cat.revenue.toLocaleString()}FCFA
                </Text></View>
            );
          })}</View></View>{}<View className="rounded-2xl bg-white/5 border border-white/5 p-4"><Text className="text-white text-sm font-medium mb-3 flex items-center gap-2"><Star size={14} className="text-yellow-400" />Derniers avis
        </Text><View className="space-y-2">{stats.recentReviews.map((review) => (
            <View key={review.id} className="flex items-start gap-2 text-sm"><Text className="text-white font-medium">{review.reviewerName}</Text><View className="flex text-yellow-400">{Array.from({ length: 5 }, (_, i) => (
                  <Text key={i}>{i < review.rating ? "★" : "☆"}</Text>
                ))}</View><Text className="text-white/60 text-xs flex-1">{review.comment}</Text><Text className="text-white/30 text-[10px]">{new Date(review.date).toLocaleDateString("fr")}</Text></View>
          ))}</View></View></View>
  );
}

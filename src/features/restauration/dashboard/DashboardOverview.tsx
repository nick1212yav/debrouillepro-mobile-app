import { Pressable, View, Text } from "react-native";
import { TrendingUp, ShoppingBag, Calendar, Star } from "lucide-react-native";

interface DashboardOverviewProps {
  metrics: {
    revenue: number;
    activeOrdersCount: number;
    pendingBookingsCount: number;
    rating: number;
  };
  onNavigateToSection: (
    section: "orders" | "menu" | "analytics" | "inventory",
  ) => void;
}

export function DashboardOverview({
  metrics,
  onNavigateToSection,
}: DashboardOverviewProps) {
  const cards = [
    {
      id: "revenue" as const,
      label: "Chiffre d'Affaires du Jour",
      value: `${metrics.revenue.toLocaleString()} FCFA`,
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/5 border-emerald-500/15",
      actionLabel: "Voir l'analytique",
      section: "analytics" as const,
    },
    {
      id: "orders" as const,
      label: "Commandes Actives",
      value: `${metrics.activeOrdersCount} en cuisine`,
      icon: ShoppingBag,
      color: "text-orange-400",
      bg: "bg-orange-500/5 border-orange-500/15",
      actionLabel: "Gérer l'écran de cuisine",
      section: "orders" as const,
    },
    {
      id: "bookings" as const,
      label: "Réservations de Tables",
      value: `${metrics.pendingBookingsCount} attendues`,
      icon: Calendar,
      color: "text-sky-400",
      bg: "bg-sky-500/5 border-sky-500/15",
      actionLabel: "Gérer le plan de salle",
      section: "orders" as const, // Partagé
    },
    {
      id: "rating" as const,
      label: "Note de Satisfaction",
      value: `${metrics.rating.toFixed(1)} / 5.0`,
      icon: Star,
      color: "text-amber-400",
      bg: "bg-amber-400/5 border-amber-400/15",
      actionLabel: "Consulter les avis",
      section: "analytics" as const,
    },
  ];

  return (
    <View className="gap-4 text-left">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <View
            key={card.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between h-36 ${card.bg}`}
          >
            <View className="flex justify-between items-start">
              <Text className="text-[10px] text-white/50 uppercase font-black tracking-wider leading-snug">
                {card.label}
              </Text>
              <Icon size={16} className={card.color} />
            </View>

            <View className="my-2">
              <Text className="text-xl font-black text-white">
                {card.value}
              </Text>
            </View>

            <Pressable
              onPress={() => onNavigateToSection(card.section)}
              className="text-[10px] font-black uppercase tracking-wider text-orange-400 text-left w-fit"
            >
              {card.actionLabel} <Text>➔</Text></Pressable>
          </View>
        );
      })}
    </View>
  );
}

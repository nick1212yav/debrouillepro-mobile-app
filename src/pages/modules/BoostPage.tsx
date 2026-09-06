import { UIService } from "@/core/sdk/ui/UIService";
import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  ArrowLeft, Zap, Crown, Star, Clock, CheckCircle2,
  TrendingUp, Eye, XCircle, Package,
} from "lucide-react-native";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";

const BOOST_TIERS = {
  basic: { label: "Basic",  days: 3,  price: "2 500 FC", color: "#10B981", Icon: Zap,    bg: "rgba(16,185,129,0.15)",  description: "Visibilité x2 pendant 3 jours" },
  pro:   { label: "Pro",    days: 7,  price: "5 000 FC", color: "#6366F1", Icon: Star,   bg: "rgba(99,102,241,0.15)",  description: "Visibilité x5, badge violet pendant 7 jours" },
  elite: { label: "Elite",  days: 30, price: "15 000 FC", color: "#F59E0B", Icon: Crown,  bg: "rgba(245,158,11,0.15)",  description: "Top du feed, badge or pendant 30 jours" },
} as const;

type Tier = keyof typeof BOOST_TIERS;

interface Props { onBack: () => void; }

export default function BoostPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();
  const myBoosts = useQuery(api.boosts.listMyBoosts, isAuthenticated ? {} : "skip");
  const cancelBoost = useMutation(api.boosts.cancelBoost);

  const now = new Date().toISOString();

  const active = (myBoosts ?? []).filter((b) => b.active && b.expiresAt > now);
  const expired = (myBoosts ?? []).filter((b) => !b.active || b.expiresAt <= now);

  return (
    <View
      className="h-full w-full flex flex-col"
      style={{  }}
    >
      {/* Header */}
      <View className="flex-shrink-0 px-5 pt-14 pb-5">
        <View className="flex items-center gap-3 mb-6">
          <Pressable onPress={onBack} className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={20} className="text-white" />
          </Pressable>
          <View>
            <Text className="text-white text-xl font-bold flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" /> Annonces Premium
            </Text>
            <Text className="text-white/40 text-xs">Boostez vos publications pour plus de visibilité</Text>
          </View>
        </View>

        {/* Tier cards */}
        <View className="space-y-3">
          {(Object.entries(BOOST_TIERS) as [Tier, typeof BOOST_TIERS[Tier]][]).map(([key, tier]) => {
            const Icon = tier.Icon;
            return (
              <View
                key={key}
                className="rounded-3xl p-4 flex items-center gap-4"
                style={{ backgroundColor: tier.bg, borderStyle: "solid" }}
              >
                <View className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tier.color}22`, borderStyle: "solid" }}>
                  <Icon size={22} style={{ color: tier.color }} />
                </View>
                <View className="flex-1 min-w-0">
                  <View className="flex items-center gap-2">
                    <Text className="text-white font-bold text-base">{tier.label}</Text>
                    <Text className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${tier.color}22`, color: tier.color }}>{tier.days} jours</Text>
                  </View>
                  <Text className="text-white/50 text-xs mt-0.5">{tier.description}</Text>
                </View>
                <View className="text-right flex-shrink-0">
                  <Text className="font-black text-sm" style={{ color: tier.color }}>{tier.price}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View className="mt-3 p-3 rounded-2xl" style={{ backgroundColor: "rgba(99,102,241,0.08)", borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", borderStyle: "solid" }}>
          <Text className="text-white/50 text-xs leading-relaxed">
            Pour booster une publication, ouvrez-la depuis le feed et appuyez sur le bouton <Text className="text-violet-400 font-semibold">Booster</Text>. Le paiement se fait via Mobile Money ou Wallet.
          </Text>
        </View>
      </View>

      {/* Active boosts */}
      <View className="flex-1 overflow-y-auto px-5 pb-8" style={{  }}>
        {myBoosts === undefined ? (
          <View className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
          </View>
        ) : (
          <>
            {active.length > 0 && (
              <View className="space-y-3 mb-5">
                <Text className="text-white/60 text-xs font-semibold flex items-center gap-1.5">
                  <TrendingUp size={12} className="text-green-400" /> Boosts actifs
                </Text>
                {active.map((boost) => (
                  <BoostCard
                    key={boost._id}
                    boost={boost}
                    onCancel={async () => {
                      await cancelBoost({ boostId: boost._id as Id<"publicationBoosts"> });
                      UIService.openToast("Boost annulé", "success");
                    }}
                  />
                ))}
              </View>
            )}

            {expired.length > 0 && (
              <View className="space-y-3">
                <Text className="text-white/40 text-xs font-semibold flex items-center gap-1.5">
                  <Clock size={12} /> Historique
                </Text>
                {expired.map((boost) => (
                  <BoostCard key={boost._id} boost={boost} expired />
                ))}
              </View>
            )}

            {(myBoosts ?? []).length === 0 && (
              <View className="flex flex-col items-center justify-center py-10 gap-3">
                <Package size={36} className="text-white/20" />
                <Text className="text-white/40 text-sm">Aucun boost actif</Text>
                <Text className="text-white/25 text-xs text-center">Boostez vos publications depuis le feed pour les mettre en avant</Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ── Boost Card ──────────────────────────────────────────────────────────────
type BoostItem = {
  _id: string;
  tier: Tier;
  expiresAt: string;
  startsAt: string;
  active: boolean;
  publication: { _id: string; title: string; type: string } | null;
};

function BoostCard({ boost, expired = false, onCancel }: { boost: BoostItem; expired?: boolean; onCancel?: () => Promise<void> }) {
  const tier = BOOST_TIERS[boost.tier];
  const Icon = tier.Icon;
  const daysLeft = differenceInDays(parseISO(boost.expiresAt), new Date());

  return (
    <View
      className={cn("rounded-2xl p-4 flex items-center gap-3", expired && "opacity-50")}
      style={{ backgroundColor: expired ? "rgba(255,255,255,0.03)" : tier.bg, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
    >
      <View className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${tier.color}22` }}>
        <Icon size={16} style={{ color: expired ? "#6B7280" : tier.color }} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-white text-sm font-semibold truncate">{boost.publication?.title ?? "Publication"}</Text>
        <View className="flex items-center gap-2 mt-0.5">
          <Text className="text-xs font-bold" style={{ color: expired ? "#6B7280" : tier.color }}>{tier.label}</Text>
          {expired ? (
            <Text className="text-white/30 text-xs flex items-center gap-1"><XCircle size={9} /> <Text>Expiré</Text></Text>
          ) : (
            <Text className="text-white/50 text-xs flex items-center gap-1">
              <Clock size={9} /> {daysLeft > 0 ? `${daysLeft}j restants` : "Expire aujourd'hui"}
            </Text>
          )}
        </View>
        <Text className="text-white/25 text-[10px] mt-0.5">
          <Text>Jusqu'au</Text>{format(parseISO(boost.expiresAt), "d MMM yyyy", { locale: fr })}
        </Text>
      </View>
      {!expired && onCancel && (
        <Pressable
          onPress={() => void onCancel()}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400"
          style={{ backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", borderStyle: "solid" }}
        >
          <XCircle size={11} /> <Text>Annuler</Text></Pressable>
      )}
      {expired && (
        <CheckCircle2 size={16} className="text-white/20 flex-shrink-0" />
      )}
      <Eye size={14} className={cn("flex-shrink-0", expired ? "text-white/15" : "text-white/30")} />
    </View>
  );
}

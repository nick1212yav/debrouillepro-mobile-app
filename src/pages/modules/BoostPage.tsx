import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Crown,
  Eye,
  Package,
  Star,
  TrendingUp,
  XCircle,
  Zap,
} from "lucide-react-native";
import { useMutation, useQuery } from "convex/react";
import { useConvexAuth } from "@/lib/convex-auth-compat";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface Props {
  onBack: () => void;
}

/**
 * Catalogue produit.
 *
 * Ces valeurs correspondent au catalogue déjà défini dans
 * l'implémentation fournie.
 *
 * Elles ne représentent PAS des données utilisateur.
 * Les boosts eux-mêmes, leurs dates, leur statut et leur
 * publication viennent exclusivement de Convex.
 */
const BOOST_TIERS = {
  basic: {
    label: "Basic",
    days: 3,
    price: "2 500 FC",
    color: "#10B981",
    Icon: Zap,
    background: "rgba(16,185,129,0.10)",
    description: "Visibilité renforcée pendant 3 jours",
  },
  pro: {
    label: "Pro",
    days: 7,
    price: "5 000 FC",
    color: "#6366F1",
    Icon: Star,
    background: "rgba(99,102,241,0.10)",
    description: "Visibilité renforcée pendant 7 jours",
  },
  elite: {
    label: "Elite",
    days: 30,
    price: "15 000 FC",
    color: "#F59E0B",
    Icon: Crown,
    background: "rgba(245,158,11,0.10)",
    description: "Mise en avant pendant 30 jours",
  },
} as const;

type Tier = keyof typeof BOOST_TIERS;

type BoostItem = {
  _id: Id<"publicationBoosts">;
  tier: Tier;
  expiresAt: string;
  startsAt: string;
  active: boolean;
  publication: {
    _id: string;
    title: string;
    type: string;
  } | null;
};

function isValidTier(value: unknown): value is Tier {
  return value === "basic" || value === "pro" || value === "elite";
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const date = parseISO(value);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function getDaysRemaining(expiresAt: string): number | null {
  const expires = parseDate(expiresAt);

  if (!expires) {
    return null;
  }

  const remainingMs = expires.getTime() - Date.now();

  return Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));
}

function formatExpiration(expiresAt: string): string {
  const date = parseDate(expiresAt);

  if (!date) {
    return "Date indisponible";
  }

  return format(date, "d MMM yyyy", {
    locale: fr,
  });
}

/* ─────────────────────────────────────────────
   Tier card
───────────────────────────────────────────── */

const TierCard = memo(function TierCard({
  tier,
}: {
  tier: (typeof BOOST_TIERS)[Tier];
}) {
  const Icon = tier.Icon;

  return (
    <View
      className="mb-3 rounded-3xl border p-4"
      style={{
        backgroundColor: tier.background,
        borderColor: `${tier.color}25`,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="mr-4 h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${tier.color}18`,
          }}
        >
          <Icon size={22} color={tier.color} strokeWidth={2} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-white">{tier.label}</Text>

            <View
              className="ml-2 rounded-full px-2 py-1"
              style={{
                backgroundColor: `${tier.color}18`,
              }}
            >
              <Text
                className="text-[10px] font-bold"
                style={{
                  color: tier.color,
                }}
              >
                {tier.days} jours
              </Text>
            </View>
          </View>

          <Text className="mt-1 text-xs leading-4 text-white/45">
            {tier.description}
          </Text>
        </View>

        <Text
          className="ml-2 text-sm font-black"
          style={{
            color: tier.color,
          }}
        >
          {tier.price}
        </Text>
      </View>
    </View>
  );
});

/* ─────────────────────────────────────────────
   Boost card
───────────────────────────────────────────── */

const BoostCard = memo(function BoostCard({
  boost,
  expired,
  onCancel,
  cancelling,
}: {
  boost: BoostItem;
  expired?: boolean;
  onCancel?: () => void;
  cancelling?: boolean;
}) {
  const tier = isValidTier(boost.tier) ? BOOST_TIERS[boost.tier] : null;

  const Icon = tier?.Icon ?? Package;

  const daysLeft = useMemo(
    () => getDaysRemaining(boost.expiresAt),
    [boost.expiresAt],
  );

  const expirationLabel = useMemo(
    () => formatExpiration(boost.expiresAt),
    [boost.expiresAt],
  );

  const title = boost.publication?.title?.trim() || "Publication sans titre";

  return (
    <View
      className="mb-3 rounded-2xl border p-4"
      style={{
        backgroundColor: expired
          ? "rgba(255,255,255,0.025)"
          : (tier?.background ?? "rgba(255,255,255,0.04)"),
        borderColor: expired
          ? "rgba(255,255,255,0.06)"
          : `${tier?.color ?? "#64748B"}28`,
        opacity: expired ? 0.65 : 1,
      }}
    >
      <View className="flex-row items-center">
        <View
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
          style={{
            backgroundColor: expired
              ? "rgba(255,255,255,0.05)"
              : `${tier?.color ?? "#64748B"}18`,
          }}
        >
          <Icon
            size={17}
            color={
              expired ? "rgba(255,255,255,0.35)" : (tier?.color ?? "#94A3B8")
            }
          />
        </View>

        <View className="flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-white">
            {title}
          </Text>

          <View className="mt-1 flex-row items-center">
            {tier ? (
              <Text
                className="text-xs font-bold"
                style={{
                  color: expired ? "#64748B" : tier.color,
                }}
              >
                {tier.label}
              </Text>
            ) : (
              <Text className="text-xs font-bold text-white/40">Offre</Text>
            )}

            <Text className="mx-2 text-xs text-white/20">•</Text>

            {expired ? (
              <View className="flex-row items-center">
                <XCircle size={11} color="rgba(255,255,255,0.30)" />

                <Text className="ml-1 text-xs text-white/30">Expiré</Text>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Clock size={11} color="rgba(255,255,255,0.45)" />

                <Text className="ml-1 text-xs text-white/45">
                  {daysLeft === null
                    ? "Durée indisponible"
                    : daysLeft > 0
                      ? `${daysLeft}j restants`
                      : "Expire aujourd'hui"}
                </Text>
              </View>
            )}
          </View>

          <Text className="mt-1 text-[10px] text-white/25">
            Jusqu'au {expirationLabel}
          </Text>
        </View>

        {!expired && onCancel ? (
          <Pressable
            onPress={onCancel}
            disabled={cancelling}
            accessibilityRole="button"
            accessibilityLabel="Annuler le boost"
            className="ml-2 flex-row items-center rounded-xl border px-2.5 py-2"
            style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.18)",
              opacity: cancelling ? 0.55 : 1,
            }}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color="#F87171" />
            ) : (
              <>
                <XCircle size={12} color="#F87171" />

                <Text className="ml-1 text-[10px] font-semibold text-red-400">
                  Annuler
                </Text>
              </>
            )}
          </Pressable>
        ) : null}

        {expired ? (
          <CheckCircle2
            size={17}
            color="rgba(255,255,255,0.20)"
            style={{ marginLeft: 8 }}
          />
        ) : null}

        <Eye
          size={14}
          color={expired ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.28)"}
          style={{ marginLeft: 8 }}
        />
      </View>
    </View>
  );
});

/* ─────────────────────────────────────────────
   Empty state
───────────────────────────────────────────── */

const EmptyBoosts = memo(function EmptyBoosts() {
  return (
    <View className="items-center rounded-3xl border border-white/10 bg-white/[0.025] px-6 py-10">
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.05]">
        <Package size={28} color="rgba(255,255,255,0.22)" />
      </View>

      <Text className="text-center text-sm font-semibold text-white/65">
        Aucun boost
      </Text>

      <Text className="mt-2 text-center text-xs leading-5 text-white/30">
        Vos boosts apparaîtront ici dès qu'une publication aura été mise en
        avant.
      </Text>
    </View>
  );
});

/* ─────────────────────────────────────────────
   Main
───────────────────────────────────────────── */

export default function BoostPage({ onBack }: Props) {
  const { isAuthenticated } = useConvexAuth();

  const myBoosts = useQuery(
    api.boosts.listMyBoosts,
    isAuthenticated ? {} : "skip",
  );

  const cancelBoost = useMutation(api.boosts.cancelBoost);

  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const currentTime = Date.now();

  const { active, expired } = useMemo(() => {
    const boosts = (myBoosts ?? []) as BoostItem[];

    const activeBoosts: BoostItem[] = [];
    const expiredBoosts: BoostItem[] = [];

    for (const boost of boosts) {
      const expires = parseDate(boost.expiresAt);

      const isCurrentlyActive =
        boost.active === true &&
        expires !== null &&
        expires.getTime() > currentTime;

      if (isCurrentlyActive) {
        activeBoosts.push(boost);
      } else {
        expiredBoosts.push(boost);
      }
    }

    return {
      active: activeBoosts,
      expired: expiredBoosts,
    };
  }, [myBoosts, currentTime]);

  const handleCancel = useCallback(
    (boostId: Id<"publicationBoosts">) => {
      if (cancellingId !== null) {
        return;
      }

      Alert.alert(
        "Annuler le boost",
        "Voulez-vous réellement annuler ce boost ?",
        [
          {
            text: "Conserver",
            style: "cancel",
          },
          {
            text: "Annuler le boost",
            style: "destructive",
            onPress: () => {
              void (async () => {
                try {
                  setCancellingId(String(boostId));

                  await cancelBoost({
                    boostId,
                  });
                } catch (error) {
                  console.error("[BoostPage] cancelBoost failed:", error);

                  Alert.alert(
                    "Action impossible",
                    "Le boost n'a pas pu être annulé. Vérifiez votre connexion puis réessayez.",
                  );
                } finally {
                  setCancellingId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [cancelBoost, cancellingId],
  );

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-[#050812]">
        <View className="border-b border-white/5 px-5 pb-4 pt-14">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
            <Zap size={28} color="#A78BFA" />
          </View>

          <Text className="text-center text-lg font-bold text-white">
            Connectez-vous pour accéder à vos boosts
          </Text>

          <Text className="mt-2 text-center text-xs leading-5 text-white/40">
            Vos promotions sont liées à votre compte et ne peuvent être
            affichées sans authentification.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050812]">
      {/* Header */}
      <View className="border-b border-white/5 px-5 pb-5 pt-14">
        <View className="flex-row items-center">
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="mr-3 h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </Pressable>

          <View className="flex-1">
            <View className="flex-row items-center">
              <Zap size={18} color="#FBBF24" />

              <Text className="ml-2 text-xl font-bold text-white">
                Boosts Premium
              </Text>
            </View>

            <Text className="mt-1 text-xs text-white/40">
              Donnez davantage de visibilité à vos publications
            </Text>
          </View>
        </View>

        {/* Catalogue */}
        <View className="mt-5">
          {(Object.keys(BOOST_TIERS) as Tier[]).map((tierKey) => (
            <TierCard key={tierKey} tier={BOOST_TIERS[tierKey]} />
          ))}
        </View>

        <View className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.06] p-3">
          <Text className="text-xs leading-5 text-white/50">
            Pour booster une publication, ouvrez-la depuis le feed puis utilisez
            l'action « Booster ». Le paiement est traité par le système de
            paiement configuré pour votre compte.
          </Text>
        </View>
      </View>

      {/* Boost list */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {myBoosts === undefined ? (
          <View className="items-center py-12">
            <ActivityIndicator size="small" color="#A78BFA" />

            <Text className="mt-3 text-xs text-white/35">
              Chargement de vos boosts…
            </Text>
          </View>
        ) : (
          <>
            {active.length > 0 ? (
              <View className="mb-5">
                <View className="mb-3 flex-row items-center">
                  <TrendingUp size={13} color="#34D399" />

                  <Text className="ml-2 text-xs font-semibold text-white/60">
                    Boosts actifs
                  </Text>

                  <View className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-emerald-400">
                      {active.length}
                    </Text>
                  </View>
                </View>

                {active.map((boost) => (
                  <BoostCard
                    key={String(boost._id)}
                    boost={boost}
                    expired={false}
                    cancelling={cancellingId === String(boost._id)}
                    onCancel={() => handleCancel(boost._id)}
                  />
                ))}
              </View>
            ) : null}

            {expired.length > 0 ? (
              <View>
                <View className="mb-3 flex-row items-center">
                  <Clock size={13} color="rgba(255,255,255,0.35)" />

                  <Text className="ml-2 text-xs font-semibold text-white/40">
                    Historique
                  </Text>

                  <View className="ml-2 rounded-full bg-white/[0.05] px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-white/30">
                      {expired.length}
                    </Text>
                  </View>
                </View>

                {expired.map((boost) => (
                  <BoostCard key={String(boost._id)} boost={boost} expired />
                ))}
              </View>
            ) : null}

            {active.length === 0 && expired.length === 0 ? (
              <EmptyBoosts />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text } from "react-native";
import { useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.js";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Zap,
  Star,
  Crown,
  Check,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react-native";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    key: "basic" as const,
    label: "Basic",
    days: 3,
    price: "2 500 FC",
    color: "#10B981",
    Icon: Zap,
    desc: "Une visibilité renforcée pour donner un premier élan.",
    highlight: "Visibilité ×2",
  },
  {
    key: "pro" as const,
    label: "Pro",
    days: 7,
    price: "5 000 FC",
    color: "#6366F1",
    Icon: Star,
    desc: "Le meilleur équilibre pour toucher davantage de personnes.",
    highlight: "Visibilité ×5",
    popular: true,
  },
  {
    key: "elite" as const,
    label: "Elite",
    days: 30,
    price: "15 000 FC",
    color: "#F59E0B",
    Icon: Crown,
    desc: "Une présence maximale avec une mise en avant prolongée.",
    highlight: "Top du feed",
  },
];

type BoostTier = (typeof TIERS)[number]["key"];

interface Props {
  open: boolean;
  onClose: () => void;
  publicationId: Id<"publications"> | null;
  publicationTitle?: string;
}

export default function BoostSheet({
  open,
  onClose,
  publicationId,
  publicationTitle,
}: Props) {
  const [selected, setSelected] = useState<BoostTier>("pro");
  const [loading, setLoading] = useState(false);

  const activateBoost = useMutation(api.boosts.activateBoost);

  const selectedTier = useMemo(
    () => TIERS.find((tier) => tier.key === selected) ?? TIERS[1],
    [selected],
  );

  const handleBoost = async () => {
    if (!publicationId || loading) return;

    setLoading(true);

    try {
      await activateBoost({
        publicationId,
        tier: selected,
      });

      UIService.openToast(`Boost ${selectedTier.label} activé`, "success");

      onClose();
    } catch {
      UIService.openToast("Impossible d'activer le Boost", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !loading) {
      onClose();
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className={cn(
          "overflow-hidden border-0 p-0",
          "rounded-t-[32px] sm:rounded-t-[38px]",
          "max-h-[92vh] sm:max-h-[88vh]",
        )}
        style={{  }}
      >
        {/* ─────────────────────────────────────────────
            Ambient background
        ───────────────────────────────────────────── */}

        <View
          className="absolute -top-40 left-1/2 h-72 w-[75%] -translate-x-1/2 rounded-full"
          style={{  }}
        />

        <View
          className="absolute top-0 left-0 right-0 h-px"
          style={{  }}
        />

        {/* Handle */}
        <View className="relative z-20 flex justify-center pt-3 pb-1">
          <View className="h-1.5 w-11 rounded-full bg-white/15" />
        </View>

        {/* ─────────────────────────────────────────────
            Header
        ───────────────────────────────────────────── */}

        <SheetHeader className="relative z-10 px-5 pt-3 pb-4 sm:px-7">
          <View className="flex items-start gap-4">
            <View
              className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[17px]"
              style={{ borderWidth: 1, borderColor: "rgba(245,158,11,.25)", borderStyle: "solid" }}
            >
              <Zap size={22} className="text-amber-300" fill="currentColor" />

              <View
                className="absolute inset-0 rounded-[17px]"
               
              />
            </View>

            <View className="min-w-0 flex-1 text-left">
              <SheetTitle className="flex items-center gap-2 text-[19px] font-black tracking-tight text-white">
                <Text>Booster votre publication</Text><Sparkles size={15} className="text-amber-300/80" />
              </SheetTitle>

              <Text className="mt-1 text-xs leading-5 text-white/38">
                Donnez à votre contenu la visibilité qu'il mérite.
              </Text>

              {publicationTitle && (
                <View
                  className="mt-3 rounded-xl px-3 py-2"
                  style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.06)", borderStyle: "solid" }}
                >
                  <Text className="truncate text-[11px] font-medium text-white/48">
                    {publicationTitle}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SheetHeader>

        {/* ─────────────────────────────────────────────
            Content
        ───────────────────────────────────────────── */}

        <View
          className="relative z-10 flex-1 overflow-y-auto px-5 pb-4 sm:px-7"
          style={{  }}
        >
          {/* Value proposition */}
          <View className="mb-4 gap-2">
            {[
              {
                icon: TrendingUp,
                label: "Plus de portée",
              },
              {
                icon: Sparkles,
                label: "Plus visible",
              },
              {
                icon: ShieldCheck,
                label: "Activation sécurisée",
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <View
                  key={item.label}
                  className="flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,.035)", borderWidth: 1, borderColor: "rgba(255,255,255,.055)", borderStyle: "solid" }}
                >
                  <Icon size={14} className="text-amber-300/70" />
                  <Text className="text-[9px] font-semibold leading-3 text-white/30">
                    {item.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Section label */}
          <View className="mb-2.5 flex items-center justify-between">
            <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-white/25">
              Choisissez votre niveau
            </Text>

            <Text className="text-[9px] font-medium text-white/20">
              Sans engagement
            </Text>
          </View>

          {/* Tiers */}
          <View className="space-y-3">
            {TIERS.map((tier, index) => {
              const Icon = tier.Icon;
              const isSelected = selected === tier.key;

              return (
                <Pressable
                  key={tier.key}
                  onPress={() => {
                    if (!loading) {
                      setSelected(tier.key);
                    }
                  }}
                  disabled={loading}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative w-full overflow-hidden rounded-[23px] p-4 text-left",
                    "transition-all duration-300",
                    "disabled:cursor-not-allowed",
                  )}
                  style={{ borderColor: "rgba(255,255,255,.075)", borderStyle: "solid" }}
                >
                  {/* Selected glow */}
                  {isSelected && (
                    <View
                      className="absolute inset-0"
                      style={{  }}
                    />
                  )}

                  {/* Popular badge */}
                  {tier.popular && (
                    <View
                      className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: `${tier.color}20`, borderStyle: "solid" }}
                    >
                      <Star size={9} fill="currentColor" />
                      <Text>Recommandé</Text></View>
                  )}

                  <View className="relative flex items-center gap-3">
                    {/* Icon */}
                    <View
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[15px]"
                      style={{ backgroundColor: `${tier.color}18`, borderStyle: "solid" }}
                    >
                      <Icon
                        size={19}
                        style={{
                          color: tier.color,
                        }}
                        fill={
                          tier.key === "elite" && isSelected
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </View>

                    {/* Main information */}
                    <View className="min-w-0 flex-1">
                      <View className="flex items-center gap-2">
                        <Text className="text-sm font-black text-white">
                          {tier.label}
                        </Text>

                        <Text
                          className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                          style={{ backgroundColor: `${tier.color}18`, color: tier.color }}
                        >
                          {tier.days} jours
                        </Text>
                      </View>

                      <Text className="mt-1 text-[11px] leading-4 text-white/38">
                        {tier.desc}
                      </Text>

                      <View className="mt-2 flex items-center gap-1.5">
                        <TrendingUp
                          size={10}
                          style={{
                            color: tier.color,
                          }}
                        />

                        <Text
                          className="text-[9px] font-bold"
                          style={{
                            color: tier.color,
                          }}
                        >
                          {tier.highlight}
                        </Text>
                      </View>
                    </View>

                    {/* Price / selected */}
                    <View className="flex flex-shrink-0 flex-col items-end gap-2">
                      <Text
                        className="text-sm font-black"
                        style={{
                          color: tier.color,
                        }}
                      >
                        {tier.price}
                      </Text>

                      <View
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: isSelected
                                                    ? tier.color
                                                    : "rgba(255,255,255,.07)", borderColor: "rgba(255,255,255,.08)", borderStyle: "solid" }}
                      >
                        {isSelected && (
                          <Check
                            size={11}
                            strokeWidth={3}
                            className="text-white"
                          />
                        )}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Selected plan summary */}
          <>
            <View
              key={selectedTier.key}
              className="mt-4 rounded-2xl p-3.5"
              style={{ borderStyle: "solid" }}
            >
              <View className="flex items-center gap-2">
                <View
                  className="h-6 w-6 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${selectedTier.color}18` }}
                >
                  <Check
                    size={12}
                    style={{
                      color: selectedTier.color,
                    }}
                  />
                </View>

                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] font-bold text-white/65">
                    Offre sélectionnée : {selectedTier.label}
                  </Text>

                  <Text className="mt-0.5 text-[9px] text-white/25">
                    {selectedTier.days} jours · {selectedTier.price}
                  </Text>
                </View>

                <ArrowRight
                  size={13}
                  style={{
                    color: selectedTier.color,
                  }}
                />
              </View>
            </View>
          </>
        </View>

        {/* ─────────────────────────────────────────────
            CTA
        ───────────────────────────────────────────── */}

        <View
          className="relative z-20 flex-shrink-0 border-t border-white/[0.07] px-5 pt-4 sm:px-7"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom))" }}
        >
          <Pressable
            onPress={() => void handleBoost()}
            disabled={loading || !publicationId}
            className={cn(
              "relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-[20px] py-4",
              "text-sm font-black text-white",
              "transition-all",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            style={{  }}
          >
            {/* CTA shine */}
            {!loading && (
              <View
                className="absolute inset-y-0 -left-1/3 w-1/3"
                style={{  }}
              />
            )}

            {loading ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                <Text>Activation en cours…</Text></>
            ) : (
              <>
                <Zap size={17} fill="currentColor" />
                <Text>Activer le Boost</Text>{selectedTier.label}
                <ArrowRight size={15} />
              </>
            )}
          </Pressable>

          <View className="mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck size={11} className="text-emerald-300/45" />

            <Text className="text-center text-[9px] text-white/22">
              <Text>Le paiement sera débité de votre Wallet ou Mobile Money.</Text></Text>
          </View>
        </View>
      </SheetContent>
    </Sheet>
  );
}

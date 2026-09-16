import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Info,
  LockKeyhole,
  Plus,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel.d.ts";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";
import { Skeleton } from "@/components/ui/skeleton.tsx";

interface FinancesPageProps {
  onBack: () => void;
}

type FinanceTab = "Portefeuille" | "Épargne" | "Simuler";

type AddAssetForm = {
  symbol: string;
  name: string;
  sector: string;
  quantity: string;
  buyPrice: string;
  currentPrice: string;
};

type AddGoalForm = {
  name: string;
  targetAmount: string;
  currentAmount: string;
  monthlyContribution: string;
  color: string;
};

type FeedbackState = {
  type: "success" | "error" | "info";
  message: string;
} | null;

const TABS: FinanceTab[] = ["Portefeuille", "Épargne", "Simuler"];

/*
 * IMPORTANT
 * ----------
 * Ce code conserve la devise attendue actuellement par le backend.
 * Vérifier impérativement le contrat de convex/finances.ts avant
 * toute utilisation financière réelle en RDC.
 */
const BACKEND_CURRENCY = "XAF";
const DISPLAY_CURRENCY = "FCFA";

const SECTOR_COLORS: Record<string, string> = {
  Télécom: "#F97316",
  Finance: "#6366F1",
  Énergie: "#FBBF24",
  Technologie: "#10B981",
  Agriculture: "#84CC16",
  Autre: "#8B5CF6",
};

const GOAL_COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
];

function formatMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return `0 ${DISPLAY_CURRENCY}`;
  }

  return `${new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} ${DISPLAY_CURRENCY}`;
}

function formatCompactMoney(value: number): string {
  if (!Number.isFinite(value)) {
    return `0 ${DISPLAY_CURRENCY}`;
  }

  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1_000_000_000) {
    return `${sign}${(absolute / 1_000_000_000).toFixed(1)} Md`;
  }

  if (absolute >= 1_000_000) {
    return `${sign}${(absolute / 1_000_000).toFixed(1)} M`;
  }

  if (absolute >= 1_000) {
    return `${sign}${Math.round(absolute / 1_000)} k`;
  }

  return `${sign}${Math.round(absolute)}`;
}

function parsePositiveNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseNonNegativeNumber(value: string): number | null {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, value));
}

function FeedbackBanner({
  feedback,
  onClose,
}: {
  feedback: FeedbackState;
  onClose: () => void;
}) {
  if (!feedback) {
    return null;
  }

  const isError = feedback.type === "error";
  const isSuccess = feedback.type === "success";

  const backgroundColor = isError
    ? "rgba(239,68,68,0.09)"
    : isSuccess
      ? "rgba(16,185,129,0.09)"
      : "rgba(99,102,241,0.09)";

  const borderColor = isError
    ? "rgba(239,68,68,0.18)"
    : isSuccess
      ? "rgba(16,185,129,0.18)"
      : "rgba(99,102,241,0.18)";

  const textColor = isError ? "#FCA5A5" : isSuccess ? "#6EE7B7" : "#A5B4FC";

  return (
    <View
      className="mx-4 mb-3 flex-row items-start rounded-2xl px-4 py-3"
      style={{
        backgroundColor,
        borderWidth: 1,
        borderColor,
      }}
    >
      {isError ? (
        <Info size={16} color={textColor} />
      ) : isSuccess ? (
        <Check size={16} color={textColor} />
      ) : (
        <Info size={16} color={textColor} />
      )}

      <Text
        className="ml-2 flex-1 text-xs leading-5"
        style={{ color: textColor }}
      >
        {feedback.message}
      </Text>

      <Pressable
        onPress={onClose}
        className="ml-2 h-6 w-6 items-center justify-center"
        accessibilityRole="button"
        accessibilityLabel="Fermer le message"
      >
        <X size={14} color={textColor} />
      </Pressable>
    </View>
  );
}

function MetricCard({
  label,
  value,
  caption,
  icon,
  accent,
}: {
  label: string;
  value: string;
  caption: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <View
      className="flex-1 rounded-3xl p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View
        className="mb-3 h-9 w-9 items-center justify-center rounded-xl"
        style={{
          backgroundColor: `${accent}15`,
        }}
      >
        {icon}
      </View>

      <Text
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "rgba(255,255,255,0.38)" }}
      >
        {label}
      </Text>

      <Text
        className="mt-1 text-base font-extrabold text-white"
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text
        className="mt-1 text-[10px]"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        {caption}
      </Text>
    </View>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View className="mb-4 flex-row items-end">
      <View className="flex-1">
        {eyebrow ? (
          <Text className="text-[10px] font-extrabold uppercase tracking-[2px] text-indigo-300">
            {eyebrow}
          </Text>
        ) : null}

        <Text className="mt-1 text-xl font-extrabold text-white">{title}</Text>
      </View>

      {action && onAction ? (
        <Pressable
          onPress={onAction}
          className="flex-row items-center rounded-xl px-3 py-2"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text className="text-[10px] font-bold text-white/55">{action}</Text>
          <ChevronRight size={13} color="rgba(255,255,255,0.4)" />
        </Pressable>
      ) : null}
    </View>
  );
}

function AssetCard({
  asset,
  onDelete,
  deleting,
}: {
  asset: {
    _id: Id<"investmentAssets">;
    symbol: string;
    name: string;
    sector: string;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    changePercent: number;
  };
  onDelete: () => void;
  deleting: boolean;
}) {
  const sectorColor = SECTOR_COLORS[asset.sector] ?? "#8B5CF6";

  const positionValue = asset.currentPrice * asset.quantity;

  const gain = (asset.currentPrice - asset.buyPrice) * asset.quantity;

  const gainPositive = gain >= 0;

  return (
    <View
      className="mb-3 overflow-hidden rounded-3xl"
      style={{
        backgroundColor: "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        opacity: deleting ? 0.5 : 1,
      }}
    >
      <View className="flex-row items-center p-4">
        <View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${sectorColor}16`,
            borderWidth: 1,
            borderColor: `${sectorColor}28`,
          }}
        >
          <Text className="text-sm font-black" style={{ color: sectorColor }}>
            {asset.symbol.slice(0, 3).toUpperCase()}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
            {asset.name}
          </Text>

          <Text className="mt-1 text-[10px] text-white/35">
            {asset.quantity} unité
            {asset.quantity !== 1 ? "s" : ""} · {asset.sector}
          </Text>

          <Text className="mt-1 text-[10px] text-white/25">
            Prix d'achat : {formatMoney(asset.buyPrice)}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-sm font-extrabold text-white">
            {formatMoney(positionValue)}
          </Text>

          <View className="mt-1 flex-row items-center">
            {gainPositive ? (
              <TrendingUp size={11} color="#34D399" />
            ) : (
              <TrendingDown size={11} color="#F87171" />
            )}

            <Text
              className="ml-1 text-[10px] font-bold"
              style={{
                color: gainPositive ? "#34D399" : "#F87171",
              }}
            >
              {gainPositive ? "+" : ""}
              {formatMoney(gain)}
            </Text>
          </View>

          <Text
            className="mt-0.5 text-[10px]"
            style={{
              color: gainPositive ? "#34D399" : "#F87171",
            }}
          >
            {asset.changePercent >= 0 ? "+" : ""}
            {asset.changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View
        className="flex-row items-center justify-between px-4 pb-3 pt-2"
        style={{
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.045)",
        }}
      >
        <View className="flex-row items-center">
          <CircleDollarSign size={12} color="rgba(255,255,255,0.28)" />
          <Text className="ml-1.5 text-[9px] text-white/25">
            Valeur calculée à partir des données saisies
          </Text>
        </View>

        <Pressable
          onPress={onDelete}
          disabled={deleting}
          className="flex-row items-center rounded-xl px-3 py-2"
          style={{
            backgroundColor: "rgba(239,68,68,0.07)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.12)",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer ${asset.name}`}
        >
          <Trash2 size={12} color="#F87171" />
          <Text className="ml-1.5 text-[9px] font-bold text-red-300">
            Supprimer
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function GoalCard({
  goal,
  onDelete,
  onContribute,
  deleting,
  contributing,
}: {
  goal: {
    _id: Id<"savingsGoals">;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
    color?: string;
  };
  onDelete: () => void;
  onContribute: () => void;
  deleting: boolean;
  contributing: boolean;
}) {
  const color = goal.color ?? "#6366F1";

  const percentage =
    goal.targetAmount > 0
      ? clampPercentage((goal.currentAmount / goal.targetAmount) * 100)
      : 0;

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

  const completed = percentage >= 100;

  return (
    <View
      className="mb-3 overflow-hidden rounded-3xl p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        opacity: deleting ? 0.5 : 1,
      }}
    >
      <View className="flex-row items-start">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: `${color}16`,
            borderWidth: 1,
            borderColor: `${color}28`,
          }}
        >
          {completed ? (
            <Check size={19} color={color} />
          ) : (
            <Target size={19} color={color} />
          )}
        </View>

        <View className="ml-3 flex-1">
          <Text className="text-sm font-extrabold text-white" numberOfLines={1}>
            {goal.name}
          </Text>

          <Text className="mt-1 text-[10px] text-white/35">
            {completed
              ? "Objectif atteint"
              : `${formatMoney(remaining)} restant`}
          </Text>
        </View>

        <Text className="text-sm font-extrabold" style={{ color }}>
          {Math.round(percentage)}%
        </Text>
      </View>

      <View
        className="mt-4 h-2 overflow-hidden rounded-full"
        style={{
          backgroundColor: "rgba(255,255,255,0.07)",
        }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold text-white/55">
          {formatMoney(goal.currentAmount)}
        </Text>

        <Text className="text-xs text-white/30">
          / {formatMoney(goal.targetAmount)}
        </Text>
      </View>

      <View className="mt-4 flex-row items-center">
        <View className="flex-1 flex-row items-center">
          <Wallet size={12} color={color} />

          <Text className="ml-1.5 text-[10px] text-white/40">
            +{formatMoney(goal.monthlyContribution)} / mois
          </Text>
        </View>

        {!completed ? (
          <Pressable
            onPress={onContribute}
            disabled={contributing || deleting}
            className="mr-2 flex-row items-center rounded-xl px-3 py-2"
            style={{
              backgroundColor: `${color}15`,
              borderWidth: 1,
              borderColor: `${color}28`,
              opacity: contributing ? 0.45 : 1,
            }}
          >
            {contributing ? (
              <RefreshCw size={12} color={color} />
            ) : (
              <Plus size={12} color={color} />
            )}

            <Text
              className="ml-1.5 text-[10px] font-extrabold"
              style={{ color }}
            >
              Contribuer
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          onPress={onDelete}
          disabled={deleting || contributing}
          className="h-9 w-9 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "rgba(239,68,68,0.07)",
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.12)",
          }}
          accessibilityRole="button"
          accessibilityLabel={`Supprimer l'objectif ${goal.name}`}
        >
          <Trash2 size={13} color="#F87171" />
        </Pressable>
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  secure = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "decimal-pad";
  secure?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[11px] font-semibold text-white/45">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.23)"
        keyboardType={keyboardType}
        secureTextEntry={secure}
        autoCapitalize="none"
        className="rounded-2xl px-4 py-3.5 text-sm text-white"
        style={{
          backgroundColor: "rgba(255,255,255,0.055)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.09)",
        }}
      />
    </View>
  );
}

function AssetModal({
  visible,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  visible: boolean;
  form: AddAssetForm;
  saving: boolean;
  onClose: () => void;
  onChange: (field: keyof AddAssetForm, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
          }}
        >
          <View
            className="max-h-[92%] rounded-t-[34px] px-5 pb-7 pt-5"
            style={{
              backgroundColor: "#0B1020",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <View className="mb-5 flex-row items-center">
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-white">
                  Ajouter un actif
                </Text>

                <Text className="mt-1 text-xs text-white/35">
                  Saisis uniquement des informations dont tu disposes.
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <X size={17} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Field
                label="Symbole"
                value={form.symbol}
                onChangeText={(value) => onChange("symbol", value)}
                placeholder="Ex. ABC"
              />

              <Field
                label="Nom de l'actif"
                value={form.name}
                onChangeText={(value) => onChange("name", value)}
                placeholder="Nom de l'actif"
              />

              <Field
                label="Secteur"
                value={form.sector}
                onChangeText={(value) => onChange("sector", value)}
                placeholder="Finance"
              />

              <Field
                label="Quantité"
                value={form.quantity}
                onChangeText={(value) => onChange("quantity", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Field
                label={`Prix d'achat (${DISPLAY_CURRENCY})`}
                value={form.buyPrice}
                onChangeText={(value) => onChange("buyPrice", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Field
                label={`Prix actuel (${DISPLAY_CURRENCY})`}
                value={form.currentPrice}
                onChangeText={(value) => onChange("currentPrice", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <View
                className="mb-5 flex-row items-start rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(245,158,11,0.07)",
                  borderWidth: 1,
                  borderColor: "rgba(245,158,11,0.13)",
                }}
              >
                <Info size={15} color="#FBBF24" />

                <Text className="ml-2 flex-1 text-[10px] leading-5 text-amber-200/60">
                  Les montants sont enregistrés selon le contrat financier
                  actuellement utilisé par le backend. Vérifie la devise avant
                  d'enregistrer des données réelles.
                </Text>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={saving}
                className="items-center justify-center rounded-2xl py-4"
                style={{
                  backgroundColor: "#059669",
                  opacity: saving ? 0.55 : 1,
                }}
              >
                <Text className="text-sm font-extrabold text-white">
                  {saving ? "Enregistrement…" : "Enregistrer l'actif"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function GoalModal({
  visible,
  form,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  visible: boolean;
  form: AddGoalForm;
  saving: boolean;
  onClose: () => void;
  onChange: (field: keyof AddGoalForm, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          className="flex-1 justify-end"
          style={{
            backgroundColor: "rgba(0,0,0,0.78)",
          }}
        >
          <View
            className="max-h-[92%] rounded-t-[34px] px-5 pb-7 pt-5"
            style={{
              backgroundColor: "#0B1020",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <View className="mb-5 flex-row items-center">
              <View className="flex-1">
                <Text className="text-lg font-extrabold text-white">
                  Nouvel objectif
                </Text>

                <Text className="mt-1 text-xs text-white/35">
                  Définis une cible et suis sa progression.
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <X size={17} color="rgba(255,255,255,0.7)" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Field
                label="Nom de l'objectif"
                value={form.name}
                onChangeText={(value) => onChange("name", value)}
                placeholder="Ex. Fonds d'urgence"
              />

              <Field
                label={`Montant cible (${DISPLAY_CURRENCY})`}
                value={form.targetAmount}
                onChangeText={(value) => onChange("targetAmount", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Field
                label={`Montant déjà épargné (${DISPLAY_CURRENCY})`}
                value={form.currentAmount}
                onChangeText={(value) => onChange("currentAmount", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Field
                label={`Contribution mensuelle (${DISPLAY_CURRENCY})`}
                value={form.monthlyContribution}
                onChangeText={(value) => onChange("monthlyContribution", value)}
                placeholder="0"
                keyboardType="decimal-pad"
              />

              <Text className="mb-2 text-[11px] font-semibold text-white/45">
                Couleur de l'objectif
              </Text>

              <View className="mb-5 flex-row flex-wrap">
                {GOAL_COLORS.map((color) => {
                  const selected = form.color === color;

                  return (
                    <Pressable
                      key={color}
                      onPress={() => onChange("color", color)}
                      className="mr-3 mb-3 h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: color,
                        borderWidth: selected ? 3 : 1,
                        borderColor: selected
                          ? "#FFFFFF"
                          : "rgba(255,255,255,0.16)",
                      }}
                    >
                      {selected ? <Check size={15} color="#FFFFFF" /> : null}
                    </Pressable>
                  );
                })}
              </View>

              <View
                className="mb-5 flex-row items-start rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: "rgba(99,102,241,0.07)",
                  borderWidth: 1,
                  borderColor: "rgba(99,102,241,0.14)",
                }}
              >
                <Target size={15} color="#A5B4FC" />

                <Text className="ml-2 flex-1 text-[10px] leading-5 text-indigo-200/60">
                  Un objectif d'épargne est un outil de suivi. Il ne garantit
                  aucun rendement et ne constitue pas un conseil financier.
                </Text>
              </View>

              <Pressable
                onPress={onSubmit}
                disabled={saving}
                className="items-center justify-center rounded-2xl py-4"
                style={{
                  backgroundColor: "#4F46E5",
                  opacity: saving ? 0.55 : 1,
                }}
              >
                <Text className="text-sm font-extrabold text-white">
                  {saving ? "Création…" : "Créer l'objectif"}
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PortfolioTab({
  assets,
  totalPortfolio,
  totalGain,
  onAdd,
  onDelete,
  deletingId,
}: {
  assets: Array<{
    _id: Id<"investmentAssets">;
    symbol: string;
    name: string;
    sector: string;
    quantity: number;
    buyPrice: number;
    currentPrice: number;
    changePercent: number;
  }>;
  totalPortfolio: number;
  totalGain: number;
  onAdd: () => void;
  onDelete: (id: Id<"investmentAssets">) => void;
  deletingId: Id<"investmentAssets"> | null;
}) {
  const returnRate =
    totalPortfolio > 0 ? (totalGain / totalPortfolio) * 100 : 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 44,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-5">
        <SectionTitle eyebrow="Investissements" title="Portefeuille" />

        <View
          className="rounded-[30px] p-5"
          style={{
            backgroundColor: "rgba(16,185,129,0.055)",
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.13)",
          }}
        >
          <Text className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
            Valeur totale calculée
          </Text>

          <Text className="mt-2 text-3xl font-black text-white">
            {formatMoney(totalPortfolio)}
          </Text>

          <View className="mt-3 flex-row items-center">
            {totalGain >= 0 ? (
              <TrendingUp size={16} color="#34D399" />
            ) : (
              <TrendingDown size={16} color="#F87171" />
            )}

            <Text
              className="ml-2 text-sm font-bold"
              style={{
                color: totalGain >= 0 ? "#34D399" : "#F87171",
              }}
            >
              {totalGain >= 0 ? "+" : ""}
              {formatMoney(totalGain)}
            </Text>

            <Text className="ml-2 text-xs text-white/30">
              ({returnRate >= 0 ? "+" : ""}
              {returnRate.toFixed(2)}%)
            </Text>
          </View>

          <Text className="mt-4 text-[10px] leading-5 text-white/30">
            Calcul basé uniquement sur les prix d'achat et prix actuels
            enregistrés dans ton portefeuille. Ce chiffre ne représente pas une
            cotation de marché en temps réel.
          </Text>
        </View>
      </View>

      {assets.length > 0 ? (
        <>
          <View className="mb-4 flex-row">
            <MetricCard
              label="Actifs"
              value={String(assets.length)}
              caption="Enregistrés"
              accent="#818CF8"
              icon={<BarChart3 size={17} color="#818CF8" />}
            />

            <View className="w-3" />

            <MetricCard
              label="Variation"
              value={`${returnRate >= 0 ? "+" : ""}${returnRate.toFixed(2)}%`}
              caption="Calculée"
              accent={returnRate >= 0 ? "#34D399" : "#F87171"}
              icon={
                returnRate >= 0 ? (
                  <TrendingUp size={17} color="#34D399" />
                ) : (
                  <TrendingDown size={17} color="#F87171" />
                )
              }
            />
          </View>

          <SectionTitle eyebrow="Positions" title="Mes actifs" />

          {assets.map((asset) => (
            <AssetCard
              key={asset._id}
              asset={asset}
              deleting={deletingId === asset._id}
              onDelete={() => onDelete(asset._id)}
            />
          ))}
        </>
      ) : (
        <View
          className="items-center rounded-[30px] px-6 py-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.065)",
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-[26px]"
            style={{
              backgroundColor: "rgba(99,102,241,0.09)",
            }}
          >
            <Wallet size={32} color="#818CF8" />
          </View>

          <Text className="mt-5 text-lg font-extrabold text-white">
            Portefeuille vide
          </Text>

          <Text className="mt-2 text-center text-xs leading-5 text-white/40">
            Aucun actif n'est actuellement enregistré dans ton portefeuille.
          </Text>
        </View>
      )}

      <Pressable
        onPress={onAdd}
        className="mt-4 flex-row items-center justify-center rounded-2xl py-4"
        style={{
          backgroundColor: "rgba(16,185,129,0.11)",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.2)",
        }}
      >
        <Plus size={17} color="#34D399" />
        <Text className="ml-2 text-sm font-extrabold text-emerald-300">
          Ajouter un actif
        </Text>
      </Pressable>

      <View
        className="mt-5 flex-row items-start rounded-2xl px-4 py-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.025)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.055)",
        }}
      >
        <ShieldCheck size={15} color="rgba(255,255,255,0.35)" />

        <Text className="ml-2 flex-1 text-[10px] leading-5 text-white/30">
          Les données de portefeuille affichées ici proviennent des informations
          enregistrées dans ton compte. Elles ne constituent pas une
          recommandation d'investissement.
        </Text>
      </View>
    </ScrollView>
  );
}

function SavingsTab({
  goals,
  totalSavings,
  onAdd,
  onDelete,
  onContribute,
  deletingId,
  contributingId,
}: {
  goals: Array<{
    _id: Id<"savingsGoals">;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution: number;
    color?: string;
  }>;
  totalSavings: number;
  onAdd: () => void;
  onDelete: (id: Id<"savingsGoals">) => void;
  onContribute: (id: Id<"savingsGoals">) => void;
  deletingId: Id<"savingsGoals"> | null;
  contributingId: Id<"savingsGoals"> | null;
}) {
  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const globalProgress =
    totalTarget > 0 ? clampPercentage((totalSavings / totalTarget) * 100) : 0;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 44,
      }}
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle eyebrow="Objectifs" title="Épargne" />

      <View
        className="mb-5 rounded-[30px] p-5"
        style={{
          backgroundColor: "rgba(99,102,241,0.06)",
          borderWidth: 1,
          borderColor: "rgba(129,140,248,0.14)",
        }}
      >
        <View className="flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(99,102,241,0.12)",
            }}
          >
            <Target size={20} color="#A5B4FC" />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-[10px] uppercase tracking-wider text-white/30">
              Épargne totale
            </Text>

            <Text className="mt-1 text-2xl font-black text-white">
              {formatMoney(totalSavings)}
            </Text>
          </View>
        </View>

        {goals.length > 0 ? (
          <>
            <View
              className="mt-5 h-2 overflow-hidden rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.07)",
              }}
            >
              <View
                className="h-full rounded-full"
                style={{
                  width: `${globalProgress}%`,
                  backgroundColor: "#6366F1",
                }}
              />
            </View>

            <View className="mt-2 flex-row justify-between">
              <Text className="text-[10px] text-white/35">
                {Math.round(globalProgress)}% de la cible cumulée
              </Text>

              <Text className="text-[10px] text-white/25">
                {formatMoney(totalTarget)}
              </Text>
            </View>
          </>
        ) : null}
      </View>

      {goals.length === 0 ? (
        <View
          className="items-center rounded-[30px] px-6 py-10"
          style={{
            backgroundColor: "rgba(255,255,255,0.035)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.065)",
          }}
        >
          <View
            className="h-20 w-20 items-center justify-center rounded-[26px]"
            style={{
              backgroundColor: "rgba(99,102,241,0.09)",
            }}
          >
            <Target size={32} color="#818CF8" />
          </View>

          <Text className="mt-5 text-lg font-extrabold text-white">
            Aucun objectif
          </Text>

          <Text className="mt-2 text-center text-xs leading-5 text-white/40">
            Crée un objectif pour structurer ton épargne et suivre sa
            progression.
          </Text>
        </View>
      ) : (
        <>
          <SectionTitle eyebrow="Suivi" title="Mes objectifs" />

          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              deleting={deletingId === goal._id}
              contributing={contributingId === goal._id}
              onDelete={() => onDelete(goal._id)}
              onContribute={() => onContribute(goal._id)}
            />
          ))}
        </>
      )}

      <Pressable
        onPress={onAdd}
        className="mt-2 flex-row items-center justify-center rounded-2xl py-4"
        style={{
          backgroundColor: "rgba(99,102,241,0.11)",
          borderWidth: 1,
          borderColor: "rgba(99,102,241,0.2)",
        }}
      >
        <Plus size={17} color="#A5B4FC" />

        <Text className="ml-2 text-sm font-extrabold text-indigo-200">
          Créer un objectif
        </Text>
      </Pressable>

      <View
        className="mt-5 flex-row items-start rounded-2xl px-4 py-3"
        style={{
          backgroundColor: "rgba(255,255,255,0.025)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.055)",
        }}
      >
        <LockKeyhole size={15} color="rgba(255,255,255,0.35)" />

        <Text className="ml-2 flex-1 text-[10px] leading-5 text-white/30">
          Un objectif d'épargne est un outil de planification personnelle. Il ne
          garantit ni rendement ni disponibilité future des fonds.
        </Text>
      </View>
    </ScrollView>
  );
}

function SimulatorTab() {
  const [amount, setAmount] = useState("100000");
  const [rate, setRate] = useState("8");
  const [years, setYears] = useState("5");
  const [monthly, setMonthly] = useState("0");

  const result = useMemo(() => {
    const principal = parseNonNegativeNumber(amount) ?? 0;
    const annualRate = parseNonNegativeNumber(rate) ?? 0;
    const duration = parseNonNegativeNumber(years) ?? 0;
    const monthlyContribution = parseNonNegativeNumber(monthly) ?? 0;

    if (principal <= 0 || duration <= 0) {
      return {
        finalValue: principal,
        contributions:
          principal +
          monthlyContribution * Math.max(0, Math.floor(duration * 12)),
        gain: 0,
        valid: false,
      };
    }

    /*
     * Modèle de simulation :
     * - capital initial
     * - taux annuel composé mensuellement
     * - contribution mensuelle en fin de période
     *
     * Il s'agit uniquement d'une projection mathématique.
     */
    const months = Math.floor(duration * 12);
    const monthlyRate = annualRate / 100 / 12;

    let value = principal;

    for (let month = 0; month < months; month += 1) {
      value = value * (1 + monthlyRate) + monthlyContribution;
    }

    const totalContributions = principal + monthlyContribution * months;

    return {
      finalValue: value,
      contributions: totalContributions,
      gain: value - totalContributions,
      valid: true,
    };
  }, [amount, rate, years, monthly]);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 44,
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <SectionTitle eyebrow="Projection" title="Simulateur" />

      <View
        className="rounded-[30px] p-5"
        style={{
          backgroundColor: "rgba(255,255,255,0.045)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View className="mb-5 flex-row items-center">
          <View
            className="h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: "rgba(245,158,11,0.1)",
            }}
          >
            <BarChart3 size={20} color="#FBBF24" />
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-sm font-extrabold text-white">
              Projection composée
            </Text>

            <Text className="mt-1 text-[10px] leading-4 text-white/35">
              Modèle mathématique, pas une prévision financière.
            </Text>
          </View>
        </View>

        <Field
          label={`Capital initial (${DISPLAY_CURRENCY})`}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="100000"
        />

        <Field
          label="Taux annuel hypothétique (%)"
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          placeholder="8"
        />

        <Field
          label="Durée (années)"
          value={years}
          onChangeText={setYears}
          keyboardType="decimal-pad"
          placeholder="5"
        />

        <Field
          label={`Contribution mensuelle (${DISPLAY_CURRENCY})`}
          value={monthly}
          onChangeText={setMonthly}
          keyboardType="decimal-pad"
          placeholder="0"
        />
      </View>

      <View
        className="mt-4 rounded-[30px] p-5"
        style={{
          backgroundColor: "rgba(16,185,129,0.055)",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.13)",
        }}
      >
        <Text className="text-[10px] font-semibold uppercase tracking-wider text-white/35">
          Valeur mathématique projetée
        </Text>

        <Text className="mt-2 text-3xl font-black text-white">
          {formatMoney(result.finalValue)}
        </Text>

        <View className="mt-5 gap-3">
          <View className="flex-row justify-between">
            <Text className="text-xs text-white/40">Apports cumulés</Text>

            <Text className="text-xs font-bold text-white/75">
              {formatMoney(result.contributions)}
            </Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-xs text-white/40">Différence simulée</Text>

            <Text
              className="text-xs font-bold"
              style={{
                color: result.gain >= 0 ? "#34D399" : "#F87171",
              }}
            >
              {result.gain >= 0 ? "+" : ""}
              {formatMoney(result.gain)}
            </Text>
          </View>
        </View>
      </View>

      <View
        className="mt-4 rounded-3xl p-4"
        style={{
          backgroundColor: "rgba(245,158,11,0.055)",
          borderWidth: 1,
          borderColor: "rgba(245,158,11,0.12)",
        }}
      >
        <View className="flex-row items-start">
          <Info size={16} color="#FBBF24" />

          <Text className="ml-2 flex-1 text-[10px] leading-5 text-amber-100/55">
            Cette simulation suppose que le taux indiqué reste constant et que
            les contributions sont effectuées régulièrement. Les marchés, frais,
            taxes, inflation, pertes et variations de rendement réels ne sont
            pas modélisés ici. Le résultat ne constitue pas une garantie, une
            recommandation ou un conseil financier.
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row items-center justify-center">
        <Star size={12} color="#FBBF24" />

        <Text className="ml-2 text-[10px] font-semibold text-white/30">
          Outil éducatif de projection
        </Text>
      </View>
    </ScrollView>
  );
}

function FinancesInner({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<FinanceTab>("Portefeuille");

  const [showAddAsset, setShowAddAsset] = useState(false);

  const [showAddGoal, setShowAddGoal] = useState(false);

  const [savingAsset, setSavingAsset] = useState(false);

  const [savingGoal, setSavingGoal] = useState(false);

  const [deletingAssetId, setDeletingAssetId] =
    useState<Id<"investmentAssets"> | null>(null);

  const [deletingGoalId, setDeletingGoalId] =
    useState<Id<"savingsGoals"> | null>(null);

  const [contributingGoalId, setContributingGoalId] =
    useState<Id<"savingsGoals"> | null>(null);

  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const [assetForm, setAssetForm] = useState<AddAssetForm>({
    symbol: "",
    name: "",
    sector: "Finance",
    quantity: "",
    buyPrice: "",
    currentPrice: "",
  });

  const [goalForm, setGoalForm] = useState<AddGoalForm>({
    name: "",
    targetAmount: "",
    currentAmount: "0",
    monthlyContribution: "",
    color: "#6366F1",
  });

  const assets = useQuery(api.finances.getMyInvestmentAssets, {});

  const goals = useQuery(api.finances.getMySavingsGoals, {});

  const upsertAsset = useMutation(api.finances.upsertInvestmentAsset);

  const deleteAsset = useMutation(api.finances.deleteInvestmentAsset);

  const upsertGoal = useMutation(api.finances.upsertSavingsGoal);

  const deleteGoal = useMutation(api.finances.deleteSavingsGoal);

  const contributeGoal = useMutation(api.finances.contributeSavingsGoal);

  const safeAssets = assets ?? [];
  const safeGoals = goals ?? [];

  const totalPortfolio = useMemo(
    () =>
      safeAssets.reduce(
        (sum, asset) => sum + asset.currentPrice * asset.quantity,
        0,
      ),
    [safeAssets],
  );

  const totalGain = useMemo(
    () =>
      safeAssets.reduce(
        (sum, asset) =>
          sum + (asset.currentPrice - asset.buyPrice) * asset.quantity,
        0,
      ),
    [safeAssets],
  );

  const totalSavings = useMemo(
    () => safeGoals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [safeGoals],
  );

  const dataLoading = assets === undefined || goals === undefined;

  const resetAssetForm = () => {
    setAssetForm({
      symbol: "",
      name: "",
      sector: "Finance",
      quantity: "",
      buyPrice: "",
      currentPrice: "",
    });
  };

  const resetGoalForm = () => {
    setGoalForm({
      name: "",
      targetAmount: "",
      currentAmount: "0",
      monthlyContribution: "",
      color: "#6366F1",
    });
  };

  const handleAddAsset = async () => {
    const symbol = assetForm.symbol.trim().toUpperCase();

    const name = assetForm.name.trim();
    const sector = assetForm.sector.trim();

    const quantity = parsePositiveNumber(assetForm.quantity);

    const buyPrice = parsePositiveNumber(assetForm.buyPrice);

    const currentPrice = parsePositiveNumber(assetForm.currentPrice);

    if (!symbol) {
      setFeedback({
        type: "error",
        message: "Le symbole de l'actif est requis.",
      });
      return;
    }

    if (!name) {
      setFeedback({
        type: "error",
        message: "Le nom de l'actif est requis.",
      });
      return;
    }

    if (!quantity) {
      setFeedback({
        type: "error",
        message: "La quantité doit être supérieure à zéro.",
      });
      return;
    }

    if (!buyPrice) {
      setFeedback({
        type: "error",
        message: "Le prix d'achat doit être supérieur à zéro.",
      });
      return;
    }

    if (!currentPrice) {
      setFeedback({
        type: "error",
        message: "Le prix actuel doit être supérieur à zéro.",
      });
      return;
    }

    setSavingAsset(true);

    try {
      const changePercent = ((currentPrice - buyPrice) / buyPrice) * 100;

      await upsertAsset({
        symbol,
        name,
        sector: sector || "Autre",
        quantity,
        buyPrice,
        currentPrice,
        currency: BACKEND_CURRENCY,
        changePercent,
      });

      setShowAddAsset(false);
      resetAssetForm();

      setFeedback({
        type: "success",
        message: "L'actif a été enregistré.",
      });
    } catch (error) {
      console.error("Finance asset creation error:", error);

      setFeedback({
        type: "error",
        message:
          "Impossible d'enregistrer cet actif. Vérifie les données et réessaie.",
      });
    } finally {
      setSavingAsset(false);
    }
  };

  const handleDeleteAsset = (assetId: Id<"investmentAssets">) => {
    Alert.alert(
      "Supprimer cet actif ?",
      "Cette action supprimera l'actif enregistré de ton portefeuille.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            void performDeleteAsset(assetId);
          },
        },
      ],
    );
  };

  const performDeleteAsset = async (assetId: Id<"investmentAssets">) => {
    setDeletingAssetId(assetId);

    try {
      await deleteAsset({
        assetId,
      });

      setFeedback({
        type: "success",
        message: "L'actif a été supprimé.",
      });
    } catch (error) {
      console.error("Finance asset deletion error:", error);

      setFeedback({
        type: "error",
        message: "Impossible de supprimer cet actif.",
      });
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleAddGoal = async () => {
    const name = goalForm.name.trim();

    const targetAmount = parsePositiveNumber(goalForm.targetAmount);

    const currentAmount = parseNonNegativeNumber(goalForm.currentAmount);

    const monthlyContribution = parseNonNegativeNumber(
      goalForm.monthlyContribution,
    );

    if (!name) {
      setFeedback({
        type: "error",
        message: "Le nom de l'objectif est requis.",
      });
      return;
    }

    if (!targetAmount) {
      setFeedback({
        type: "error",
        message: "Le montant cible doit être supérieur à zéro.",
      });
      return;
    }

    if (currentAmount === null) {
      setFeedback({
        type: "error",
        message: "Le montant actuel doit être valide.",
      });
      return;
    }

    if (monthlyContribution === null) {
      setFeedback({
        type: "error",
        message: "La contribution mensuelle doit être valide.",
      });
      return;
    }

    if (currentAmount > targetAmount) {
      setFeedback({
        type: "error",
        message: "Le montant actuel ne peut pas dépasser la cible.",
      });
      return;
    }

    setSavingGoal(true);

    try {
      await upsertGoal({
        name,
        targetAmount,
        currentAmount,
        monthlyContribution,
        currency: BACKEND_CURRENCY,
        color: goalForm.color,
      });

      setShowAddGoal(false);
      resetGoalForm();

      setFeedback({
        type: "success",
        message: "L'objectif d'épargne a été créé.",
      });
    } catch (error) {
      console.error("Finance goal creation error:", error);

      setFeedback({
        type: "error",
        message: "Impossible de créer cet objectif.",
      });
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = (goalId: Id<"savingsGoals">) => {
    Alert.alert(
      "Supprimer cet objectif ?",
      "L'objectif d'épargne et son suivi seront supprimés.",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            void performDeleteGoal(goalId);
          },
        },
      ],
    );
  };

  const performDeleteGoal = async (goalId: Id<"savingsGoals">) => {
    setDeletingGoalId(goalId);

    try {
      await deleteGoal({
        goalId,
      });

      setFeedback({
        type: "success",
        message: "L'objectif a été supprimé.",
      });
    } catch (error) {
      console.error("Finance goal deletion error:", error);

      setFeedback({
        type: "error",
        message: "Impossible de supprimer cet objectif.",
      });
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleContribute = (goal: (typeof safeGoals)[number]) => {
    if (
      !Number.isFinite(goal.monthlyContribution) ||
      goal.monthlyContribution <= 0
    ) {
      setFeedback({
        type: "error",
        message:
          "Aucune contribution mensuelle valide n'est définie pour cet objectif.",
      });
      return;
    }

    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    const amount = Math.min(goal.monthlyContribution, remaining);

    if (amount <= 0) {
      setFeedback({
        type: "info",
        message: "Cet objectif est déjà atteint.",
      });
      return;
    }

    Alert.alert(
      "Confirmer la contribution",
      `Ajouter ${formatMoney(amount)} à « ${goal.name} » ?`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Confirmer",
          onPress: () => {
            void performContribution(goal._id, amount);
          },
        },
      ],
    );
  };

  const performContribution = async (
    goalId: Id<"savingsGoals">,
    amount: number,
  ) => {
    setContributingGoalId(goalId);

    try {
      await contributeGoal({
        goalId,
        amount,
      });

      setFeedback({
        type: "success",
        message: `Contribution de ${formatMoney(amount)} enregistrée.`,
      });
    } catch (error) {
      console.error("Finance contribution error:", error);

      setFeedback({
        type: "error",
        message: "Impossible d'enregistrer cette contribution.",
      });
    } finally {
      setContributingGoalId(null);
    }
  };

  return (
    <View
      className="flex-1"
      style={{
        backgroundColor: "#050812",
      }}
    >
      {/* Premium ambient background */}
      <View
        pointerEvents="none"
        className="absolute right-[-110px] top-[-120px] h-80 w-80 rounded-full"
        style={{
          backgroundColor: "rgba(16,185,129,0.035)",
        }}
      />

      <View
        pointerEvents="none"
        className="absolute bottom-[-130px] left-[-110px] h-80 w-80 rounded-full"
        style={{
          backgroundColor: "rgba(99,102,241,0.04)",
        }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-4 pb-4 pt-4"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.065)",
        }}
      >
        <Pressable
          onPress={onBack}
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(255,255,255,0.055)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <ArrowLeft size={19} color="rgba(255,255,255,0.8)" />
        </Pressable>

        <View className="ml-3 flex-1">
          <Text className="text-lg font-black text-white">Finances+</Text>

          <Text className="mt-0.5 text-[11px] text-white/35">
            Portefeuille · Épargne · Simulation
          </Text>
        </View>

        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            backgroundColor: "rgba(16,185,129,0.08)",
            borderWidth: 1,
            borderColor: "rgba(16,185,129,0.13)",
          }}
        >
          <ShieldCheck size={17} color="#34D399" />
        </View>
      </View>

      <FeedbackBanner feedback={feedback} onClose={() => setFeedback(null)} />

      {/* Financial overview */}
      <View className="px-4 pb-4 pt-4">
        <View className="flex-row">
          <MetricCard
            label="Portefeuille"
            value={dataLoading ? "—" : formatCompactMoney(totalPortfolio)}
            caption="Valeur calculée"
            accent="#34D399"
            icon={<Wallet size={17} color="#34D399" />}
          />

          <View className="w-3" />

          <MetricCard
            label="Épargne"
            value={dataLoading ? "—" : formatCompactMoney(totalSavings)}
            caption={`${safeGoals.length} objectif${safeGoals.length === 1 ? "" : "s"}`}
            accent="#818CF8"
            icon={<Target size={17} color="#818CF8" />}
          />
        </View>
      </View>

      {/* Tabs */}
      <View
        className="mx-4 mb-3 flex-row rounded-2xl p-1"
        style={{
          backgroundColor: "rgba(255,255,255,0.035)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        {TABS.map((tab) => {
          const selected = activeTab === tab;

          return (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className="flex-1 items-center rounded-xl py-2.5"
              style={{
                backgroundColor: selected
                  ? "rgba(255,255,255,0.085)"
                  : "transparent",
              }}
              accessibilityRole="tab"
              accessibilityState={{
                selected,
              }}
            >
              <Text
                className="text-[11px] font-bold"
                style={{
                  color: selected ? "#FFFFFF" : "rgba(255,255,255,0.38)",
                }}
              >
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {dataLoading ? (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          <Skeleton className="mb-3 h-32 w-full rounded-3xl" />
          <Skeleton className="mb-3 h-24 w-full rounded-3xl" />
          <Skeleton className="mb-3 h-24 w-full rounded-3xl" />
          <Skeleton className="h-24 w-full rounded-3xl" />
        </ScrollView>
      ) : activeTab === "Portefeuille" ? (
        <PortfolioTab
          assets={safeAssets}
          totalPortfolio={totalPortfolio}
          totalGain={totalGain}
          onAdd={() => setShowAddAsset(true)}
          onDelete={handleDeleteAsset}
          deletingId={deletingAssetId}
        />
      ) : activeTab === "Épargne" ? (
        <SavingsTab
          goals={safeGoals}
          totalSavings={totalSavings}
          onAdd={() => setShowAddGoal(true)}
          onDelete={handleDeleteGoal}
          onContribute={(goalId) => {
            const goal = safeGoals.find((item) => item._id === goalId);

            if (goal) {
              handleContribute(goal);
            }
          }}
          deletingId={deletingGoalId}
          contributingId={contributingGoalId}
        />
      ) : (
        <SimulatorTab />
      )}

      <AssetModal
        visible={showAddAsset}
        form={assetForm}
        saving={savingAsset}
        onClose={() => {
          if (!savingAsset) {
            setShowAddAsset(false);
          }
        }}
        onChange={(field, value) =>
          setAssetForm((previous) => ({
            ...previous,
            [field]: value,
          }))
        }
        onSubmit={() => {
          void handleAddAsset();
        }}
      />

      <GoalModal
        visible={showAddGoal}
        form={goalForm}
        saving={savingGoal}
        onClose={() => {
          if (!savingGoal) {
            setShowAddGoal(false);
          }
        }}
        onChange={(field, value) =>
          setGoalForm((previous) => ({
            ...previous,
            [field]: value,
          }))
        }
        onSubmit={() => {
          void handleAddGoal();
        }}
      />
    </View>
  );
}

function FinanceLoadingScreen() {
  return (
    <View
      className="flex-1 px-4 pt-14"
      style={{
        backgroundColor: "#050812",
      }}
    >
      <Skeleton className="h-12 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-32 w-full rounded-3xl" />
      <Skeleton className="mt-4 h-12 w-full rounded-2xl" />
      <Skeleton className="mt-4 h-28 w-full rounded-3xl" />
      <Skeleton className="mt-3 h-28 w-full rounded-3xl" />
    </View>
  );
}

function FinanceUnauthenticated({ onBack }: { onBack: () => void }) {
  return (
    <View
      className="flex-1 items-center justify-center px-7"
      style={{
        backgroundColor: "#050812",
      }}
    >
      <Pressable
        onPress={onBack}
        className="absolute left-4 top-12 h-11 w-11 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "rgba(255,255,255,0.055)",
        }}
        accessibilityRole="button"
        accessibilityLabel="Retour"
      >
        <ArrowLeft size={19} color="rgba(255,255,255,0.8)" />
      </Pressable>

      <View
        className="h-24 w-24 items-center justify-center rounded-[30px]"
        style={{
          backgroundColor: "rgba(16,185,129,0.08)",
          borderWidth: 1,
          borderColor: "rgba(16,185,129,0.15)",
        }}
      >
        <LockKeyhole size={36} color="#34D399" />
      </View>

      <Text className="mt-7 text-center text-2xl font-black text-white">
        Espace financier sécurisé
      </Text>

      <Text className="mt-3 max-w-[330px] text-center text-sm leading-6 text-white/40">
        Connecte-toi pour accéder à tes données financières et à tes objectifs
        d'épargne.
      </Text>
    </View>
  );
}

export default function FinancesPage({ onBack }: FinancesPageProps) {
  return (
    <>
      <AuthLoading>
        <FinanceLoadingScreen />
      </AuthLoading>

      <Unauthenticated>
        <FinanceUnauthenticated onBack={onBack} />
      </Unauthenticated>

      <Authenticated>
        <FinancesInner onBack={onBack} />
      </Authenticated>
    </>
  );
}

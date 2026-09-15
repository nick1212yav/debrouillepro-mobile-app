import React, { memo, useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { useMutation, useQuery } from "convex/react";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowRightLeft,
  Bed,
  Car,
  Check,
  ChevronDown,
  Coffee,
  DollarSign,
  Globe,
  Plane,
  Plus,
  ShoppingBag,
  Utensils,
  Wallet,
  X,
} from "lucide-react-native";

import { api } from "@/convex/_generated/api.js";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Authenticated,
  AuthLoading,
  Unauthenticated,
} from "@/lib/convex-auth-compat";

type Category =
  | "transport"
  | "hebergement"
  | "repas"
  | "loisirs"
  | "shopping"
  | "autre";

type Currency = "EUR" | "USD" | "JPY" | "MAD" | "GBP" | "XOF";

type MainTab = "overview" | "compare" | "converter";

type PlanTab = "overview" | "expenses";

type Props = {
  onBack: () => void;
};

type CategoryConfig = {
  label: string;
  Icon: typeof Utensils;
};

const CATEGORIES: Record<Category, CategoryConfig> = {
  transport: {
    label: "Transport",
    Icon: Plane,
  },
  hebergement: {
    label: "Hébergement",
    Icon: Bed,
  },
  repas: {
    label: "Repas",
    Icon: Utensils,
  },
  loisirs: {
    label: "Loisirs",
    Icon: Coffee,
  },
  shopping: {
    label: "Shopping",
    Icon: ShoppingBag,
  },
  autre: {
    label: "Autre",
    Icon: Wallet,
  },
};

const CURRENCIES: Currency[] = ["EUR", "USD", "JPY", "MAD", "GBP", "XOF"];

const CURRENCY_LABELS: Record<Currency, string> = {
  EUR: "Euro",
  USD: "Dollar US",
  JPY: "Yen japonais",
  MAD: "Dirham marocain",
  GBP: "Livre sterling",
  XOF: "Franc CFA",
};

const currencySymbol = (currency: Currency): string => {
  switch (currency) {
    case "EUR":
      return "€";
    case "USD":
      return "$";
    case "JPY":
      return "¥";
    case "GBP":
      return "£";
    case "MAD":
      return "MAD";
    case "XOF":
      return "FCFA";
    default:
      return currency;
  }
};

function isCurrency(value: unknown): value is Currency {
  return (
    value === "EUR" ||
    value === "USD" ||
    value === "JPY" ||
    value === "MAD" ||
    value === "GBP" ||
    value === "XOF"
  );
}

function isCategory(value: unknown): value is Category {
  return (
    value === "transport" ||
    value === "hebergement" ||
    value === "repas" ||
    value === "loisirs" ||
    value === "shopping" ||
    value === "autre"
  );
}

function formatMoney(
  amount: number,
  currency: Currency,
  maximumFractionDigits = 2,
): string {
  if (!Number.isFinite(amount)) {
    return `0 ${currencySymbol(currency)}`;
  }

  const fractionDigits =
    currency === "JPY" || currency === "XOF" ? 0 : maximumFractionDigits;

  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(amount);

  return `${formatted} ${currencySymbol(currency)}`;
}

function formatDate(value: unknown): string {
  if (typeof value !== "string" && typeof value !== "number") {
    return "Date inconnue";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function parseAmount(value: string): number | null {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function getPlanCurrency(plan: { currency?: string | null }): Currency | null {
  return isCurrency(plan.currency) ? plan.currency : null;
}

/* -------------------------------------------------------------------------- */
/* Primitive UI                                                               */
/* -------------------------------------------------------------------------- */

const GlassCard = memo(function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`rounded-3xl border border-white/10 bg-white/[0.045] ${className}`}
    >
      {children}
    </View>
  );
});

const SectionTitle = memo(function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View className="mb-4">
      <Text className="text-lg font-bold text-white">{title}</Text>

      {subtitle ? (
        <Text className="mt-1 text-xs leading-5 text-gray-400">{subtitle}</Text>
      ) : null}
    </View>
  );
});

const EmptyState = memo(function EmptyState({
  Icon,
  title,
  description,
  action,
}: {
  Icon: typeof Wallet;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-12">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
        <Icon size={28} color="rgba(255,255,255,0.45)" />
      </View>

      <Text className="text-center text-base font-semibold text-white">
        {title}
      </Text>

      <Text className="mt-2 max-w-[320px] text-center text-sm leading-6 text-gray-400">
        {description}
      </Text>

      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
});

const LoadingState = memo(function LoadingState() {
  return (
    <View className="items-center justify-center px-6 py-16">
      <ActivityIndicator size="small" color="#60A5FA" />

      <Text className="mt-4 text-sm text-gray-400">
        Chargement de vos données…
      </Text>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

const PageHeader = memo(function PageHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 pb-4 pt-12">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]"
      >
        <ArrowLeft size={20} color="#FFFFFF" />
      </Pressable>

      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-xl font-bold tracking-tight text-white"
        >
          {title}
        </Text>

        <Text numberOfLines={1} className="mt-0.5 text-xs text-gray-400">
          {subtitle}
        </Text>
      </View>

      {right}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Main tabs                                                                  */
/* -------------------------------------------------------------------------- */

const MainTabs = memo(function MainTabs({
  activeTab,
  onChange,
}: {
  activeTab: MainTab;
  onChange: (tab: MainTab) => void;
}) {
  const tabs: Array<{
    key: MainTab;
    label: string;
    Icon: typeof Wallet;
  }> = [
    {
      key: "overview",
      label: "Mes voyages",
      Icon: Wallet,
    },
    {
      key: "compare",
      label: "Analyse",
      Icon: Globe,
    },
    {
      key: "converter",
      label: "Devises",
      Icon: ArrowRightLeft,
    },
  ];

  return (
    <View className="mx-4 mb-4 flex-row rounded-2xl border border-white/10 bg-white/[0.035] p-1">
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl px-2 ${
              selected ? "bg-white/[0.10]" : ""
            }`}
          >
            <tab.Icon size={15} color={selected ? "#FFFFFF" : "#8B93A7"} />

            <Text
              className={`text-xs font-semibold ${
                selected ? "text-white" : "text-gray-400"
              }`}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

const PlanTabs = memo(function PlanTabs({
  activeTab,
  onChange,
}: {
  activeTab: PlanTab;
  onChange: (tab: PlanTab) => void;
}) {
  const tabs: Array<{
    key: PlanTab;
    label: string;
  }> = [
    {
      key: "overview",
      label: "Catégories",
    },
    {
      key: "expenses",
      label: "Dépenses",
    },
  ];

  return (
    <View className="mx-4 mb-4 flex-row rounded-2xl border border-white/10 bg-white/[0.035] p-1">
      {tabs.map((tab) => {
        const selected = activeTab === tab.key;

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(tab.key)}
            className={`min-h-[44px] flex-1 items-center justify-center rounded-xl ${
              selected ? "bg-white/[0.10]" : ""
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                selected ? "text-white" : "text-gray-400"
              }`}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Travel plan card                                                           */
/* -------------------------------------------------------------------------- */

const TravelPlanCard = memo(function TravelPlanCard({
  plan,
  onPress,
}: {
  plan: any;
  onPress: () => void;
}) {
  const currency = getPlanCurrency(plan);
  const budget = typeof plan.totalBudget === "number" ? plan.totalBudget : null;
  const spent = typeof plan.expensesTotal === "number" ? plan.expensesTotal : 0;

  const progress =
    budget !== null && budget > 0
      ? Math.min(1, Math.max(0, spent / budget))
      : 0;

  const overBudget = budget !== null && spent > budget;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir le budget ${plan.destination}`}
      onPress={onPress}
      className="mb-3 rounded-3xl border border-white/10 bg-white/[0.045] p-4 active:bg-white/[0.08]"
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10">
          <Globe size={21} color="#60A5FA" />
        </View>

        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-base font-bold text-white">
            {plan.destination}
          </Text>

          <Text numberOfLines={1} className="mt-1 text-xs text-gray-400">
            {currency
              ? formatMoney(spent, currency, 0)
              : "Devise du voyage indisponible"}
            {budget !== null && currency
              ? ` / ${formatMoney(budget, currency, 0)}`
              : ""}
          </Text>
        </View>

        <ArrowRight size={18} color="#667085" />
      </View>

      {budget !== null && budget > 0 ? (
        <View className="mt-4">
          <View className="h-2 overflow-hidden rounded-full bg-white/10">
            <View
              className={`h-full rounded-full ${
                overBudget
                  ? "bg-red-500"
                  : progress > 0.8
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(100, progress * 100)}%`,
              }}
            />
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[11px] text-gray-500">
              {Math.round(progress * 100)} % utilisé
            </Text>

            {overBudget ? (
              <View className="flex-row items-center gap-1">
                <AlertTriangle size={12} color="#F87171" />

                <Text className="text-[11px] font-semibold text-red-400">
                  Budget dépassé
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Pressable>
  );
});

/* -------------------------------------------------------------------------- */
/* Category analysis                                                          */
/* -------------------------------------------------------------------------- */

const CategoryRow = memo(function CategoryRow({
  category,
  amount,
  currency,
  total,
}: {
  category: Category;
  amount: number;
  currency: Currency | null;
  total: number;
}) {
  const config = CATEGORIES[category];
  const Icon = config.Icon;

  const percentage =
    total > 0 ? Math.min(100, Math.max(0, (amount / total) * 100)) : 0;

  return (
    <View className="mb-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/[0.07]">
          <Icon size={17} color="#CBD5E1" />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="text-sm font-semibold text-white">
              {config.label}
            </Text>

            <Text className="text-sm font-bold text-white">
              {currency ? formatMoney(amount, currency) : "—"}
            </Text>
          </View>

          <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <View
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${percentage}%` }}
            />
          </View>

          <Text className="mt-1.5 text-[11px] text-gray-500">
            {Math.round(percentage)} % des dépenses compatibles
          </Text>
        </View>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Expense row                                                                */
/* -------------------------------------------------------------------------- */

const ExpenseRow = memo(function ExpenseRow({ expense }: { expense: any }) {
  const category: Category = isCategory(expense.category)
    ? expense.category
    : "autre";

  const config = CATEGORIES[category];
  const Icon = config.Icon;

  const currency = isCurrency(expense.currency) ? expense.currency : null;

  return (
    <View className="mb-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-xl bg-white/[0.07]">
          <Icon size={17} color="#CBD5E1" />
        </View>

        <View className="min-w-0 flex-1">
          <Text numberOfLines={1} className="text-sm font-semibold text-white">
            {expense.description || "Dépense sans description"}
          </Text>

          <Text numberOfLines={1} className="mt-1 text-xs text-gray-500">
            {config.label} · {formatDate(expense.date)}
          </Text>
        </View>

        <Text className="text-sm font-bold text-white">
          {currency ? formatMoney(Number(expense.amount) || 0, currency) : "—"}
        </Text>
      </View>
    </View>
  );
});

/* -------------------------------------------------------------------------- */
/* Currency picker                                                            */
/* -------------------------------------------------------------------------- */

const CurrencyPicker = memo(function CurrencyPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Currency;
  onSelect: (currency: Currency) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 justify-end bg-black/70" onPress={onClose}>
        <Pressable
          className="rounded-t-[32px] border-t border-white/10 bg-[#0B1020] px-5 pb-10 pt-5"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-lg font-bold text-white">
                Choisir une devise
              </Text>

              <Text className="mt-1 text-xs text-gray-500">
                Devise enregistrée avec la dépense
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <View className="gap-2">
            {CURRENCIES.map((currency) => {
              const selectedCurrency = currency === selected;

              return (
                <Pressable
                  key={currency}
                  onPress={() => {
                    onSelect(currency);
                    onClose();
                  }}
                  className={`flex-row items-center rounded-2xl border px-4 py-3.5 ${
                    selectedCurrency
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 bg-white/[0.04]"
                  }`}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                    <Text className="text-sm font-bold text-white">
                      {currencySymbol(currency)}
                    </Text>
                  </View>

                  <View className="ml-3 flex-1">
                    <Text className="text-sm font-semibold text-white">
                      {currency}
                    </Text>

                    <Text className="mt-0.5 text-xs text-gray-500">
                      {CURRENCY_LABELS[currency]}
                    </Text>
                  </View>

                  {selectedCurrency ? (
                    <Check size={18} color="#60A5FA" />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

/* -------------------------------------------------------------------------- */
/* Add expense modal                                                          */
/* -------------------------------------------------------------------------- */

const AddExpenseModal = memo(function AddExpenseModal({
  visible,
  onClose,
  label,
  amount,
  category,
  currency,
  currencyPickerVisible,
  submitting,
  onLabelChange,
  onAmountChange,
  onCategoryChange,
  onCurrencyPicker,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  amount: string;
  category: Category;
  currency: Currency;
  currencyPickerVisible: boolean;
  submitting: boolean;
  onLabelChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (category: Category) => void;
  onCurrencyPicker: () => void;
  onSubmit: () => void;
}) {
  const amountValid = parseAmount(amount) !== null;
  const labelValid = label.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View className="max-h-[92%] rounded-t-[32px] border-t border-white/10 bg-[#0B1020] px-5 pb-8 pt-5">
          <View className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

          <View className="mb-5 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-white">
                Nouvelle dépense
              </Text>

              <Text className="mt-1 text-xs text-gray-500">
                Ajoutez uniquement une dépense réelle.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={submitting}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mb-2 text-xs font-semibold text-gray-400">
              Description
            </Text>

            <TextInput
              value={label}
              onChangeText={onLabelChange}
              editable={!submitting}
              placeholder="Ex. dîner, taxi, hôtel…"
              placeholderTextColor="#667085"
              className="mb-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-sm text-white"
            />

            <Text className="mb-2 text-xs font-semibold text-gray-400">
              Montant
            </Text>

            <View className="mb-4 flex-row gap-3">
              <TextInput
                value={amount}
                onChangeText={onAmountChange}
                editable={!submitting}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#667085"
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-base font-bold text-white"
              />

              <Pressable
                onPress={onCurrencyPicker}
                disabled={submitting}
                className="min-w-[100px] flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4"
              >
                <Text className="text-sm font-bold text-white">{currency}</Text>

                <ChevronDown size={15} color="#94A3B8" />
              </Pressable>
            </View>

            <Text className="mb-3 text-xs font-semibold text-gray-400">
              Catégorie
            </Text>

            <View className="mb-6 flex-row flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map((item) => {
                const config = CATEGORIES[item];
                const Icon = config.Icon;
                const selected = category === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => onCategoryChange(item)}
                    disabled={submitting}
                    className={`w-[31%] min-h-[76px] items-center justify-center rounded-2xl border px-2 ${
                      selected
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.035]"
                    }`}
                  >
                    <Icon size={18} color={selected ? "#60A5FA" : "#94A3B8"} />

                    <Text
                      numberOfLines={1}
                      className={`mt-2 text-[11px] font-semibold ${
                        selected ? "text-blue-300" : "text-gray-400"
                      }`}
                    >
                      {config.label}
                    </Text>

                    {selected ? (
                      <View className="absolute right-2 top-2">
                        <Check size={11} color="#60A5FA" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!labelValid || !amountValid || submitting}
              onPress={onSubmit}
              className={`min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl ${
                labelValid && amountValid && !submitting
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Plus size={18} color="#FFFFFF" />
              )}

              <Text className="text-sm font-bold text-white">
                {submitting ? "Enregistrement…" : "Enregistrer la dépense"}
              </Text>
            </Pressable>
          </ScrollView>

          <CurrencyPicker
            visible={currencyPickerVisible}
            selected={currency}
            onSelect={() => undefined}
            onClose={() => undefined}
          />
        </View>
      </View>
    </Modal>
  );
});

/* -------------------------------------------------------------------------- */
/* Add expense modal - controlled picker version                              */
/* -------------------------------------------------------------------------- */

function AddExpenseSheet({
  visible,
  onClose,
  label,
  amount,
  category,
  currency,
  pickerVisible,
  submitting,
  onLabelChange,
  onAmountChange,
  onCategoryChange,
  onOpenPicker,
  onClosePicker,
  onCurrencyChange,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  label: string;
  amount: string;
  category: Category;
  currency: Currency;
  pickerVisible: boolean;
  submitting: boolean;
  onLabelChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCategoryChange: (value: Category) => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onCurrencyChange: (value: Currency) => void;
  onSubmit: () => void;
}) {
  const amountValid = parseAmount(amount) !== null;
  const labelValid = label.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70">
        <View className="max-h-[92%] rounded-t-[32px] border-t border-white/10 bg-[#0B1020] px-5 pb-8 pt-5">
          <View className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/20" />

          <View className="mb-5 flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">
                Nouvelle dépense
              </Text>

              <Text className="mt-1 text-xs text-gray-500">
                Enregistrée directement dans votre voyage.
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={submitting}
              className="h-10 w-10 items-center justify-center rounded-xl bg-white/10"
            >
              <X size={18} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mb-2 text-xs font-semibold text-gray-400">
              Description
            </Text>

            <TextInput
              value={label}
              onChangeText={onLabelChange}
              editable={!submitting}
              placeholder="Ex. dîner, taxi, hôtel…"
              placeholderTextColor="#667085"
              className="mb-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-sm text-white"
            />

            <Text className="mb-2 text-xs font-semibold text-gray-400">
              Montant
            </Text>

            <View className="mb-5 flex-row gap-3">
              <TextInput
                value={amount}
                onChangeText={onAmountChange}
                editable={!submitting}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor="#667085"
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-4 text-base font-bold text-white"
              />

              <Pressable
                onPress={onOpenPicker}
                disabled={submitting}
                className="min-w-[100px] flex-row items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-4"
              >
                <Text className="text-sm font-bold text-white">{currency}</Text>

                <ChevronDown size={15} color="#94A3B8" />
              </Pressable>
            </View>

            <Text className="mb-3 text-xs font-semibold text-gray-400">
              Catégorie
            </Text>

            <View className="mb-6 flex-row flex-wrap gap-2">
              {(Object.keys(CATEGORIES) as Category[]).map((item) => {
                const config = CATEGORIES[item];
                const Icon = config.Icon;
                const selected = category === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => onCategoryChange(item)}
                    disabled={submitting}
                    className={`w-[31%] min-h-[76px] items-center justify-center rounded-2xl border px-2 ${
                      selected
                        ? "border-blue-500/50 bg-blue-500/10"
                        : "border-white/10 bg-white/[0.035]"
                    }`}
                  >
                    <Icon size={18} color={selected ? "#60A5FA" : "#94A3B8"} />

                    <Text
                      numberOfLines={1}
                      className={`mt-2 text-[11px] font-semibold ${
                        selected ? "text-blue-300" : "text-gray-400"
                      }`}
                    >
                      {config.label}
                    </Text>

                    {selected ? (
                      <View className="absolute right-2 top-2">
                        <Check size={11} color="#60A5FA" />
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              disabled={!labelValid || !amountValid || submitting}
              onPress={onSubmit}
              className={`min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl ${
                labelValid && amountValid && !submitting
                  ? "bg-blue-600"
                  : "bg-white/10"
              }`}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Plus size={18} color="#FFFFFF" />
              )}

              <Text className="text-sm font-bold text-white">
                {submitting ? "Enregistrement…" : "Enregistrer la dépense"}
              </Text>
            </Pressable>
          </ScrollView>

          <CurrencyPicker
            visible={pickerVisible}
            selected={currency}
            onSelect={onCurrencyChange}
            onClose={onClosePicker}
          />
        </View>
      </View>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Converter                                                                  */
/* -------------------------------------------------------------------------- */

const ConverterUnavailable = memo(function ConverterUnavailable() {
  return (
    <EmptyState
      Icon={ArrowRightLeft}
      title="Conversion en temps réel"
      description="Aucun taux de change temps réel n'est fourni par le backend actuellement. Aucun taux fictif n'est affiché."
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Analysis                                                                   */
/* -------------------------------------------------------------------------- */

const AnalysisView = memo(function AnalysisView({
  plans,
}: {
  plans: any[] | undefined;
}) {
  if (!plans) {
    return <LoadingState />;
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        Icon={Globe}
        title="Aucune donnée d'analyse"
        description="Créez d'abord un voyage pour commencer à analyser vos dépenses."
      />
    );
  }

  const plansWithBudget = plans.filter(
    (plan) => typeof plan.totalBudget === "number" && plan.totalBudget > 0,
  );

  const totalBudget = plansWithBudget.reduce(
    (sum, plan) => sum + Number(plan.totalBudget || 0),
    0,
  );

  const totalSpent = plans.reduce(
    (sum, plan) => sum + Number(plan.expensesTotal || 0),
    0,
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingBottom: 40,
      }}
    >
      <SectionTitle
        title="Analyse de vos voyages"
        subtitle="Synthèse basée uniquement sur les données enregistrées."
      />

      <View className="mb-4 flex-row gap-3">
        <GlassCard className="flex-1 p-4">
          <Text className="text-xs text-gray-500">Voyages</Text>

          <Text className="mt-2 text-2xl font-bold text-white">
            {plans.length}
          </Text>
        </GlassCard>

        <GlassCard className="flex-1 p-4">
          <Text className="text-xs text-gray-500">Dépenses enregistrées</Text>

          <Text className="mt-2 text-2xl font-bold text-white">
            {totalSpent.toLocaleString("fr-FR")}
          </Text>

          <Text className="mt-1 text-[10px] text-gray-500">
            Somme brute des montants enregistrés
          </Text>
        </GlassCard>
      </View>

      <GlassCard className="mb-4 p-5">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10">
            <DollarSign size={20} color="#60A5FA" />
          </View>

          <View className="flex-1">
            <Text className="text-base font-bold text-white">
              Budgets renseignés
            </Text>

            <Text className="mt-1 text-xs leading-5 text-gray-500">
              Les devises ne sont pas mélangées artificiellement.
            </Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-end justify-between">
          <View>
            <Text className="text-xs text-gray-500">Budget cumulé</Text>

            <Text className="mt-1 text-2xl font-bold text-white">
              {totalBudget.toLocaleString("fr-FR")}
            </Text>
          </View>

          <Text className="text-xs text-gray-500">
            {plansWithBudget.length} budget(s)
          </Text>
        </View>
      </GlassCard>

      <Text className="mb-3 text-sm font-bold text-white">Vos voyages</Text>

      {plans.map((plan) => {
        const budget =
          typeof plan.totalBudget === "number" ? plan.totalBudget : null;

        const spent = Number(plan.expensesTotal || 0);

        const currency = getPlanCurrency(plan);

        const progress =
          budget && budget > 0 ? Math.min(100, (spent / budget) * 100) : null;

        return (
          <GlassCard key={plan._id} className="mb-3 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-white"
                >
                  {plan.destination}
                </Text>

                <Text className="mt-1 text-xs text-gray-500">
                  {currency
                    ? formatMoney(spent, currency, 0)
                    : "Devise indisponible"}
                </Text>
              </View>

              {progress !== null ? (
                <Text className="text-xs font-bold text-gray-300">
                  {Math.round(progress)} %
                </Text>
              ) : null}
            </View>

            {progress !== null ? (
              <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <View
                  className={`h-full rounded-full ${
                    progress > 100
                      ? "bg-red-500"
                      : progress > 80
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                  }}
                />
              </View>
            ) : null}
          </GlassCard>
        );
      })}
    </ScrollView>
  );
});

/* -------------------------------------------------------------------------- */
/* Selected plan                                                             */
/* -------------------------------------------------------------------------- */

function SelectedPlanView({
  plan,
  expenses,
  activeTab,
  onTabChange,
  onBack,
  onAddExpense,
}: {
  plan: any;
  expenses: any[] | undefined;
  activeTab: PlanTab;
  onTabChange: (tab: PlanTab) => void;
  onBack: () => void;
  onAddExpense: () => void;
}) {
  const currency = getPlanCurrency(plan);

  const spent = Number(plan.expensesTotal || 0);

  const budget = typeof plan.totalBudget === "number" ? plan.totalBudget : null;

  const remaining = budget !== null ? budget - spent : null;

  const percentage =
    budget !== null && budget > 0
      ? Math.min(100, Math.max(0, (spent / budget) * 100))
      : 0;

  const isOverBudget = budget !== null && remaining !== null && remaining < 0;

  const categoryTotals = useMemo(() => {
    const result: Record<Category, number> = {
      transport: 0,
      hebergement: 0,
      repas: 0,
      loisirs: 0,
      shopping: 0,
      autre: 0,
    };

    if (!expenses || !currency) {
      return result;
    }

    for (const expense of expenses) {
      if (!isCurrency(expense.currency)) {
        continue;
      }

      if (expense.currency !== currency) {
        continue;
      }

      const category: Category = isCategory(expense.category)
        ? expense.category
        : "autre";

      result[category] += Number(expense.amount) || 0;
    }

    return result;
  }, [expenses, currency]);

  const compatibleCategoryTotal = useMemo(
    () => Object.values(categoryTotals).reduce((sum, value) => sum + value, 0),
    [categoryTotals],
  );

  return (
    <View className="flex-1 bg-[#050812]">
      <PageHeader
        title={plan.destination}
        subtitle="Budget voyage"
        onBack={onBack}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajouter une dépense"
            onPress={onAddExpense}
            className="flex-row items-center gap-1.5 rounded-2xl bg-blue-600 px-3.5 py-2.5"
          >
            <Plus size={16} color="#FFFFFF" />

            <Text className="text-xs font-bold text-white">Dépense</Text>
          </Pressable>
        }
      />

      {budget !== null && currency ? (
        <GlassCard className="mx-4 mb-4 p-5">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Dépensé</Text>

              <Text className="mt-1 text-3xl font-extrabold text-white">
                {formatMoney(spent, currency)}
              </Text>
            </View>

            <View className="items-end">
              <Text className="text-xs text-gray-500">
                {isOverBudget ? "Dépassement" : "Restant"}
              </Text>

              <Text
                className={`mt-1 text-xl font-bold ${
                  isOverBudget ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {formatMoney(Math.abs(remaining || 0), currency)}
              </Text>
            </View>
          </View>

          <View className="mt-5 h-3 overflow-hidden rounded-full bg-white/10">
            <View
              className={`h-full rounded-full ${
                isOverBudget
                  ? "bg-red-500"
                  : percentage > 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${percentage}%`,
              }}
            />
          </View>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-[11px] text-gray-500">0</Text>

            <Text className="text-[11px] font-semibold text-gray-400">
              {Math.round(percentage)} % utilisé
            </Text>

            <Text className="text-[11px] text-gray-500">
              {formatMoney(budget, currency)}
            </Text>
          </View>

          {isOverBudget ? (
            <View className="mt-4 flex-row items-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
              <AlertTriangle size={16} color="#F87171" />

              <Text className="flex-1 text-xs font-semibold text-red-300">
                Votre budget enregistré est dépassé.
              </Text>
            </View>
          ) : null}
        </GlassCard>
      ) : (
        <GlassCard className="mx-4 mb-4 p-5">
          <View className="flex-row items-center gap-3">
            <AlertTriangle size={20} color="#94A3B8" />

            <View className="flex-1">
              <Text className="text-sm font-semibold text-white">
                Budget non comparable
              </Text>

              <Text className="mt-1 text-xs leading-5 text-gray-500">
                Le budget ou sa devise n'est pas suffisamment renseigné pour
                effectuer un calcul fiable.
              </Text>
            </View>
          </View>
        </GlassCard>
      )}

      <PlanTabs activeTab={activeTab} onChange={onTabChange} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 40,
        }}
      >
        {activeTab === "overview" ? (
          <>
            <SectionTitle
              title="Répartition"
              subtitle={
                currency
                  ? "Seules les dépenses dans la devise du budget sont regroupées."
                  : "Devise du budget indisponible."
              }
            />

            {!expenses ? (
              <LoadingState />
            ) : expenses.length === 0 ? (
              <EmptyState
                Icon={Wallet}
                title="Aucune dépense"
                description="Votre voyage ne contient encore aucune dépense enregistrée."
                action={
                  <Pressable
                    onPress={onAddExpense}
                    className="flex-row items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3"
                  >
                    <Plus size={16} color="#FFFFFF" />

                    <Text className="text-sm font-bold text-white">
                      Ajouter une dépense
                    </Text>
                  </Pressable>
                }
              />
            ) : (
              (Object.keys(CATEGORIES) as Category[]).map((category) => (
                <CategoryRow
                  key={category}
                  category={category}
                  amount={categoryTotals[category]}
                  currency={currency}
                  total={compatibleCategoryTotal}
                />
              ))
            )}
          </>
        ) : null}

        {activeTab === "expenses" ? (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <SectionTitle
                title="Dépenses"
                subtitle={
                  expenses
                    ? `${expenses.length} enregistrement(s)`
                    : "Chargement…"
                }
              />

              <Pressable
                onPress={onAddExpense}
                className="h-10 w-10 items-center justify-center rounded-xl bg-blue-600"
              >
                <Plus size={18} color="#FFFFFF" />
              </Pressable>
            </View>

            {!expenses ? (
              <LoadingState />
            ) : expenses.length === 0 ? (
              <EmptyState
                Icon={Wallet}
                title="Aucune dépense enregistrée"
                description="Ajoutez votre première dépense pour commencer à suivre réellement ce voyage."
              />
            ) : (
              expenses.map((expense) => (
                <ExpenseRow key={expense._id} expense={expense} />
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Main authenticated page                                                    */
/* -------------------------------------------------------------------------- */

function BudgetInner({ onBack }: Props) {
  const [selectedPlanId, setSelectedPlanId] =
    useState<Id<"travelPlans"> | null>(null);

  const [activeTab, setActiveTab] = useState<MainTab>("overview");

  const [planTab, setPlanTab] = useState<PlanTab>("expenses");

  const [showAdd, setShowAdd] = useState(false);

  const [newLabel, setNewLabel] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const [newCategory, setNewCategory] = useState<Category>("repas");

  const [newCurrency, setNewCurrency] = useState<Currency>("EUR");

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const plans = useQuery(api.travel.listMyTravelPlans, {});

  const expenses = useQuery(
    api.travel.listTravelExpenses,
    selectedPlanId ? { planId: selectedPlanId } : "skip",
  );

  const addExpense = useMutation(api.travel.addTravelExpense);

  const selectedPlan = useMemo(
    () => plans?.find((plan) => plan._id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const resetExpenseForm = useCallback(() => {
    setNewLabel("");
    setNewAmount("");
    setNewCategory("repas");

    if (selectedPlan) {
      const planCurrency = getPlanCurrency(selectedPlan);

      if (planCurrency) {
        setNewCurrency(planCurrency);
      }
    }

    setShowCurrencyPicker(false);
  }, [selectedPlan]);

  const closeAddExpense = useCallback(() => {
    if (submitting) {
      return;
    }

    setShowAdd(false);
    resetExpenseForm();
  }, [resetExpenseForm, submitting]);

  const openAddExpense = useCallback(() => {
    if (selectedPlan) {
      const planCurrency = getPlanCurrency(selectedPlan);

      if (planCurrency) {
        setNewCurrency(planCurrency);
      }
    }

    setShowAdd(true);
  }, [selectedPlan]);

  const handleAddExpense = useCallback(async () => {
    if (!selectedPlanId || submitting) {
      return;
    }

    const description = newLabel.trim();
    const amount = parseAmount(newAmount);

    if (!description) {
      Alert.alert(
        "Description requise",
        "Veuillez renseigner la description de la dépense.",
      );
      return;
    }

    if (amount === null) {
      Alert.alert(
        "Montant invalide",
        "Veuillez saisir un montant supérieur à zéro.",
      );
      return;
    }

    try {
      setSubmitting(true);

      await addExpense({
        planId: selectedPlanId,
        category: newCategory,
        description,
        amount,
        currency: newCurrency,
        date: new Date().toISOString().split("T")[0],
      });

      setShowAdd(false);
      resetExpenseForm();

      Alert.alert(
        "Dépense enregistrée",
        "La dépense a été ajoutée à votre voyage.",
      );
    } catch (error) {
      console.error("[BudgetVoyagePage] addTravelExpense failed", error);

      Alert.alert(
        "Enregistrement impossible",
        "La dépense n'a pas pu être enregistrée. Vérifiez votre connexion et réessayez.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    addExpense,
    newAmount,
    newCategory,
    newCurrency,
    newLabel,
    resetExpenseForm,
    selectedPlanId,
    submitting,
  ]);

  const handleBackFromPlan = useCallback(() => {
    setSelectedPlanId(null);
    setPlanTab("expenses");
  }, []);

  if (selectedPlan && selectedPlanId) {
    return (
      <>
        <SelectedPlanView
          plan={selectedPlan}
          expenses={expenses}
          activeTab={planTab}
          onTabChange={setPlanTab}
          onBack={handleBackFromPlan}
          onAddExpense={openAddExpense}
        />

        <AddExpenseSheet
          visible={showAdd}
          onClose={closeAddExpense}
          label={newLabel}
          amount={newAmount}
          category={newCategory}
          currency={newCurrency}
          pickerVisible={showCurrencyPicker}
          submitting={submitting}
          onLabelChange={setNewLabel}
          onAmountChange={setNewAmount}
          onCategoryChange={setNewCategory}
          onOpenPicker={() => setShowCurrencyPicker(true)}
          onClosePicker={() => setShowCurrencyPicker(false)}
          onCurrencyChange={setNewCurrency}
          onSubmit={handleAddExpense}
        />
      </>
    );
  }

  return (
    <View className="flex-1 bg-[#050812]">
      <PageHeader
        title="Budget Voyage"
        subtitle={
          plans
            ? `${plans.length} voyage(s) enregistré(s)`
            : "Vos finances de voyage"
        }
        onBack={onBack}
      />

      <MainTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          <SectionTitle
            title="Mes voyages"
            subtitle="Sélectionnez un voyage pour consulter son budget et ses dépenses."
          />

          {!plans ? (
            <LoadingState />
          ) : plans.length === 0 ? (
            <EmptyState
              Icon={Wallet}
              title="Aucun voyage enregistré"
              description="Aucun budget de voyage réel n'est actuellement disponible dans votre compte."
            />
          ) : (
            plans.map((plan) => (
              <TravelPlanCard
                key={plan._id}
                plan={plan}
                onPress={() => {
                  setSelectedPlanId(plan._id);
                  setPlanTab("expenses");
                }}
              />
            ))
          )}
        </ScrollView>
      ) : null}

      {activeTab === "compare" ? <AnalysisView plans={plans} /> : null}

      {activeTab === "converter" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 40,
          }}
        >
          <SectionTitle
            title="Devises"
            subtitle="Les conversions doivent utiliser une source de taux vérifiable."
          />

          <ConverterUnavailable />
        </ScrollView>
      ) : null}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Authentication shell                                                       */
/* -------------------------------------------------------------------------- */

export default function BudgetVoyagePage({ onBack }: Props) {
  return (
    <View className="flex-1 bg-[#050812]">
      <Unauthenticated>
        <View className="flex-1 items-center justify-center px-6">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-white/5">
            <DollarSign size={28} color="rgba(255,255,255,0.4)" />
          </View>

          <Text className="text-center text-lg font-bold text-white">
            Votre budget voyage
          </Text>

          <Text className="mt-2 max-w-[320px] text-center text-sm leading-6 text-gray-400">
            Connectez-vous pour accéder à vos voyages et à vos dépenses réelles.
          </Text>

          <Pressable
            onPress={onBack}
            className="mt-6 flex-row items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3"
          >
            <ArrowLeft size={16} color="#CBD5E1" />

            <Text className="text-sm font-semibold text-gray-300">Retour</Text>
          </Pressable>
        </View>
      </Unauthenticated>

      <AuthLoading>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#60A5FA" />

          <Text className="mt-4 text-sm text-gray-500">
            Préparation de votre espace…
          </Text>
        </View>
      </AuthLoading>

      <Authenticated>
        <BudgetInner onBack={onBack} />
      </Authenticated>
    </View>
  );
}

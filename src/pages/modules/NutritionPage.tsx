import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Apple,
  ArrowLeft,
  BarChart2,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Droplets,
  Flame,
  Info,
  Plus,
  Search,
  Target,
  Trash2,
  TrendingUp,
  Wheat,
  X,
} from "lucide-react-native";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

/* ============================================================================
 * TYPES
 * ========================================================================== */

type Tab = "journal" | "aliments" | "recettes" | "objectifs";

type Meal = "petit-déjeuner" | "déjeuner" | "dîner" | "collation";

type Food = {
  id: string;
  name: string;
  category: string;
  cal100g: number;
  protein: number;
  carbs: number;
  fat: number;
  emoji: string;
};

type JournalEntry = {
  id: string;
  foodId: string;
  foodName: string;
  meal: Meal;
  grams: number;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  date: string;
};

type Recipe = {
  id: string;
  name: string;
  emoji: string;
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
  prepMin: number;
  servings: number;
  tags: string[];
  ingredients: string[];
  steps: string[];
};

type Goals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
};

type MacroValues = {
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
};

/* ============================================================================
 * CONSTANTES
 * ========================================================================== */

const ACCENT = "#E17055";
const PROTEIN = "#8B5CF6";
const CARBS = "#F59E0B";
const FAT = "#10B981";
const WATER = "#06B6D4";
const DANGER = "#EF4444";

const MEAL_LABELS: Record<Meal, string> = {
  "petit-déjeuner": "Petit-déjeuner",
  déjeuner: "Déjeuner",
  dîner: "Dîner",
  collation: "Collation",
};

const MEAL_EMOJIS: Record<Meal, string> = {
  "petit-déjeuner": "☀️",
  déjeuner: "🌤️",
  dîner: "🌙",
  collation: "🍎",
};

const MEALS: Meal[] = ["petit-déjeuner", "déjeuner", "dîner", "collation"];

const FOOD_CATEGORIES = [
  "Tous",
  "Céréales",
  "Protéines",
  "Légumes",
  "Fruits",
  "Laitiers",
  "Huiles",
];

/* ============================================================================
 * BASE ALIMENTAIRE
 * Source conservée de la version fournie.
 * ========================================================================== */

const FOODS: Food[] = [
  {
    id: "f1",
    name: "Riz blanc cuit",
    category: "Céréales",
    cal100g: 130,
    protein: 2.7,
    carbs: 28,
    fat: 0.3,
    emoji: "🍚",
  },
  {
    id: "f2",
    name: "Foutou (igname)",
    category: "Céréales",
    cal100g: 118,
    protein: 1.5,
    carbs: 27,
    fat: 0.2,
    emoji: "🫘",
  },
  {
    id: "f3",
    name: "Attiéké",
    category: "Céréales",
    cal100g: 149,
    protein: 1.3,
    carbs: 34,
    fat: 0.5,
    emoji: "🌾",
  },
  {
    id: "f4",
    name: "Plantain mûr cuit",
    category: "Céréales",
    cal100g: 122,
    protein: 1.2,
    carbs: 30,
    fat: 0.4,
    emoji: "🍌",
  },
  {
    id: "f5",
    name: "Pain baguette",
    category: "Céréales",
    cal100g: 270,
    protein: 8.5,
    carbs: 55,
    fat: 1.3,
    emoji: "🥖",
  },
  {
    id: "f6",
    name: "Couscous cuit",
    category: "Céréales",
    cal100g: 112,
    protein: 3.8,
    carbs: 23,
    fat: 0.2,
    emoji: "🌾",
  },

  {
    id: "f7",
    name: "Poulet grillé",
    category: "Protéines",
    cal100g: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    emoji: "🍗",
  },
  {
    id: "f8",
    name: "Poisson tilapia",
    category: "Protéines",
    cal100g: 128,
    protein: 26,
    carbs: 0,
    fat: 2.7,
    emoji: "🐟",
  },
  {
    id: "f9",
    name: "Œuf entier",
    category: "Protéines",
    cal100g: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    emoji: "🥚",
  },
  {
    id: "f10",
    name: "Haricots noirs cuits",
    category: "Protéines",
    cal100g: 132,
    protein: 8.9,
    carbs: 24,
    fat: 0.5,
    emoji: "🫘",
  },
  {
    id: "f11",
    name: "Arachides",
    category: "Protéines",
    cal100g: 567,
    protein: 26,
    carbs: 16,
    fat: 49,
    emoji: "🥜",
  },
  {
    id: "f12",
    name: "Viande bœuf maigre",
    category: "Protéines",
    cal100g: 250,
    protein: 26,
    carbs: 0,
    fat: 15,
    emoji: "🥩",
  },

  {
    id: "f13",
    name: "Feuilles de manioc",
    category: "Légumes",
    cal100g: 95,
    protein: 7,
    carbs: 13,
    fat: 1,
    emoji: "🥬",
  },
  {
    id: "f14",
    name: "Gombo cuit",
    category: "Légumes",
    cal100g: 33,
    protein: 1.9,
    carbs: 7.5,
    fat: 0.2,
    emoji: "🥦",
  },
  {
    id: "f15",
    name: "Tomate fraîche",
    category: "Légumes",
    cal100g: 18,
    protein: 0.9,
    carbs: 3.9,
    fat: 0.2,
    emoji: "🍅",
  },
  {
    id: "f16",
    name: "Oignon",
    category: "Légumes",
    cal100g: 40,
    protein: 1.1,
    carbs: 9.3,
    fat: 0.1,
    emoji: "🧅",
  },
  {
    id: "f17",
    name: "Épinards cuits",
    category: "Légumes",
    cal100g: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    emoji: "🥬",
  },

  {
    id: "f18",
    name: "Mangue",
    category: "Fruits",
    cal100g: 60,
    protein: 0.8,
    carbs: 15,
    fat: 0.4,
    emoji: "🥭",
  },
  {
    id: "f19",
    name: "Papaye",
    category: "Fruits",
    cal100g: 43,
    protein: 0.5,
    carbs: 11,
    fat: 0.3,
    emoji: "🍈",
  },
  {
    id: "f20",
    name: "Banane",
    category: "Fruits",
    cal100g: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    emoji: "🍌",
  },
  {
    id: "f21",
    name: "Orange",
    category: "Fruits",
    cal100g: 47,
    protein: 0.9,
    carbs: 12,
    fat: 0.1,
    emoji: "🍊",
  },

  {
    id: "f22",
    name: "Lait de vache",
    category: "Laitiers",
    cal100g: 61,
    protein: 3.2,
    carbs: 4.8,
    fat: 3.3,
    emoji: "🥛",
  },
  {
    id: "f23",
    name: "Yaourt nature",
    category: "Laitiers",
    cal100g: 59,
    protein: 3.5,
    carbs: 4.7,
    fat: 3.3,
    emoji: "🥛",
  },

  {
    id: "f24",
    name: "Huile de palme",
    category: "Huiles",
    cal100g: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    emoji: "🫙",
  },
  {
    id: "f25",
    name: "Huile d'arachide",
    category: "Huiles",
    cal100g: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    emoji: "🫙",
  },
];

const FOOD_MAP: Record<string, Food> = Object.fromEntries(
  FOODS.map((food) => [food.id, food]),
);

/* ============================================================================
 * RECETTES
 * Source conservée de la version fournie.
 * ========================================================================== */

const RECIPES: Recipe[] = [
  {
    id: "r1",
    name: "Riz au poulet sauce tomate",
    emoji: "🍛",
    cal: 420,
    protein: 32,
    carbs: 45,
    fat: 8,
    prepMin: 35,
    servings: 2,
    tags: ["protéiné", "équilibré", "africain"],
    ingredients: [
      "200g riz blanc",
      "150g poulet grillé",
      "2 tomates",
      "1 oignon",
      "1 c.s. huile de palme",
      "sel, épices",
    ],
    steps: [
      "Faire revenir l'oignon émincé 3 min.",
      "Ajouter les tomates coupées, laisser réduire 10 min.",
      "Incorporer le poulet coupé en dés.",
      "Ajouter le riz lavé et couvrir d'eau. Cuire 20 min.",
    ],
  },
  {
    id: "r2",
    name: "Salade de papaye & mangue",
    emoji: "🥗",
    cal: 145,
    protein: 2,
    carbs: 35,
    fat: 1,
    prepMin: 10,
    servings: 2,
    tags: ["léger", "vitaminé", "sans cuisson"],
    ingredients: [
      "1 papaye moyenne",
      "1 mangue",
      "1 orange",
      "Jus de citron",
      "Feuilles de menthe",
    ],
    steps: [
      "Éplucher et couper les fruits en cubes.",
      "Presser le jus d'orange et de citron.",
      "Mélanger les fruits avec le jus.",
      "Ajouter la menthe ciselée et servir frais.",
    ],
  },
  {
    id: "r3",
    name: "Omelette épinards & tomate",
    emoji: "🍳",
    cal: 210,
    protein: 16,
    carbs: 5,
    fat: 14,
    prepMin: 15,
    servings: 1,
    tags: ["protéiné", "petit-déjeuner", "rapide"],
    ingredients: [
      "3 œufs",
      "50g épinards",
      "1 tomate",
      "1/2 oignon",
      "Huile d'arachide",
      "Sel, poivre",
    ],
    steps: [
      "Faire revenir oignon et tomate 3 min.",
      "Ajouter les épinards, cuire 2 min.",
      "Battre les œufs, verser sur les légumes.",
      "Cuire à feu moyen, plier l'omelette.",
    ],
  },
  {
    id: "r4",
    name: "Haricots braisés à l'arachide",
    emoji: "🫘",
    cal: 310,
    protein: 14,
    carbs: 38,
    fat: 10,
    prepMin: 40,
    servings: 3,
    tags: ["vegan", "protéiné", "africain"],
    ingredients: [
      "300g haricots cuits",
      "3 c.s. pâte d'arachide",
      "2 tomates",
      "1 oignon",
      "Piment, sel",
    ],
    steps: [
      "Faire revenir oignon et tomate 5 min.",
      "Diluer la pâte d'arachide dans 200ml d'eau.",
      "Ajouter les haricots et la sauce arachide.",
      "Laisser mijoter 25 min en remuant.",
    ],
  },
  {
    id: "r5",
    name: "Smoothie banane & arachide",
    emoji: "🥤",
    cal: 295,
    protein: 9,
    carbs: 40,
    fat: 12,
    prepMin: 5,
    servings: 1,
    tags: ["petit-déjeuner", "rapide", "énergisant"],
    ingredients: [
      "2 bananes",
      "2 c.s. pâte d'arachide",
      "250ml lait",
      "1 c.c. miel",
    ],
    steps: [
      "Mettre tous les ingrédients dans un mixeur.",
      "Mixer 30 secondes jusqu'à consistance lisse.",
      "Servir immédiatement.",
    ],
  },
  {
    id: "r6",
    name: "Tilapia grillé & attiéké",
    emoji: "🐟",
    cal: 380,
    protein: 35,
    carbs: 40,
    fat: 6,
    prepMin: 30,
    servings: 2,
    tags: ["protéiné", "africain", "équilibré"],
    ingredients: [
      "2 tilapias entiers",
      "200g attiéké",
      "2 tomates",
      "1 oignon",
      "Citron, piment",
      "Huile d'arachide",
    ],
    steps: [
      "Mariner le poisson avec citron, sel, piment 10 min.",
      "Griller le poisson 8 min de chaque côté.",
      "Préparer l'attiéké selon les instructions.",
      "Servir avec une salade de tomates et oignons.",
    ],
  },
];

/* ============================================================================
 * HELPERS
 * ========================================================================== */

function getTodayKey(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatNumber(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

function formatDecimal(value: number): string {
  return value.toLocaleString("fr-FR", {
    maximumFractionDigits: 1,
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ============================================================================
 * PREMIUM HEADER
 * ========================================================================== */

function NutritionHeader({
  onBack,
  date,
  onOpenGoals,
}: {
  onBack: () => void;
  date: Date;
  onOpenGoals: () => void;
}) {
  const formattedDate = date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
      >
        <ArrowLeft size={19} color="#FFFFFF" />
      </Pressable>

      <View style={styles.headerIdentity}>
        <View style={styles.headerIcon}>
          <Apple size={18} color={ACCENT} strokeWidth={2} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Nutrition</Text>

          <View style={styles.headerDateRow}>
            <Calendar size={10} color="#71717A" />

            <Text style={styles.headerDate}>{formattedDate}</Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={onOpenGoals}
        style={({ pressed }) => [
          styles.headerAction,
          pressed && styles.pressed,
        ]}
      >
        <Target size={17} color="#C4B5FD" />
      </Pressable>
    </View>
  );
}

/* ============================================================================
 * TABS
 * ========================================================================== */

function NutritionTabs({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const items: Array<{
    id: Tab;
    label: string;
  }> = [
    {
      id: "journal",
      label: "Journal",
    },
    {
      id: "aliments",
      label: "Aliments",
    },
    {
      id: "recettes",
      label: "Recettes",
    },
    {
      id: "objectifs",
      label: "Objectifs",
    },
  ];

  return (
    <View style={styles.tabsContainer}>
      {items.map((item) => {
        const active = tab === item.id;

        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={({ pressed }) => [
              styles.tabButton,
              active && styles.tabButtonActive,
              pressed && styles.tabPressed,
            ]}
          >
            <Text style={[styles.tabText, active && styles.tabTextActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================================
 * MACRO BAR
 * ========================================================================== */

function MacroBar({
  label,
  value,
  goal,
  color,
  unit = "g",
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
  unit?: string;
}) {
  const percent = goal > 0 ? clamp((value / goal) * 100, 0, 100) : 0;

  const exceeded = goal > 0 && value > goal;

  return (
    <View style={styles.macroBarContainer}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>

        <Text
          style={[
            styles.macroValue,
            exceeded && {
              color: DANGER,
            },
          ]}
        >
          {formatNumber(value)}
          <Text style={styles.macroGoal}>
            /{formatNumber(goal)}
            {unit}
          </Text>
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${percent}%`,
              backgroundColor: exceeded ? DANGER : color,
            },
          ]}
        />
      </View>
    </View>
  );
}

/* ============================================================================
 * CALORIE HERO
 * ========================================================================== */

function CalorieHero({ totals, goals }: { totals: MacroValues; goals: Goals }) {
  const percent =
    goals.calories > 0 ? clamp((totals.cal / goals.calories) * 100, 0, 100) : 0;

  const remaining = Math.max(0, goals.calories - totals.cal);

  const exceeded = totals.cal > goals.calories;

  return (
    <View style={styles.calorieHero}>
      <View style={styles.heroTop}>
        <View>
          <View style={styles.heroEyebrow}>
            <Flame size={13} color={ACCENT} />

            <Text style={styles.heroEyebrowText}>BILAN DU JOUR</Text>
          </View>

          <Text style={styles.heroTitle}>Ton alimentation</Text>

          <Text style={styles.heroSubtitle}>
            Suivi des calories et macronutriments
          </Text>
        </View>

        <View style={styles.heroTarget}>
          <Target size={14} color="#A78BFA" />

          <Text style={styles.heroTargetText}>
            {formatNumber(goals.calories)} kcal
          </Text>
        </View>
      </View>

      <View style={styles.heroMain}>
        <View style={styles.calorieRing}>
          <View style={styles.calorieRingOuter}>
            <View
              style={[
                styles.calorieRingProgress,
                {
                  height: `${percent}%`,
                  backgroundColor: exceeded ? DANGER : ACCENT,
                },
              ]}
            />
          </View>

          <View style={styles.calorieRingCenter}>
            <Text
              style={[
                styles.calorieNumber,
                exceeded && {
                  color: DANGER,
                },
              ]}
            >
              {formatNumber(totals.cal)}
            </Text>

            <Text style={styles.calorieUnit}>kcal</Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <Text style={styles.remainingLabel}>
            {exceeded ? "Objectif dépassé" : "Encore disponibles"}
          </Text>

          <Text
            style={[
              styles.remainingValue,
              exceeded && {
                color: DANGER,
              },
            ]}
          >
            {formatNumber(exceeded ? totals.cal - goals.calories : remaining)}{" "}
            kcal
          </Text>

          <Text style={styles.remainingCaption}>Objectif quotidien</Text>

          <View style={styles.heroDivider} />

          <MacroBar
            label="Protéines"
            value={totals.protein}
            goal={goals.protein}
            color={PROTEIN}
          />

          <MacroBar
            label="Glucides"
            value={totals.carbs}
            goal={goals.carbs}
            color={CARBS}
          />

          <MacroBar
            label="Lipides"
            value={totals.fat}
            goal={goals.fat}
            color={FAT}
          />
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * WATER
 * ========================================================================== */

function WaterTracker({
  water,
  goal,
  onChange,
}: {
  water: number;
  goal: number;
  onChange: (value: number) => void;
}) {
  const safeGoal = clamp(goal, 1, 20);

  return (
    <View style={styles.waterCard}>
      <View style={styles.waterHeader}>
        <View style={styles.waterIdentity}>
          <View style={styles.waterIcon}>
            <Droplets size={17} color={WATER} />
          </View>

          <View>
            <Text style={styles.cardTitle}>Hydratation</Text>

            <Text style={styles.cardSubtitle}>Suivi de votre consommation</Text>
          </View>
        </View>

        <Text style={styles.waterCount}>
          {water}/{safeGoal}
        </Text>
      </View>

      <View style={styles.waterGrid}>
        {Array.from({
          length: safeGoal,
        }).map((_, index) => {
          const filled = index < water;

          return (
            <Pressable
              key={index}
              onPress={() =>
                onChange(
                  filled ? Math.max(0, index) : Math.min(safeGoal, index + 1),
                )
              }
              style={({ pressed }) => [
                styles.waterGlass,
                filled && styles.waterGlassFilled,
                pressed && styles.pressed,
              ]}
            >
              <Droplets size={14} color={filled ? WATER : "#3F3F46"} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/* ============================================================================
 * MEAL CARD
 * ========================================================================== */

function MealCard({
  meal,
  entries,
  totals,
  expanded,
  onToggle,
  onAdd,
  onRemove,
}: {
  meal: Meal;
  entries: JournalEntry[];
  totals: MacroValues;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <View style={styles.mealCard}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.mealHeader, pressed && styles.pressed]}
      >
        <View style={styles.mealEmoji}>
          <Text style={styles.mealEmojiText}>{MEAL_EMOJIS[meal]}</Text>
        </View>

        <View style={styles.mealIdentity}>
          <Text style={styles.mealTitle}>{MEAL_LABELS[meal]}</Text>

          {totals.cal > 0 ? (
            <Text style={styles.mealSummary}>
              {formatNumber(totals.cal)} kcal · P {formatNumber(totals.protein)}
              g · G {formatNumber(totals.carbs)}g · L {formatNumber(totals.fat)}
              g
            </Text>
          ) : (
            <Text style={styles.mealSummaryEmpty}>
              Aucun aliment enregistré
            </Text>
          )}
        </View>

        <View style={styles.mealCalories}>
          <Text style={styles.mealCaloriesValue}>
            {formatNumber(totals.cal)}
          </Text>

          <Text style={styles.mealCaloriesUnit}>kcal</Text>
        </View>

        {expanded ? (
          <ChevronUp size={17} color="#71717A" />
        ) : (
          <ChevronDown size={17} color="#71717A" />
        )}
      </Pressable>

      {expanded ? (
        <View style={styles.mealBody}>
          {entries.length === 0 ? (
            <View style={styles.emptyMeal}>
              <Text style={styles.emptyMealText}>
                Ajoutez votre premier aliment
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {entries.map((entry) => {
                const food = FOOD_MAP[entry.foodId];

                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View style={styles.entryEmoji}>
                      <Text>{food?.emoji ?? "🍽️"}</Text>
                    </View>

                    <View style={styles.entryIdentity}>
                      <Text numberOfLines={1} style={styles.entryName}>
                        {entry.foodName}
                      </Text>

                      <Text style={styles.entryQuantity}>
                        {formatNumber(entry.grams)}g
                      </Text>
                    </View>

                    <Text style={styles.entryCalories}>
                      {formatNumber(entry.cal)} kcal
                    </Text>

                    <Pressable
                      onPress={() =>
                        Alert.alert("Supprimer cet aliment ?", entry.foodName, [
                          {
                            text: "Annuler",
                            style: "cancel",
                          },
                          {
                            text: "Supprimer",
                            style: "destructive",
                            onPress: () => onRemove(entry.id),
                          },
                        ])
                      }
                      style={({ pressed }) => [
                        styles.entryDelete,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Trash2 size={14} color="#71717A" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}

          <Pressable
            onPress={onAdd}
            style={({ pressed }) => [
              styles.addMealButton,
              pressed && styles.pressed,
            ]}
          >
            <Plus size={15} color={ACCENT} />

            <Text style={styles.addMealText}>Ajouter un aliment</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

/* ============================================================================
 * ADD FOOD MODAL
 * ========================================================================== */

function AddFoodModal({
  visible,
  meal,
  onClose,
  onAdd,
}: {
  visible: boolean;
  meal: Meal | null;
  onClose: () => void;
  onAdd: (entry: Omit<JournalEntry, "id" | "date">) => void;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);

  useEffect(() => {
    if (!visible) {
      setSearch("");
      setCategory("Tous");
      setSelected(null);
      setGrams(100);
    }
  }, [visible]);

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();

    return FOODS.filter((food) => {
      const categoryMatch = category === "Tous" || food.category === category;

      const searchMatch = !query || food.name.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [category, search]);

  const preview = useMemo(() => {
    if (!selected) {
      return null;
    }

    return {
      cal: Math.round((selected.cal100g * grams) / 100),

      protein: Math.round((selected.protein * grams * 10) / 100) / 10,

      carbs: Math.round((selected.carbs * grams * 10) / 100) / 10,

      fat: Math.round((selected.fat * grams * 10) / 100) / 10,
    };
  }, [grams, selected]);

  const handleAdd = () => {
    if (!selected || !preview || !meal) {
      return;
    }

    onAdd({
      foodId: selected.id,
      foodName: selected.name,
      meal,
      grams,
      ...preview,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.foodSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Ajouter un aliment</Text>

              {meal ? (
                <Text style={styles.sheetSubtitle}>{MEAL_LABELS[meal]}</Text>
              ) : null}
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          {!selected ? (
            <>
              <View style={styles.searchBox}>
                <Search size={15} color="#71717A" />

                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un aliment..."
                  placeholderTextColor="#52525B"
                  style={styles.searchInput}
                />
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContent}
              >
                {FOOD_CATEGORIES.map((item) => {
                  const active = category === item;

                  return (
                    <Pressable
                      key={item}
                      onPress={() => setCategory(item)}
                      style={[
                        styles.categoryChip,
                        active && styles.categoryChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          active && styles.categoryTextActive,
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </>
          ) : null}

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {selected && preview ? (
              <View>
                <View style={styles.selectedFood}>
                  <View style={styles.selectedEmoji}>
                    <Text style={styles.selectedEmojiText}>
                      {selected.emoji}
                    </Text>
                  </View>

                  <View style={styles.selectedIdentity}>
                    <Text style={styles.selectedName}>{selected.name}</Text>

                    <Text style={styles.selectedMeta}>
                      {selected.cal100g} kcal / 100 g
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => setSelected(null)}
                    style={styles.selectedClose}
                  >
                    <X size={15} color="#71717A" />
                  </Pressable>
                </View>

                <Text style={styles.quantityLabel}>Quantité</Text>

                <View style={styles.quantityRow}>
                  <Pressable
                    onPress={() =>
                      setGrams((value) => Math.max(10, value - 25))
                    }
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>−</Text>
                  </Pressable>

                  <View style={styles.quantityInputWrap}>
                    <TextInput
                      value={String(grams)}
                      onChangeText={(value) => {
                        const parsed = Number.parseInt(value, 10);

                        setGrams(
                          Number.isFinite(parsed) ? Math.max(1, parsed) : 1,
                        );
                      }}
                      keyboardType="number-pad"
                      style={styles.quantityInput}
                    />

                    <Text style={styles.quantityUnit}>g</Text>
                  </View>

                  <Pressable
                    onPress={() => setGrams((value) => value + 25)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </Pressable>
                </View>

                <View style={styles.quickGrams}>
                  {[50, 100, 150, 200].map((value) => {
                    const active = grams === value;

                    return (
                      <Pressable
                        key={value}
                        onPress={() => setGrams(value)}
                        style={[
                          styles.quickGram,
                          active && styles.quickGramActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.quickGramText,
                            active && styles.quickGramTextActive,
                          ]}
                        >
                          {value} g
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.previewGrid}>
                  <NutritionMetric
                    label="Calories"
                    value={preview.cal}
                    unit="kcal"
                    color={ACCENT}
                    icon={<Flame size={14} color={ACCENT} />}
                  />

                  <NutritionMetric
                    label="Protéines"
                    value={preview.protein}
                    unit="g"
                    color={PROTEIN}
                    icon={<Target size={14} color={PROTEIN} />}
                  />

                  <NutritionMetric
                    label="Glucides"
                    value={preview.carbs}
                    unit="g"
                    color={CARBS}
                    icon={<Wheat size={14} color={CARBS} />}
                  />

                  <NutritionMetric
                    label="Lipides"
                    value={preview.fat}
                    unit="g"
                    color={FAT}
                    icon={<BarChart2 size={14} color={FAT} />}
                  />
                </View>

                <Pressable
                  onPress={handleAdd}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <Plus size={16} color="#FFFFFF" />

                  <Text style={styles.primaryButtonText}>
                    Ajouter au {MEAL_LABELS[meal!]}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View>
                {filteredFoods.length === 0 ? (
                  <View style={styles.noResults}>
                    <Search size={25} color="#3F3F46" />

                    <Text style={styles.noResultsTitle}>
                      Aucun aliment trouvé
                    </Text>

                    <Text style={styles.noResultsText}>
                      Modifiez votre recherche ou votre catégorie.
                    </Text>
                  </View>
                ) : (
                  filteredFoods.map((food) => (
                    <Pressable
                      key={food.id}
                      onPress={() => setSelected(food)}
                      style={({ pressed }) => [
                        styles.foodRow,
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.foodEmoji}>
                        <Text style={styles.foodEmojiText}>{food.emoji}</Text>
                      </View>

                      <View style={styles.foodIdentity}>
                        <Text numberOfLines={1} style={styles.foodName}>
                          {food.name}
                        </Text>

                        <Text style={styles.foodCategory}>{food.category}</Text>
                      </View>

                      <View style={styles.foodCalories}>
                        <Text style={styles.foodCaloriesValue}>
                          {food.cal100g}
                        </Text>

                        <Text style={styles.foodCaloriesUnit}>kcal/100g</Text>
                      </View>

                      <ChevronRight size={15} color="#52525B" />
                    </Pressable>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * METRIC
 * ========================================================================== */

function NutritionMetric({
  label,
  value,
  unit,
  color,
  icon,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: ReactNode;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: `${color}0D`,
          borderColor: `${color}25`,
        },
      ]}
    >
      <View style={styles.metricIcon}>{icon}</View>

      <Text style={[styles.metricValue, { color }]}>
        {formatDecimal(value)}
      </Text>

      <Text style={styles.metricUnit}>{unit}</Text>

      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

/* ============================================================================
 * RECIPE CARD
 * ========================================================================== */

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={({ pressed }) => [styles.recipeCard, pressed && styles.pressed]}
      >
        <View style={styles.recipeHero}>
          <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>

          <View style={styles.recipeHeroBadge}>
            <Flame size={11} color={ACCENT} />

            <Text style={styles.recipeHeroBadgeText}>{recipe.cal} kcal</Text>
          </View>
        </View>

        <View style={styles.recipeBody}>
          <Text numberOfLines={2} style={styles.recipeName}>
            {recipe.name}
          </Text>

          <View style={styles.recipeTags}>
            {recipe.tags.map((tag) => (
              <View key={tag} style={styles.recipeTag}>
                <Text style={styles.recipeTagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          <View style={styles.recipeMeta}>
            <Text style={styles.recipeMetaText}>{recipe.prepMin} min</Text>

            <View style={styles.recipeMetaDot} />

            <Text style={styles.recipeMetaText}>{recipe.servings} pers.</Text>
          </View>

          <View style={styles.recipeMacros}>
            <RecipeMacro label="P" value={recipe.protein} color={PROTEIN} />

            <RecipeMacro label="G" value={recipe.carbs} color={CARBS} />

            <RecipeMacro label="L" value={recipe.fat} color={FAT} />
          </View>
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setOpen(false)}
          />

          <View style={styles.recipeSheet}>
            <View style={styles.sheetHandle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.recipeSheetContent}
            >
              <View style={styles.recipeModalHero}>
                <Text style={styles.recipeModalEmoji}>{recipe.emoji}</Text>
              </View>

              <Text style={styles.recipeModalTitle}>{recipe.name}</Text>

              <View style={styles.recipeModalMeta}>
                <Text style={styles.recipeModalMetaText}>
                  {recipe.prepMin} min
                </Text>

                <Text style={styles.recipeModalMetaText}>
                  {recipe.servings} personne
                  {recipe.servings > 1 ? "s" : ""}
                </Text>
              </View>

              <View style={styles.previewGrid}>
                <NutritionMetric
                  label="Calories"
                  value={recipe.cal}
                  unit="kcal"
                  color={ACCENT}
                  icon={<Flame size={14} color={ACCENT} />}
                />

                <NutritionMetric
                  label="Protéines"
                  value={recipe.protein}
                  unit="g"
                  color={PROTEIN}
                  icon={<Target size={14} color={PROTEIN} />}
                />

                <NutritionMetric
                  label="Glucides"
                  value={recipe.carbs}
                  unit="g"
                  color={CARBS}
                  icon={<Wheat size={14} color={CARBS} />}
                />

                <NutritionMetric
                  label="Lipides"
                  value={recipe.fat}
                  unit="g"
                  color={FAT}
                  icon={<BarChart2 size={14} color={FAT} />}
                />
              </View>

              <RecipeSection
                icon={<Apple size={15} color={ACCENT} />}
                title="Ingrédients"
              >
                {recipe.ingredients.map((ingredient, index) => (
                  <View
                    key={`${ingredient}-${index}`}
                    style={styles.ingredientRow}
                  >
                    <View style={styles.ingredientBullet} />

                    <Text style={styles.ingredientText}>{ingredient}</Text>
                  </View>
                ))}
              </RecipeSection>

              <RecipeSection
                icon={<BookOpen size={15} color={ACCENT} />}
                title="Préparation"
              >
                {recipe.steps.map((step, index) => (
                  <View key={`${step}-${index}`} style={styles.stepRow}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>

                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </RecipeSection>

              <View style={styles.recipeNotice}>
                <Info size={14} color="#A78BFA" />

                <Text style={styles.recipeNoticeText}>
                  Les valeurs nutritionnelles affichées sont celles définies
                  dans le catalogue de recettes de cette version.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ============================================================================
 * RECIPE HELPERS
 * ========================================================================== */

function RecipeMacro({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Text style={[styles.recipeMacro, { color }]}>
      {label} {value}g
    </Text>
  );
}

function RecipeSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.recipeSection}>
      <View style={styles.recipeSectionHeader}>
        {icon}

        <Text style={styles.recipeSectionTitle}>{title}</Text>
      </View>

      {children}
    </View>
  );
}

/* ============================================================================
 * GOALS MODAL
 * ========================================================================== */

function GoalsModal({
  visible,
  goals,
  onClose,
  onSave,
}: {
  visible: boolean;
  goals: Goals;
  onClose: () => void;
  onSave: (goals: Goals) => void;
}) {
  const [draft, setDraft] = useState<Goals>(goals);

  useEffect(() => {
    if (visible) {
      setDraft(goals);
    }
  }, [goals, visible]);

  const fields: Array<{
    key: keyof Goals;
    label: string;
    unit: string;
    step: number;
    color: string;
  }> = [
    {
      key: "calories",
      label: "Calories",
      unit: "kcal / jour",
      step: 100,
      color: ACCENT,
    },
    {
      key: "protein",
      label: "Protéines",
      unit: "g / jour",
      step: 5,
      color: PROTEIN,
    },
    {
      key: "carbs",
      label: "Glucides",
      unit: "g / jour",
      step: 5,
      color: CARBS,
    },
    {
      key: "fat",
      label: "Lipides",
      unit: "g / jour",
      step: 5,
      color: FAT,
    },
    {
      key: "water",
      label: "Eau",
      unit: "verres / jour",
      step: 1,
      color: WATER,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />

        <View style={styles.goalsSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Mes objectifs</Text>

              <Text style={styles.sheetSubtitle}>Paramètres nutritionnels</Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <X size={17} color="#A1A1AA" />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.goalsContent}
          >
            <View style={styles.goalsIntro}>
              <Target size={17} color="#A78BFA" />

              <Text style={styles.goalsIntroText}>
                Définissez vos repères personnels. Ils servent au suivi du
                journal et ne constituent pas une prescription médicale.
              </Text>
            </View>

            {fields.map((field) => {
              const value = draft[field.key];

              return (
                <View key={field.key} style={styles.goalField}>
                  <View style={styles.goalFieldHeader}>
                    <View
                      style={[
                        styles.goalColor,
                        {
                          backgroundColor: field.color,
                        },
                      ]}
                    />

                    <View>
                      <Text style={styles.goalLabel}>{field.label}</Text>

                      <Text style={styles.goalUnit}>{field.unit}</Text>
                    </View>
                  </View>

                  <View style={styles.goalControls}>
                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: Math.max(
                            0,
                            Number(current[field.key]) - field.step,
                          ),
                        }))
                      }
                      style={styles.goalAdjust}
                    >
                      <Text style={styles.goalAdjustText}>−</Text>
                    </Pressable>

                    <TextInput
                      value={String(value)}
                      onChangeText={(text) => {
                        const parsed = Number.parseInt(text, 10);

                        setDraft((current) => ({
                          ...current,
                          [field.key]: Number.isFinite(parsed)
                            ? Math.max(0, parsed)
                            : 0,
                        }));
                      }}
                      keyboardType="number-pad"
                      style={styles.goalInput}
                    />

                    <Pressable
                      onPress={() =>
                        setDraft((current) => ({
                          ...current,
                          [field.key]: Number(current[field.key]) + field.step,
                        }))
                      }
                      style={styles.goalAdjust}
                    >
                      <Text style={styles.goalAdjustText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            <Pressable
              onPress={() => {
                onSave(draft);
                onClose();
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Check size={16} color="#FFFFFF" />

              <Text style={styles.primaryButtonText}>
                Enregistrer mes objectifs
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================================
 * ALIMENTS TAB
 * ========================================================================== */

function FoodsTab({ onAdd }: { onAdd: () => void }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Tous");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return FOODS.filter((food) => {
      const categoryMatch = category === "Tous" || food.category === category;

      const searchMatch = !query || food.name.toLowerCase().includes(query);

      return categoryMatch && searchMatch;
    });
  }, [category, search]);

  return (
    <View>
      <View style={styles.searchBox}>
        <Search size={15} color="#71717A" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher dans les aliments..."
          placeholderTextColor="#52525B"
          style={styles.searchInput}
        />

        {search.length > 0 ? (
          <Pressable onPress={() => setSearch("")}>
            <X size={14} color="#71717A" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryContent}
      >
        {FOOD_CATEGORIES.map((item) => {
          const active = category === item;

          return (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text
                style={[
                  styles.categoryText,
                  active && styles.categoryTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.catalogHeader}>
        <View>
          <Text style={styles.catalogTitle}>Catalogue alimentaire</Text>

          <Text style={styles.catalogSubtitle}>
            {filtered.length} aliment
            {filtered.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <View style={styles.catalogBadge}>
          <Wheat size={13} color="#F59E0B" />
        </View>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.noResults}>
          <Search size={26} color="#3F3F46" />

          <Text style={styles.noResultsTitle}>Aucun aliment trouvé</Text>
        </View>
      ) : (
        <View style={styles.foodCatalog}>
          {filtered.map((food) => (
            <Pressable
              key={food.id}
              onPress={onAdd}
              style={({ pressed }) => [
                styles.catalogFoodRow,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.catalogFoodEmoji}>
                <Text>{food.emoji}</Text>
              </View>

              <View style={styles.catalogFoodIdentity}>
                <Text numberOfLines={1} style={styles.catalogFoodName}>
                  {food.name}
                </Text>

                <Text style={styles.catalogFoodCategory}>{food.category}</Text>

                <View style={styles.catalogMacros}>
                  <Text
                    style={[
                      styles.catalogMacro,
                      {
                        color: PROTEIN,
                      },
                    ]}
                  >
                    P {food.protein}g
                  </Text>

                  <Text
                    style={[
                      styles.catalogMacro,
                      {
                        color: CARBS,
                      },
                    ]}
                  >
                    G {food.carbs}g
                  </Text>

                  <Text
                    style={[
                      styles.catalogMacro,
                      {
                        color: FAT,
                      },
                    ]}
                  >
                    L {food.fat}g
                  </Text>
                </View>
              </View>

              <View style={styles.catalogCalories}>
                <Text style={styles.catalogCaloriesValue}>{food.cal100g}</Text>

                <Text style={styles.catalogCaloriesUnit}>kcal</Text>
              </View>

              <View style={styles.catalogAdd}>
                <Plus size={15} color={ACCENT} />
              </View>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.dataNotice}>
        <Info size={14} color="#71717A" />

        <Text style={styles.dataNoticeText}>
          Les valeurs nutritionnelles du catalogue sont des données de référence
          affichées par l'application. Elles peuvent varier selon la variété, la
          préparation et la portion réelle.
        </Text>
      </View>
    </View>
  );
}

/* ============================================================================
 * RECIPES TAB
 * ========================================================================== */

function RecipesTab() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return RECIPES;
    }

    return RECIPES.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(query) ||
        recipe.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }, [search]);

  return (
    <View>
      <View style={styles.recipeIntro}>
        <View style={styles.recipeIntroIcon}>
          <Apple size={19} color={ACCENT} />
        </View>

        <View style={styles.recipeIntroText}>
          <Text style={styles.recipeIntroTitle}>Recettes</Text>

          <Text style={styles.recipeIntroSubtitle}>
            Une sélection issue du catalogue de cette version.
          </Text>
        </View>
      </View>

      <View style={styles.searchBox}>
        <Search size={15} color="#71717A" />

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher une recette..."
          placeholderTextColor="#52525B"
          style={styles.searchInput}
        />

        {search.length > 0 ? (
          <Pressable onPress={() => setSearch("")}>
            <X size={14} color="#71717A" />
          </Pressable>
        ) : null}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.noResults}>
          <Search size={26} color="#3F3F46" />

          <Text style={styles.noResultsTitle}>Aucune recette trouvée</Text>
        </View>
      ) : (
        <View style={styles.recipeGrid}>
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </View>
      )}
    </View>
  );
}

/* ============================================================================
 * OBJECTIVES TAB
 * ========================================================================== */

function GoalsTab({
  totals,
  goals,
  water,
  weekDays,
  onEdit,
}: {
  totals: MacroValues;
  goals: Goals;
  water: number;
  weekDays: Array<{
    label: string;
    cal: number;
    key: string;
  }>;
  onEdit: () => void;
}) {
  const maxWeekCal = Math.max(
    ...weekDays.map((day) => day.cal),
    goals.calories,
    1,
  );

  return (
    <View>
      <View style={styles.goalsHero}>
        <View>
          <Text style={styles.goalsHeroEyebrow}>VOS REPÈRES</Text>

          <Text style={styles.goalsHeroTitle}>Objectifs du jour</Text>

          <Text style={styles.goalsHeroSubtitle}>
            Comparez votre progression avec vos objectifs personnels.
          </Text>
        </View>

        <Pressable onPress={onEdit} style={styles.editGoalsButton}>
          <Target size={14} color="#C4B5FD" />

          <Text style={styles.editGoalsText}>Modifier</Text>
        </Pressable>
      </View>

      <View style={styles.goalCard}>
        <MacroBar
          label="Calories"
          value={totals.cal}
          goal={goals.calories}
          color={ACCENT}
          unit=" kcal"
        />

        <MacroBar
          label="Protéines"
          value={totals.protein}
          goal={goals.protein}
          color={PROTEIN}
        />

        <MacroBar
          label="Glucides"
          value={totals.carbs}
          goal={goals.carbs}
          color={CARBS}
        />

        <MacroBar
          label="Lipides"
          value={totals.fat}
          goal={goals.fat}
          color={FAT}
        />

        <MacroBar
          label="Eau"
          value={water}
          goal={goals.water}
          color={WATER}
          unit=" verres"
        />
      </View>

      <View style={styles.chartHeader}>
        <View>
          <Text style={styles.chartTitle}>Calories sur 7 jours</Text>

          <Text style={styles.chartSubtitle}>Journal enregistré</Text>
        </View>

        <TrendingUp size={17} color={ACCENT} />
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chart}>
          {weekDays.map((day) => {
            const height =
              day.cal > 0 ? Math.max(8, (day.cal / maxWeekCal) * 100) : 4;

            const today = day.key === getTodayKey();

            return (
              <View key={day.key} style={styles.chartColumn}>
                <Text style={styles.chartValue}>
                  {day.cal > 0 ? formatNumber(day.cal) : ""}
                </Text>

                <View style={styles.chartBarArea}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: `${height}%`,
                        backgroundColor: today
                          ? ACCENT
                          : "rgba(225,112,85,0.28)",
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.chartDay, today && styles.chartDayActive]}>
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.chartLegend}>
          <View style={styles.legendDot} />

          <Text style={styles.legendText}>
            Objectif : {formatNumber(goals.calories)} kcal/jour
          </Text>
        </View>
      </View>

      <View style={styles.safetyCard}>
        <Info size={16} color="#A78BFA" />

        <View style={styles.safetyContent}>
          <Text style={styles.safetyTitle}>Suivi, pas diagnostic</Text>

          <Text style={styles.safetyText}>
            Les objectifs et calculs de cette page sont des outils de suivi
            général. Pour une alimentation thérapeutique, une maladie, une
            grossesse ou un besoin nutritionnel particulier, demandez conseil à
            un professionnel qualifié.
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================================================
 * MAIN
 * ========================================================================== */

export default function NutritionPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("journal");

  const [journal, setJournal] = useState<JournalEntry[]>([]);

  const [goals, setGoals] = useState<Goals>({
    calories: 2000,
    protein: 120,
    carbs: 250,
    fat: 65,
    water: 8,
  });

  const [water, setWater] = useState(0);

  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  const [goalsVisible, setGoalsVisible] = useState(false);

  const [expandedMeal, setExpandedMeal] = useState<Meal | null>(
    "petit-déjeuner",
  );

  const [syncing, setSyncing] = useState(false);

  const selectedDate = getTodayKey();

  const upsertNutrition = useMutation(api.health.upsertNutritionLog);

  const todayEntries = useMemo(
    () => journal.filter((entry) => entry.date === selectedDate),
    [journal, selectedDate],
  );

  const totals = useMemo<MacroValues>(
    () =>
      todayEntries.reduce(
        (acc, entry) => ({
          cal: acc.cal + entry.cal,
          protein: acc.protein + entry.protein,
          carbs: acc.carbs + entry.carbs,
          fat: acc.fat + entry.fat,
        }),
        {
          cal: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      ),
    [todayEntries],
  );

  const mealTotals = useMemo<Record<Meal, MacroValues>>(() => {
    const result: Record<Meal, MacroValues> = {
      "petit-déjeuner": {
        cal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      déjeuner: {
        cal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      dîner: {
        cal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
      collation: {
        cal: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    };

    for (const entry of todayEntries) {
      result[entry.meal].cal += entry.cal;

      result[entry.meal].protein += entry.protein;

      result[entry.meal].carbs += entry.carbs;

      result[entry.meal].fat += entry.fat;
    }

    return result;
  }, [todayEntries]);

  const weekDays = useMemo(() => {
    const result: Array<{
      label: string;
      cal: number;
      key: string;
    }> = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date();

      date.setHours(12, 0, 0, 0);
      date.setDate(date.getDate() - offset);

      const year = date.getFullYear();

      const month = String(date.getMonth() + 1).padStart(2, "0");

      const day = String(date.getDate()).padStart(2, "0");

      const key = `${year}-${month}-${day}`;

      const calories = journal
        .filter((entry) => entry.date === key)
        .reduce((sum, entry) => sum + entry.cal, 0);

      result.push({
        label: date
          .toLocaleDateString("fr-FR", {
            weekday: "short",
          })
          .replace(".", "")
          .slice(0, 3),
        cal: calories,
        key,
      });
    }

    return result;
  }, [journal]);

  /* ------------------------------------------------------------------------
   * BACKEND SYNC
   * Contract conservé exactement depuis le fichier fourni.
   * ---------------------------------------------------------------------- */

  const syncToday = async (entries: JournalEntry[], currentWater: number) => {
    setSyncing(true);

    try {
      const dayEntries = entries.filter((entry) => entry.date === selectedDate);

      await upsertNutrition({
        date: selectedDate,

        meals: MEALS.map((meal) => {
          const mealEntries = dayEntries.filter((entry) => entry.meal === meal);

          return {
            name: meal,
            time:
              meal === "petit-déjeuner"
                ? "08:00"
                : meal === "déjeuner"
                  ? "12:00"
                  : meal === "dîner"
                    ? "19:00"
                    : "16:00",

            calories: mealEntries.reduce((sum, entry) => sum + entry.cal, 0),

            items: mealEntries.map((entry) => entry.foodName),
          };
        }),

        totalCalories: dayEntries.reduce((sum, entry) => sum + entry.cal, 0),

        waterMl: currentWater * 250,
      });
    } catch (error) {
      console.error("Nutrition sync failed:", error);
    } finally {
      setSyncing(false);
    }
  };

  /* ------------------------------------------------------------------------
   * ADD
   * ---------------------------------------------------------------------- */

  const addEntry = async (entry: Omit<JournalEntry, "id" | "date">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: selectedDate,
    };

    const updated = [newEntry, ...journal];

    setJournal(updated);

    await syncToday(updated, water);
  };

  /* ------------------------------------------------------------------------
   * REMOVE
   * ---------------------------------------------------------------------- */

  const removeEntry = async (id: string) => {
    const updated = journal.filter((entry) => entry.id !== id);

    setJournal(updated);

    await syncToday(updated, water);
  };

  /* ------------------------------------------------------------------------
   * WATER
   * ---------------------------------------------------------------------- */

  const changeWater = async (value: number) => {
    const next = clamp(value, 0, 20);

    setWater(next);

    await syncToday(journal, next);
  };

  /* ------------------------------------------------------------------------
   * GOALS
   * ---------------------------------------------------------------------- */

  const saveGoals = (nextGoals: Goals) => {
    setGoals({
      calories: Math.max(0, Math.round(nextGoals.calories)),
      protein: Math.max(0, Math.round(nextGoals.protein)),
      carbs: Math.max(0, Math.round(nextGoals.carbs)),
      fat: Math.max(0, Math.round(nextGoals.fat)),
      water: clamp(Math.round(nextGoals.water), 1, 20),
    });
  };

  return (
    <View style={styles.screen}>
      <NutritionHeader
        onBack={onBack}
        date={new Date()}
        onOpenGoals={() => setGoalsVisible(true)}
      />

      <NutritionTabs tab={tab} onChange={setTab} />

      {syncing ? (
        <View style={styles.syncBar}>
          <ActivityIndicator size="small" color={ACCENT} />

          <Text style={styles.syncText}>Synchronisation…</Text>
        </View>
      ) : null}

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {tab === "journal" ? (
          <>
            <CalorieHero totals={totals} goals={goals} />

            <WaterTracker
              water={water}
              goal={goals.water}
              onChange={changeWater}
            />

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionHeadingTitle}>Mes repas</Text>

                <Text style={styles.sectionHeadingSubtitle}>
                  Construisez votre journal quotidien
                </Text>
              </View>

              <View style={styles.sectionHeadingBadge}>
                <Text style={styles.sectionHeadingBadgeText}>
                  {todayEntries.length}
                </Text>
              </View>
            </View>

            <View style={styles.mealsList}>
              {MEALS.map((meal) => (
                <MealCard
                  key={meal}
                  meal={meal}
                  entries={todayEntries.filter((entry) => entry.meal === meal)}
                  totals={mealTotals[meal]}
                  expanded={expandedMeal === meal}
                  onToggle={() =>
                    setExpandedMeal((current) =>
                      current === meal ? null : meal,
                    )
                  }
                  onAdd={() => setSelectedMeal(meal)}
                  onRemove={removeEntry}
                />
              ))}
            </View>

            <View style={styles.journalNotice}>
              <Info size={14} color="#71717A" />

              <Text style={styles.journalNoticeText}>
                Le journal de cette version utilise les aliments du catalogue
                ci-dessus. Les quantités sont calculées à partir des valeurs
                nutritionnelles définies pour chaque aliment.
              </Text>
            </View>
          </>
        ) : null}

        {tab === "aliments" ? (
          <FoodsTab onAdd={() => setSelectedMeal("déjeuner")} />
        ) : null}

        {tab === "recettes" ? <RecipesTab /> : null}

        {tab === "objectifs" ? (
          <GoalsTab
            totals={totals}
            goals={goals}
            water={water}
            weekDays={weekDays}
            onEdit={() => setGoalsVisible(true)}
          />
        ) : null}
      </ScrollView>

      <AddFoodModal
        visible={selectedMeal !== null}
        meal={selectedMeal}
        onClose={() => setSelectedMeal(null)}
        onAdd={addEntry}
      />

      <GoalsModal
        visible={goalsVisible}
        goals={goals}
        onClose={() => setGoalsVisible(false)}
        onSave={saveGoals}
      />
    </View>
  );
}

/* ============================================================================
 * STYLES
 * ========================================================================== */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#050812",
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 40,
  },

  pressed: {
    opacity: 0.72,
    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /* HEADER */

  header: {
    minHeight: 74,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.065)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  headerIdentity: {
    flex: 1,
    marginLeft: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.11)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.20)",
  },

  headerText: {
    marginLeft: 9,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.25,
  },

  headerDateRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
  },

  headerDate: {
    marginLeft: 4,
    color: "#71717A",
    fontSize: 9,
    fontWeight: "600",
    textTransform: "capitalize",
  },

  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(139,92,246,0.10)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.20)",
  },

  /* TABS */

  tabsContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 4,
    borderRadius: 14,
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  tabButton: {
    flex: 1,
    minHeight: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  tabButtonActive: {
    backgroundColor: "rgba(225,112,85,0.16)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.22)",
  },

  tabPressed: {
    opacity: 0.75,
  },

  tabText: {
    color: "#71717A",
    fontSize: 9.5,
    fontWeight: "800",
  },

  tabTextActive: {
    color: "#FCA58E",
  },

  syncBar: {
    height: 27,
    marginHorizontal: 16,
    marginTop: 7,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.07)",
  },

  syncText: {
    marginLeft: 6,
    color: "#A1A1AA",
    fontSize: 8.5,
    fontWeight: "700",
  },

  /* CALORIE HERO */

  calorieHero: {
    padding: 16,
    borderRadius: 23,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.085)",
    overflow: "hidden",
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  heroEyebrow: {
    flexDirection: "row",
    alignItems: "center",
  },

  heroEyebrowText: {
    marginLeft: 5,
    color: ACCENT,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  heroTitle: {
    marginTop: 5,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.35,
  },

  heroSubtitle: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 9,
    fontWeight: "600",
  },

  heroTarget: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139,92,246,0.08)",
  },

  heroTargetText: {
    marginLeft: 4,
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "800",
  },

  heroMain: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  calorieRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.055)",
    borderWidth: 8,
    borderColor: "rgba(255,255,255,0.055)",
  },

  calorieRingOuter: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 52,
    overflow: "hidden",
    justifyContent: "flex-end",
  },

  calorieRingProgress: {
    width: "100%",
    opacity: 0.25,
  },

  calorieRingCenter: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080C17",
  },

  calorieNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
  },

  calorieUnit: {
    marginTop: 1,
    color: "#71717A",
    fontSize: 8,
    fontWeight: "700",
  },

  heroStats: {
    flex: 1,
    marginLeft: 16,
  },

  remainingLabel: {
    color: "#A1A1AA",
    fontSize: 9,
    fontWeight: "700",
  },

  remainingValue: {
    marginTop: 2,
    color: ACCENT,
    fontSize: 20,
    fontWeight: "900",
  },

  remainingCaption: {
    marginTop: 1,
    color: "#52525B",
    fontSize: 8,
    fontWeight: "600",
  },

  heroDivider: {
    height: 1,
    marginVertical: 9,
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  macroBarContainer: {
    marginBottom: 7,
  },

  macroHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },

  macroLabel: {
    color: "#71717A",
    fontSize: 8,
    fontWeight: "700",
  },

  macroValue: {
    color: "#E4E4E7",
    fontSize: 8,
    fontWeight: "800",
  },

  macroGoal: {
    color: "#52525B",
    fontWeight: "600",
  },

  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.065)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  /* WATER */

  waterCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 20,
    backgroundColor: "rgba(6,182,212,0.065)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.16)",
  },

  waterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  waterIdentity: {
    flexDirection: "row",
    alignItems: "center",
  },

  waterIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(6,182,212,0.11)",
  },

  cardTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  cardSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8,
    fontWeight: "600",
  },

  waterCount: {
    color: WATER,
    fontSize: 11,
    fontWeight: "900",
  },

  waterGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  waterGlass: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  waterGlassFilled: {
    backgroundColor: "rgba(6,182,212,0.18)",
    borderColor: "rgba(6,182,212,0.30)",
  },

  /* SECTIONS */

  sectionHeading: {
    marginTop: 22,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionHeadingTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  sectionHeadingSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8.5,
    fontWeight: "600",
  },

  sectionHeadingBadge: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 7,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.10)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.16)",
  },

  sectionHeadingBadgeText: {
    color: ACCENT,
    fontSize: 9,
    fontWeight: "900",
  },

  mealsList: {
    gap: 8,
  },

  mealCard: {
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.065)",
  },

  mealHeader: {
    minHeight: 67,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  mealEmoji: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  mealEmojiText: {
    fontSize: 19,
  },

  mealIdentity: {
    flex: 1,
    marginLeft: 10,
  },

  mealTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  mealSummary: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 8,
    fontWeight: "600",
  },

  mealSummaryEmpty: {
    marginTop: 3,
    color: "#3F3F46",
    fontSize: 8,
    fontWeight: "600",
  },

  mealCalories: {
    marginRight: 8,
    alignItems: "flex-end",
  },

  mealCaloriesValue: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },

  mealCaloriesUnit: {
    marginTop: 1,
    color: "#52525B",
    fontSize: 7,
  },

  mealBody: {
    padding: 11,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.055)",
  },

  emptyMeal: {
    paddingVertical: 8,
    alignItems: "center",
  },

  emptyMealText: {
    color: "#52525B",
    fontSize: 8.5,
    fontWeight: "600",
  },

  entriesList: {
    gap: 6,
  },

  entryRow: {
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
  },

  entryEmoji: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  entryIdentity: {
    flex: 1,
    marginLeft: 8,
  },

  entryName: {
    color: "#D4D4D8",
    fontSize: 9.5,
    fontWeight: "700",
  },

  entryQuantity: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8,
  },

  entryCalories: {
    marginRight: 8,
    color: ACCENT,
    fontSize: 8.5,
    fontWeight: "800",
  },

  entryDelete: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
  },

  addMealButton: {
    minHeight: 38,
    marginTop: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.24)",
    borderStyle: "dashed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.06)",
  },

  addMealText: {
    marginLeft: 5,
    color: "#FCA58E",
    fontSize: 9,
    fontWeight: "800",
  },

  journalNotice: {
    marginTop: 15,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  journalNoticeText: {
    flex: 1,
    marginLeft: 8,
    color: "#52525B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* SEARCH */

  searchBox: {
    minHeight: 43,
    marginTop: 5,
    paddingHorizontal: 12,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },

  categoryContent: {
    paddingTop: 10,
    paddingBottom: 3,
  },

  categoryChip: {
    minHeight: 31,
    marginRight: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  categoryChipActive: {
    backgroundColor: "rgba(225,112,85,0.15)",
    borderColor: "rgba(225,112,85,0.28)",
  },

  categoryText: {
    color: "#71717A",
    fontSize: 8.5,
    fontWeight: "800",
  },

  categoryTextActive: {
    color: "#FCA58E",
  },

  catalogHeader: {
    marginTop: 18,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  catalogTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  catalogSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8,
  },

  catalogBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(245,158,11,0.10)",
  },

  foodCatalog: {
    gap: 6,
  },

  catalogFoodRow: {
    minHeight: 67,
    padding: 10,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },

  catalogFoodEmoji: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  catalogFoodIdentity: {
    flex: 1,
    marginLeft: 9,
  },

  catalogFoodName: {
    color: "#E4E4E7",
    fontSize: 9.5,
    fontWeight: "800",
  },

  catalogFoodCategory: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 7.5,
  },

  catalogMacros: {
    marginTop: 5,
    flexDirection: "row",
    gap: 6,
  },

  catalogMacro: {
    fontSize: 7,
    fontWeight: "800",
  },

  catalogCalories: {
    alignItems: "flex-end",
    marginLeft: 5,
  },

  catalogCaloriesValue: {
    color: ACCENT,
    fontSize: 11,
    fontWeight: "900",
  },

  catalogCaloriesUnit: {
    marginTop: 1,
    color: "#52525B",
    fontSize: 7,
  },

  catalogAdd: {
    width: 29,
    height: 29,
    marginLeft: 8,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.09)",
  },

  dataNotice: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },

  dataNoticeText: {
    flex: 1,
    marginLeft: 8,
    color: "#52525B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* RECIPES */

  recipeIntro: {
    marginTop: 4,
    padding: 13,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(225,112,85,0.06)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.12)",
  },

  recipeIntroIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.10)",
  },

  recipeIntroText: {
    flex: 1,
    marginLeft: 9,
  },

  recipeIntroTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  recipeIntroSubtitle: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 8,
    lineHeight: 12,
  },

  recipeGrid: {
    marginTop: 11,
    gap: 10,
  },

  recipeCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  recipeHero: {
    height: 110,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.065)",
  },

  recipeEmoji: {
    fontSize: 48,
  },

  recipeHeroBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(5,8,18,0.72)",
  },

  recipeHeroBadgeText: {
    marginLeft: 4,
    color: "#FCA58E",
    fontSize: 8,
    fontWeight: "900",
  },

  recipeBody: {
    padding: 12,
  },

  recipeName: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
    lineHeight: 16,
  },

  recipeTags: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },

  recipeTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(225,112,85,0.09)",
  },

  recipeTagText: {
    color: "#FCA58E",
    fontSize: 7,
    fontWeight: "800",
  },

  recipeMeta: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  recipeMetaText: {
    color: "#71717A",
    fontSize: 8,
    fontWeight: "700",
  },

  recipeMetaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    marginHorizontal: 6,
    backgroundColor: "#3F3F46",
  },

  recipeMacros: {
    marginTop: 8,
    flexDirection: "row",
    gap: 9,
  },

  recipeMacro: {
    fontSize: 8,
    fontWeight: "900",
  },

  /* OBJECTIVES */

  goalsHero: {
    marginTop: 4,
    padding: 15,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(139,92,246,0.065)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.15)",
  },

  goalsHeroEyebrow: {
    color: "#A78BFA",
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1.1,
  },

  goalsHeroTitle: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  goalsHeroSubtitle: {
    maxWidth: 210,
    marginTop: 3,
    color: "#71717A",
    fontSize: 8,
    lineHeight: 12,
  },

  editGoalsButton: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(139,92,246,0.11)",
  },

  editGoalsText: {
    marginLeft: 4,
    color: "#C4B5FD",
    fontSize: 8,
    fontWeight: "800",
  },

  goalCard: {
    marginTop: 10,
    padding: 15,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  chartHeader: {
    marginTop: 21,
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chartTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  chartSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8,
  },

  chartCard: {
    padding: 14,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  chart: {
    height: 145,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 6,
  },

  chartColumn: {
    flex: 1,
    alignItems: "center",
  },

  chartValue: {
    height: 15,
    color: "#52525B",
    fontSize: 6.5,
    fontWeight: "700",
  },

  chartBarArea: {
    flex: 1,
    width: "100%",
    justifyContent: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.055)",
  },

  chartBar: {
    width: "68%",
    alignSelf: "center",
    minHeight: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },

  chartDay: {
    marginTop: 6,
    color: "#52525B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  chartDayActive: {
    color: ACCENT,
  },

  chartLegend: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },

  legendText: {
    marginLeft: 5,
    color: "#52525B",
    fontSize: 7.5,
    fontWeight: "700",
  },

  safetyCard: {
    marginTop: 12,
    padding: 13,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139,92,246,0.045)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.10)",
  },

  safetyContent: {
    flex: 1,
    marginLeft: 8,
  },

  safetyTitle: {
    color: "#C4B5FD",
    fontSize: 9,
    fontWeight: "900",
  },

  safetyText: {
    marginTop: 4,
    color: "#52525B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* MODALS */

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.76)",
  },

  foodSheet: {
    height: "88%",
    backgroundColor: "#090D19",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  recipeSheet: {
    height: "88%",
    backgroundColor: "#090D19",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  goalsSheet: {
    maxHeight: "91%",
    backgroundColor: "#090D19",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
  },

  sheetHeader: {
    paddingHorizontal: 17,
    paddingTop: 14,
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  sheetSubtitle: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 8.5,
    fontWeight: "600",
  },

  closeButton: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  modalScroll: {
    flex: 1,
  },

  modalScrollContent: {
    padding: 14,
    paddingBottom: 35,
  },

  /* ADD FOOD */

  selectedFood: {
    padding: 12,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(225,112,85,0.07)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.14)",
  },

  selectedEmoji: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.10)",
  },

  selectedEmojiText: {
    fontSize: 22,
  },

  selectedIdentity: {
    flex: 1,
    marginLeft: 9,
  },

  selectedName: {
    color: "#FFFFFF",
    fontSize: 10.5,
    fontWeight: "900",
  },

  selectedMeta: {
    marginTop: 3,
    color: "#71717A",
    fontSize: 8,
  },

  selectedClose: {
    width: 29,
    height: 29,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  quantityLabel: {
    marginTop: 18,
    marginBottom: 8,
    color: "#A1A1AA",
    fontSize: 9,
    fontWeight: "800",
  },

  quantityRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  quantityButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  quantityButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },

  quantityInputWrap: {
    flex: 1,
    height: 42,
    marginHorizontal: 8,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },

  quantityInput: {
    width: 65,
    padding: 0,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "right",
  },

  quantityUnit: {
    marginLeft: 4,
    color: "#71717A",
    fontSize: 9,
    fontWeight: "800",
  },

  quickGrams: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  quickGram: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  quickGramActive: {
    backgroundColor: "rgba(225,112,85,0.16)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.25)",
  },

  quickGramText: {
    color: "#71717A",
    fontSize: 8,
    fontWeight: "800",
  },

  quickGramTextActive: {
    color: "#FCA58E",
  },

  previewGrid: {
    marginTop: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  metricCard: {
    flex: 1,
    minWidth: "22%",
    minHeight: 86,
    padding: 8,
    borderRadius: 13,
    alignItems: "center",
    borderWidth: 1,
  },

  metricIcon: {
    marginBottom: 4,
  },

  metricValue: {
    fontSize: 13,
    fontWeight: "900",
  },

  metricUnit: {
    marginTop: 1,
    color: "#52525B",
    fontSize: 6.5,
    fontWeight: "700",
  },

  metricLabel: {
    marginTop: 4,
    color: "#71717A",
    fontSize: 7,
    fontWeight: "700",
  },

  primaryButton: {
    minHeight: 46,
    marginTop: 16,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ACCENT,
  },

  primaryButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  foodRow: {
    minHeight: 62,
    marginBottom: 6,
    padding: 10,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.038)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  foodEmoji: {
    width: 39,
    height: 39,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },

  foodEmojiText: {
    fontSize: 20,
  },

  foodIdentity: {
    flex: 1,
    marginLeft: 9,
  },

  foodName: {
    color: "#E4E4E7",
    fontSize: 9.5,
    fontWeight: "800",
  },

  foodCategory: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 7.5,
  },

  foodCalories: {
    marginRight: 8,
    alignItems: "flex-end",
  },

  foodCaloriesValue: {
    color: ACCENT,
    fontSize: 10,
    fontWeight: "900",
  },

  foodCaloriesUnit: {
    marginTop: 1,
    color: "#52525B",
    fontSize: 6.5,
  },

  noResults: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  noResultsTitle: {
    marginTop: 10,
    color: "#71717A",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  noResultsText: {
    marginTop: 4,
    color: "#3F3F46",
    fontSize: 8,
    textAlign: "center",
  },

  /* RECIPES MODAL */

  recipeSheetContent: {
    padding: 15,
    paddingBottom: 35,
  },

  recipeModalHero: {
    width: 100,
    height: 100,
    alignSelf: "center",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.08)",
    borderWidth: 1,
    borderColor: "rgba(225,112,85,0.16)",
  },

  recipeModalEmoji: {
    fontSize: 50,
  },

  recipeModalTitle: {
    marginTop: 14,
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "900",
    textAlign: "center",
  },

  recipeModalMeta: {
    marginTop: 5,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  recipeModalMetaText: {
    color: "#71717A",
    fontSize: 9,
    fontWeight: "700",
  },

  recipeSection: {
    marginTop: 22,
  },

  recipeSectionHeader: {
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  recipeSectionTitle: {
    marginLeft: 6,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  ingredientRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  ingredientBullet: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginRight: 8,
    backgroundColor: ACCENT,
  },

  ingredientText: {
    flex: 1,
    color: "#A1A1AA",
    fontSize: 9.5,
    lineHeight: 15,
  },

  stepRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(225,112,85,0.13)",
  },

  stepNumberText: {
    color: "#FCA58E",
    fontSize: 8,
    fontWeight: "900",
  },

  stepText: {
    flex: 1,
    marginLeft: 9,
    color: "#A1A1AA",
    fontSize: 9.5,
    lineHeight: 16,
  },

  recipeNotice: {
    marginTop: 18,
    padding: 11,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139,92,246,0.05)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.10)",
  },

  recipeNoticeText: {
    flex: 1,
    marginLeft: 7,
    color: "#52525B",
    fontSize: 8,
    lineHeight: 13,
  },

  /* GOALS MODAL */

  goalsContent: {
    padding: 15,
    paddingBottom: 35,
  },

  goalsIntro: {
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(139,92,246,0.055)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.11)",
  },

  goalsIntroText: {
    flex: 1,
    marginLeft: 8,
    color: "#71717A",
    fontSize: 8.5,
    lineHeight: 14,
  },

  goalField: {
    marginTop: 10,
    minHeight: 65,
    padding: 11,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.055)",
  },

  goalFieldHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalColor: {
    width: 5,
    height: 28,
    borderRadius: 3,
    marginRight: 8,
  },

  goalLabel: {
    color: "#E4E4E7",
    fontSize: 9.5,
    fontWeight: "800",
  },

  goalUnit: {
    marginTop: 2,
    color: "#52525B",
    fontSize: 7,
  },

  goalControls: {
    flexDirection: "row",
    alignItems: "center",
  },

  goalAdjust: {
    width: 31,
    height: 31,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.055)",
  },

  goalAdjustText: {
    color: "#D4D4D8",
    fontSize: 16,
    fontWeight: "700",
  },

  goalInput: {
    width: 70,
    height: 34,
    marginHorizontal: 5,
    padding: 0,
    borderRadius: 9,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
});

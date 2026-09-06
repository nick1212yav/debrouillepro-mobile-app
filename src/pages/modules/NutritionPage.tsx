import { UIService } from "@/core/sdk/ui/UIService";
import { View, Pressable, Text, TextInput } from "react-native";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Search, Plus, X, Flame, Droplets, Beef,
  Wheat, ChevronDown, ChevronUp, Target, BarChart2,
  BookOpen, Check, Trash2, ChevronRight, Apple,
  Calendar, TrendingUp, Info,
} from "lucide-react-native";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";

// ── Types ──────────────────────────────────────────────────────────────────
type Tab = "journal" | "aliments" | "recettes" | "objectifs";
type Meal = "petit-déjeuner" | "déjeuner" | "dîner" | "collation";

type Food = {
  id: string;
  name: string;
  category: string;
  cal100g: number;
  protein: number; // g per 100g
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
  date: string; // YYYY-MM-DD
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
  water: number; // glasses
};

// ── Food Database ──────────────────────────────────────────────────────────
const FOODS: Food[] = [
  // Céréales & féculents
  { id: "f1",  name: "Riz blanc cuit",       category: "Céréales",  cal100g: 130, protein: 2.7, carbs: 28,  fat: 0.3, emoji: "🍚" },
  { id: "f2",  name: "Foutou (igname)",       category: "Céréales",  cal100g: 118, protein: 1.5, carbs: 27,  fat: 0.2, emoji: "🫘" },
  { id: "f3",  name: "Attiéké",               category: "Céréales",  cal100g: 149, protein: 1.3, carbs: 34,  fat: 0.5, emoji: "🌾" },
  { id: "f4",  name: "Plantain mûr cuit",     category: "Céréales",  cal100g: 122, protein: 1.2, carbs: 30,  fat: 0.4, emoji: "🍌" },
  { id: "f5",  name: "Pain baguette",         category: "Céréales",  cal100g: 270, protein: 8.5, carbs: 55,  fat: 1.3, emoji: "🥖" },
  { id: "f6",  name: "Couscous cuit",         category: "Céréales",  cal100g: 112, protein: 3.8, carbs: 23,  fat: 0.2, emoji: "🌾" },
  // Protéines
  { id: "f7",  name: "Poulet grillé",         category: "Protéines", cal100g: 165, protein: 31,  carbs: 0,   fat: 3.6, emoji: "🍗" },
  { id: "f8",  name: "Poisson tilapia",       category: "Protéines", cal100g: 128, protein: 26,  carbs: 0,   fat: 2.7, emoji: "🐟" },
  { id: "f9",  name: "Œuf entier",            category: "Protéines", cal100g: 155, protein: 13,  carbs: 1.1, fat: 11,  emoji: "🥚" },
  { id: "f10", name: "Haricots noirs cuits",  category: "Protéines", cal100g: 132, protein: 8.9, carbs: 24,  fat: 0.5, emoji: "🫘" },
  { id: "f11", name: "Arachides",             category: "Protéines", cal100g: 567, protein: 26,  carbs: 16,  fat: 49,  emoji: "🥜" },
  { id: "f12", name: "Viande bœuf maigre",    category: "Protéines", cal100g: 250, protein: 26,  carbs: 0,   fat: 15,  emoji: "🥩" },
  // Légumes
  { id: "f13", name: "Feuilles de manioc",    category: "Légumes",   cal100g: 95,  protein: 7,   carbs: 13,  fat: 1,   emoji: "🥬" },
  { id: "f14", name: "Gombo cuit",            category: "Légumes",   cal100g: 33,  protein: 1.9, carbs: 7.5, fat: 0.2, emoji: "🥦" },
  { id: "f15", name: "Tomate fraîche",        category: "Légumes",   cal100g: 18,  protein: 0.9, carbs: 3.9, fat: 0.2, emoji: "🍅" },
  { id: "f16", name: "Oignon",                category: "Légumes",   cal100g: 40,  protein: 1.1, carbs: 9.3, fat: 0.1, emoji: "🧅" },
  { id: "f17", name: "Épinards cuits",        category: "Légumes",   cal100g: 23,  protein: 2.9, carbs: 3.6, fat: 0.4, emoji: "🥬" },
  // Fruits
  { id: "f18", name: "Mangue",                category: "Fruits",    cal100g: 60,  protein: 0.8, carbs: 15,  fat: 0.4, emoji: "🥭" },
  { id: "f19", name: "Papaye",                category: "Fruits",    cal100g: 43,  protein: 0.5, carbs: 11,  fat: 0.3, emoji: "🍈" },
  { id: "f20", name: "Banane",                category: "Fruits",    cal100g: 89,  protein: 1.1, carbs: 23,  fat: 0.3, emoji: "🍌" },
  { id: "f21", name: "Orange",                category: "Fruits",    cal100g: 47,  protein: 0.9, carbs: 12,  fat: 0.1, emoji: "🍊" },
  // Produits laitiers
  { id: "f22", name: "Lait de vache",         category: "Laitiers",  cal100g: 61,  protein: 3.2, carbs: 4.8, fat: 3.3, emoji: "🥛" },
  { id: "f23", name: "Yaourt nature",         category: "Laitiers",  cal100g: 59,  protein: 3.5, carbs: 4.7, fat: 3.3, emoji: "🥛" },
  // Huiles & sauces
  { id: "f24", name: "Huile de palme",        category: "Huiles",    cal100g: 884, protein: 0,   carbs: 0,   fat: 100, emoji: "🫙" },
  { id: "f25", name: "Huile d'arachide",      category: "Huiles",    cal100g: 884, protein: 0,   carbs: 0,   fat: 100, emoji: "🫙" },
];

const FOOD_MAP: Record<string, Food> = Object.fromEntries(FOODS.map(f => [f.id, f]));

// ── Recipes ────────────────────────────────────────────────────────────────
const RECIPES: Recipe[] = [
  {
    id: "r1", name: "Riz au poulet sauce tomate", emoji: "🍛",
    cal: 420, protein: 32, carbs: 45, fat: 8, prepMin: 35, servings: 2,
    tags: ["protéiné", "équilibré", "africain"],
    ingredients: ["200g riz blanc", "150g poulet grillé", "2 tomates", "1 oignon", "1 c.s. huile de palme", "sel, épices"],
    steps: ["Faire revenir l'oignon émincé 3 min.", "Ajouter les tomates coupées, laisser réduire 10 min.", "Incorporer le poulet coupé en dés.", "Ajouter le riz lavé et couvrir d'eau. Cuire 20 min."],
  },
  {
    id: "r2", name: "Salade de papaye & mangue", emoji: "🥗",
    cal: 145, protein: 2, carbs: 35, fat: 1, prepMin: 10, servings: 2,
    tags: ["léger", "vitaminé", "sans cuisson"],
    ingredients: ["1 papaye moyenne", "1 mangue", "1 orange", "Jus de citron", "Feuilles de menthe"],
    steps: ["Éplucher et couper les fruits en cubes.", "Presser le jus d'orange et de citron.", "Mélanger les fruits avec le jus.", "Ajouter la menthe ciselée et servir frais."],
  },
  {
    id: "r3", name: "Omelette épinards & tomate", emoji: "🍳",
    cal: 210, protein: 16, carbs: 5, fat: 14, prepMin: 15, servings: 1,
    tags: ["protéiné", "petit-déjeuner", "rapide"],
    ingredients: ["3 œufs", "50g épinards", "1 tomate", "1/2 oignon", "Huile d'arachide", "Sel, poivre"],
    steps: ["Faire revenir oignon et tomate 3 min.", "Ajouter les épinards, cuire 2 min.", "Battre les œufs, verser sur les légumes.", "Cuire à feu moyen, plier l'omelette."],
  },
  {
    id: "r4", name: "Haricots braisés à l'arachide", emoji: "🫘",
    cal: 310, protein: 14, carbs: 38, fat: 10, prepMin: 40, servings: 3,
    tags: ["vegan", "protéiné", "africain"],
    ingredients: ["300g haricots cuits", "3 c.s. pâte d'arachide", "2 tomates", "1 oignon", "Piment, sel"],
    steps: ["Faire revenir oignon et tomate 5 min.", "Diluer la pâte d'arachide dans 200ml d'eau.", "Ajouter les haricots et la sauce arachide.", "Laisser mijoter 25 min en remuant."],
  },
  {
    id: "r5", name: "Smoothie banane & arachide", emoji: "🥤",
    cal: 295, protein: 9, carbs: 40, fat: 12, prepMin: 5, servings: 1,
    tags: ["petit-déjeuner", "rapide", "énergisant"],
    ingredients: ["2 bananes", "2 c.s. pâte d'arachide", "250ml lait", "1 c.c. miel"],
    steps: ["Mettre tous les ingrédients dans un mixeur.", "Mixer 30 secondes jusqu'à consistance lisse.", "Servir immédiatement."],
  },
  {
    id: "r6", name: "Tilapia grillé & attiéké", emoji: "🐟",
    cal: 380, protein: 35, carbs: 40, fat: 6, prepMin: 30, servings: 2,
    tags: ["protéiné", "africain", "équilibré"],
    ingredients: ["2 tilapias entiers", "200g attiéké", "2 tomates", "1 oignon", "Citron, piment", "Huile d'arachide"],
    steps: ["Mariner le poisson avec citron, sel, piment 10 min.", "Griller le poisson 8 min de chaque côté.", "Préparer l'attiéké selon les instructions.", "Servir avec une salade de tomates et oignons."],
  },
];

// ── Storage ────────────────────────────────────────────────────────────────
const JOURNAL_KEY  = "nutrition_journal_v1";
const GOALS_KEY    = "nutrition_goals_v1";
const WATER_KEY    = "nutrition_water_v1";

function todayStr() { return new Date().toISOString().split("T")[0]; }

function loadJournal(): JournalEntry[] {
  try { return JSON.parse(localStorage.getItem(JOURNAL_KEY) ?? "[]") as JournalEntry[]; }
  catch { return []; }
}
function saveJournal(j: JournalEntry[]) { localStorage.setItem(JOURNAL_KEY, JSON.stringify(j)); }

function loadGoals(): Goals {
  try {
    const raw = localStorage.getItem(GOALS_KEY);
    return raw ? (JSON.parse(raw) as Goals) : { calories: 2000, protein: 120, carbs: 250, fat: 65, water: 8 };
  } catch { return { calories: 2000, protein: 120, carbs: 250, fat: 65, water: 8 }; }
}
function saveGoals(g: Goals) { localStorage.setItem(GOALS_KEY, JSON.stringify(g)); }

function loadWater(): number {
  const raw = localStorage.getItem(WATER_KEY);
  if (!raw) return 0;
  try {
    const obj = JSON.parse(raw) as { date: string; glasses: number };
    return obj.date === todayStr() ? obj.glasses : 0;
  } catch { return 0; }
}
function saveWater(glasses: number) {
  localStorage.setItem(WATER_KEY, JSON.stringify({ date: todayStr(), glasses }));
}

// ── Meal labels ────────────────────────────────────────────────────────────
const MEAL_LABELS: Record<Meal, string> = {
  "petit-déjeuner": "Petit-déjeuner", déjeuner: "Déjeuner", dîner: "Dîner", collation: "Collation",
};
const MEAL_EMOJIS: Record<Meal, string> = {
  "petit-déjeuner": "☀️", déjeuner: "🌤️", dîner: "🌙", collation: "🍎",
};
const MEALS: Meal[] = ["petit-déjeuner", "déjeuner", "dîner", "collation"];
const FOOD_CATS = ["Tous", "Céréales", "Protéines", "Légumes", "Fruits", "Laitiers", "Huiles"];

// ── MacroBar ───────────────────────────────────────────────────────────────
function MacroBar({ label, value, goal, color }: { label: string; value: number; goal: number; color: string }) {
  const pct = Math.min(100, goal > 0 ? (value / goal) * 100 : 0);
  const over = value > goal;
  return (
    <View>
      <View className="flex justify-between text-xs mb-1">
        <Text className="text-gray-400">{label}</Text>
        <Text className={over ? "text-red-400" : "text-white"}>{Math.round(value)}<Text className="text-gray-500">/{goal}g</Text></Text>
      </View>
      <View className="h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
        <View className="h-full rounded-full" style={{ backgroundColor: over ? "#EF4444" : color }} />
      </View>
    </View>
  );
}

// ── Add Food Sheet ─────────────────────────────────────────────────────────
function AddFoodSheet({ meal, onAdd, onClose }: { meal: Meal; onAdd: (entry: Omit<JournalEntry, "id" | "date">) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [cat, setCat] = useState("Tous");

  const filtered = FOODS.filter(f => {
    const matchCat = cat === "Tous" || f.category === cat;
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const preview = selected ? {
    cal:     Math.round(selected.cal100g  * grams / 100),
    protein: Math.round(selected.protein  * grams / 100 * 10) / 10,
    carbs:   Math.round(selected.carbs    * grams / 100 * 10) / 10,
    fat:     Math.round(selected.fat      * grams / 100 * 10) / 10,
  } : null;

  const handleAdd = () => {
    if (!selected || !preview) return;
    onAdd({ foodId: selected.id, foodName: selected.name, meal, grams, ...preview });
    onClose();
  };

  return (
    <Pressable className="fixed inset-0 z-50 flex items-end"
      style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      onPress={onClose}>
      <Pressable className="w-full max-w-md mx-auto rounded-t-3xl flex flex-col"
        style={{ backgroundColor: "#12122a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}
        onPress={e => e.stopPropagation()}>
        <View className="p-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-3" />
          <View className="flex items-center justify-between mb-3">
            <Text className="text-white font-bold">Ajouter un aliment</Text>
            <Pressable onPress={onClose}><X size={18} className="text-gray-400" /></Pressable>
          </View>
          <View className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
            <Search size={14} className="text-gray-500" />
            <TextInput className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              placeholder="Rechercher un aliment..." value={search} onChangeText={text => setSearch(text)} />
          </View>
          <View className="flex gap-1.5 overflow-x-auto scrollbar-hide">
            {FOOD_CATS.map(c => (
              <Pressable key={c} className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={cat === c ? { backgroundColor: "#E17055" } : { backgroundColor: "rgba(255,255,255,0.07)" }}
                onPress={() => setCat(c)}>{c}</Pressable>
            ))}
          </View>
        </View>

        <View className="overflow-y-auto flex-1 p-3">
          {selected ? (
            <View>
              <View className="flex items-center gap-2 mb-4 p-3 rounded-xl" style={{ backgroundColor: "rgba(225,112,85,0.1)", borderWidth: 1, borderColor: "rgba(225,112,85,0.2)", borderStyle: "solid" }}>
                <Text className="text-2xl">{selected.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-sm">{selected.name}</Text>
                  <Text className="text-gray-400 text-xs">{selected.cal100g} kcal/100g</Text>
                </View>
                <Pressable onPress={() => setSelected(null)}><X size={14} className="text-gray-400" /></Pressable>
              </View>
              <View className="mb-4">
                <Text className="text-gray-400 text-xs mb-2">Quantité (grammes)</Text>
                <View className="flex items-center gap-3">
                  <Pressable className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    onPress={() => setGrams(g => Math.max(10, g - 25))}><Text>−</Text></Pressable>
                  <TextInput className="flex-1 text-center bg-transparent text-white text-2xl font-bold outline-none"
                    value={grams} onChangeText={text => setGrams(Math.max(1, parseInt(text) || 1))}  keyboardType="numeric"/>
                  <Pressable className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                    onPress={() => setGrams(g => g + 25)}><Text>+</Text></Pressable>
                </View>
                <View className="flex gap-2 mt-2 justify-center">
                  {[50, 100, 150, 200].map(g => (
                    <Pressable key={g} className="px-2.5 py-1 rounded-full text-xs"
                      style={grams === g ? { backgroundColor: "#E17055" } : { backgroundColor: "rgba(255,255,255,0.07)" }}
                      onPress={() => setGrams(g)}>{g}<Text>g</Text></Pressable>
                  ))}
                </View>
              </View>
              {preview && (
                <View className="gap-2 mb-5">
                  {[
                    { label: "Calories", value: `${preview.cal}`, unit: "kcal", color: "#E17055" },
                    { label: "Protéines", value: `${preview.protein}`, unit: "g", color: "#6C5CE7" },
                    { label: "Glucides", value: `${preview.carbs}`, unit: "g", color: "#FDCB6E" },
                    { label: "Lipides", value: `${preview.fat}`, unit: "g", color: "#00B894" },
                  ].map(s => (
                    <View key={s.label} className="rounded-xl p-2 text-center" style={{ backgroundColor: `${s.color}15` }}>
                      <Text className="font-bold text-sm" style={{ color: s.color }}>{s.value}</Text>
                      <Text className="text-gray-500 text-[9px]">{s.unit}</Text>
                      <Text className="text-gray-500 text-[9px]">{s.label}</Text>
                    </View>
                  ))}
                </View>
              )}
              <Pressable className="w-full py-3 rounded-xl font-bold text-white"
                style={{  }}
                onPress={handleAdd}>
                <Text>Ajouter au</Text>{MEAL_LABELS[meal]}
              </Pressable>
            </View>
          ) : (
            <View className="space-y-1.5">
              {filtered.map(f => (
                <Pressable key={f.id} className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}
                  onPress={() => setSelected(f)}>
                  <Text className="text-xl w-8 text-center">{f.emoji}</Text>
                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-medium truncate">{f.name}</Text>
                    <Text className="text-gray-500 text-xs">{f.category}</Text>
                  </View>
                  <View className="text-right">
                    <Text className="text-xs font-semibold" style={{ color: "#E17055" }}>{f.cal100g}</Text>
                    <Text className="text-gray-600 text-[10px]">kcal/100g</Text>
                  </View>
                  <ChevronRight size={14} className="text-gray-600" />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Pressable>
  );
}

// ── Recipe Card ────────────────────────────────────────────────────────────
function RecipeCard({ r }: { r: Recipe }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable className="rounded-2xl overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }} onPress={() => setOpen(true)}>
        <View className="h-24 flex items-center justify-center text-5xl"
          style={{  }}>
          {r.emoji}
        </View>
        <View className="p-3">
          <Text className="text-white font-bold text-sm">{r.name}</Text>
          <View className="flex gap-2 mt-1.5 flex-wrap">
            {r.tags.map(t => <Text key={t} className="px-1.5 py-0.5 rounded text-[10px]" style={{ backgroundColor: "rgba(225,112,85,0.15)", color: "#E17055" }}>#{t}</Text>)}
          </View>
          <View className="flex justify-between mt-2 text-xs">
            <Text style={{ color: "#E17055" }}>{r.cal} kcal</Text>
            <Text className="text-gray-500">{r.prepMin} min · {r.servings} pers.</Text>
          </View>
          <View className="flex gap-2 mt-2">
            {[{ l: "P", v: r.protein, c: "#6C5CE7" }, { l: "G", v: r.carbs, c: "#FDCB6E" }, { l: "L", v: r.fat, c: "#00B894" }].map(m => (
              <Text key={m.l} className="text-[10px] font-semibold" style={{ color: m.c }}>{m.l}: {m.v}g</Text>
            ))}
          </View>
        </View>
      </Pressable>

      <>
        {open && (
          <Pressable className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setOpen(false)}>
            <Pressable className="w-full max-w-md mx-auto rounded-t-3xl overflow-y-auto"
              style={{ backgroundColor: "#12122a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "85vh" }}
              onPress={e => e.stopPropagation()}>
              <View className="p-5">
                <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
                <View className="text-5xl text-center mb-3">{r.emoji}</View>
                <Text className="text-white text-xl font-bold text-center mb-1">{r.name}</Text>
                <Text className="text-gray-500 text-sm text-center mb-4">{r.prepMin} min · {r.servings} personne{r.servings > 1 ? "s" : ""}</Text>
                <View className="gap-2 mb-5">
                  {[
                    { label: "Calories", value: r.cal, unit: "kcal", color: "#E17055" },
                    { label: "Protéines", value: r.protein, unit: "g", color: "#6C5CE7" },
                    { label: "Glucides", value: r.carbs, unit: "g", color: "#FDCB6E" },
                    { label: "Lipides", value: r.fat, unit: "g", color: "#00B894" },
                  ].map(s => (
                    <View key={s.label} className="rounded-xl p-2 text-center" style={{ backgroundColor: `${s.color}15` }}>
                      <Text className="font-bold text-sm" style={{ color: s.color }}>{s.value}</Text>
                      <Text className="text-gray-500 text-[9px]">{s.unit}</Text>
                      <Text className="text-gray-500 text-[9px]">{s.label}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                  <Apple size={14} style={{ color: "#E17055" }} />Ingrédients
                </Text>
                <View className="space-y-1.5 mb-4">
                  {r.ingredients.map((ing, i) => (
                    <View key={i} className="flex items-center gap-2">
                      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#E17055" }} />
                      <Text className="text-gray-300 text-sm">{ing}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-white font-bold text-sm mb-2 flex items-center gap-2">
                  <BookOpen size={14} style={{ color: "#FDCB6E" }} />Préparation
                </Text>
                <View className="space-y-2 mb-5">
                  {r.steps.map((step, i) => (
                    <View key={i} className="flex gap-3">
                      <Text className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: "rgba(225,112,85,0.2)", color: "#E17055" }}>{i + 1}</Text>
                      <Text className="text-gray-300 text-sm leading-relaxed">{step}</Text>
                    </View>
                  ))}
                </View>
                <Pressable className="w-full py-3 rounded-xl font-bold text-white"
                  style={{  }}
                  onPress={() => { UIService.openToast("Recette sauvegardée !", "success"); setOpen(false); }}>
                  <Text>Sauvegarder la recette</Text></Pressable>
              </View>
            </Pressable>
          </Pressable>
        )}
      </>
    </>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function NutritionPage({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("journal");
  const [journal, setJournal] = useState<JournalEntry[]>(() => loadJournal());
  const [goals, setGoals] = useState<Goals>(() => loadGoals());
  const [water, setWater] = useState(() => loadWater());
  const [addMeal, setAddMeal] = useState<Meal | null>(null);
  const [editGoals, setEditGoals] = useState(false);
  const [draftGoals, setDraftGoals] = useState<Goals>(() => loadGoals());
  const [recipeSearch, setRecipeSearch] = useState("");
  const [expandedMeal, setExpandedMeal] = useState<Meal | null>("petit-déjeuner");
  const [selectedDate] = useState(todayStr());

  // Convex sync
  const upsertNutrition = useMutation(api.health.upsertNutritionLog);

  const todayEntries = useMemo(() => journal.filter(e => e.date === selectedDate), [journal, selectedDate]);

  const totals = useMemo(() => todayEntries.reduce(
    (acc, e) => ({ cal: acc.cal + e.cal, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }),
    { cal: 0, protein: 0, carbs: 0, fat: 0 }
  ), [todayEntries]);

  const mealTotals = useMemo(() => {
    const m: Record<Meal, { cal: number; protein: number; carbs: number; fat: number }> = {
      "petit-déjeuner": { cal: 0, protein: 0, carbs: 0, fat: 0 },
      déjeuner: { cal: 0, protein: 0, carbs: 0, fat: 0 },
      dîner: { cal: 0, protein: 0, carbs: 0, fat: 0 },
      collation: { cal: 0, protein: 0, carbs: 0, fat: 0 },
    };
    todayEntries.forEach(e => {
      m[e.meal].cal     += e.cal;
      m[e.meal].protein += e.protein;
      m[e.meal].carbs   += e.carbs;
      m[e.meal].fat     += e.fat;
    });
    return m;
  }, [todayEntries]);

  const addEntry = (entry: Omit<JournalEntry, "id" | "date">) => {
    const newEntry: JournalEntry = { ...entry, id: Date.now().toString(), date: selectedDate };
    const updated = [newEntry, ...journal];
    setJournal(updated);
    saveJournal(updated);
    UIService.openToast(`${entry.foodName} ajouté (${entry.cal} kcal)`, "success");
    // Sync to Convex
    const dayEntries = updated.filter(e => e.date === selectedDate);
    const totalCal = dayEntries.reduce((s, e) => s + e.cal, 0);
    upsertNutrition({
      date: selectedDate,
      meals: MEALS.map(meal => ({
        name: meal,
        time: meal === "petit-déjeuner" ? "08:00" : meal === "déjeuner" ? "12:00" : meal === "dîner" ? "19:00" : "16:00",
        calories: dayEntries.filter(e => e.meal === meal).reduce((s, e) => s + e.cal, 0),
        items: dayEntries.filter(e => e.meal === meal).map(e => e.foodName),
      })),
      totalCalories: totalCal,
      waterMl: water * 250,
    }).catch(() => {/* non-blocking */});
  };

  const removeEntry = (id: string) => {
    const updated = journal.filter(e => e.id !== id);
    setJournal(updated);
    saveJournal(updated);
    UIService.openToast("Aliment supprimé", "info");
  };

  const handleWater = (delta: number) => {
    const next = Math.max(0, Math.min(12, water + delta));
    setWater(next);
    saveWater(next);
  };

  const saveGoalsDraft = () => {
    setGoals(draftGoals);
    saveGoals(draftGoals);
    setEditGoals(false);
    UIService.openToast("Objectifs enregistrés !", "success");
  };

  const filteredRecipes = RECIPES.filter(r =>
    !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase()) || r.tags.some(t => t.includes(recipeSearch.toLowerCase()))
  );

  const calPct = Math.min(100, goals.calories > 0 ? (totals.cal / goals.calories) * 100 : 0);
  const remaining = Math.max(0, goals.calories - totals.cal);

  // Weekly history (last 7 days of sessions)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split("T")[0];
    const dayCal = journal.filter(e => e.date === key).reduce((s, e) => s + e.cal, 0);
    return { label: d.toLocaleDateString("fr-FR", { weekday: "short" }).slice(0, 3), cal: dayCal, key };
  });
  const maxWeekCal = Math.max(...weekDays.map(d => d.cal), goals.calories);

  return (
    <View className="min-h-screen text-white" style={{  }}>
      {/* Add food sheet */}
      <>
        {addMeal && <AddFoodSheet meal={addMeal} onAdd={addEntry} onClose={() => setAddMeal(null)} />}
      </>

      {/* Goals edit sheet */}
      <>
        {editGoals && (
          <Pressable className="fixed inset-0 z-50 flex items-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={() => setEditGoals(false)}>
            <Pressable className="w-full max-w-md mx-auto rounded-t-3xl p-5 pb-10"
              style={{ backgroundColor: "#12122a", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid" }}
              onPress={e => e.stopPropagation()}>
              <View className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />
              <Text className="text-white font-bold text-lg mb-4">Mes objectifs nutritionnels</Text>
              {(["calories", "protein", "carbs", "fat", "water"] as (keyof Goals)[]).map(k => (
                <View key={k} className="mb-4">
                  <Text className="text-gray-400 text-xs block mb-1 capitalize">
                    {k === "calories" ? "Calories (kcal/jour)" : k === "protein" ? "Protéines (g/jour)" : k === "carbs" ? "Glucides (g/jour)" : k === "fat" ? "Lipides (g/jour)" : "Eau (verres/jour)"}
                  </Text>
                  <View className="flex items-center gap-3">
                    <Pressable className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      onPress={() => setDraftGoals(g => ({ ...g, [k]: Math.max(0, g[k] - (k === "calories" ? 100 : k === "water" ? 1 : 5)) }))}><Text>−</Text></Pressable>
                    <TextInput className="flex-1 text-center bg-transparent text-white text-xl font-bold outline-none py-2 rounded-xl"
                      style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                      value={draftGoals[k]} onChangeText={text => setDraftGoals(g => ({ ...g, [k]: parseInt(text) || 0 }))}  keyboardType="numeric"/>
                    <Pressable className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
                      onPress={() => setDraftGoals(g => ({ ...g, [k]: g[k] + (k === "calories" ? 100 : k === "water" ? 1 : 5) }))}><Text>+</Text></Pressable>
                  </View>
                </View>
              ))}
              <Pressable className="w-full py-3 rounded-xl font-bold text-white mt-2"
                style={{  }}
                onPress={saveGoalsDraft}><Text>Enregistrer</Text></Pressable>
            </Pressable>
          </Pressable>
        )}
      </>

      {/* Header */}
      <View className="sticky top-0 z-30 px-4 pt-12 pb-3" style={{ backgroundColor: "rgba(10,10,26,0.95)" }}>
        <View className="flex items-center gap-3 mb-4">
          <Pressable className="p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} onPress={onBack}>
            <ArrowLeft size={20} />
          </Pressable>
          <View>
            <Text className="text-xl font-bold">Nutrition & Repas</Text>
            <Text className="text-xs text-gray-400">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</Text>
          </View>
          <Pressable className="ml-auto p-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} onPress={() => { setDraftGoals(goals); setEditGoals(true); }}>
            <Target size={18} />
          </Pressable>
        </View>
        <View className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
          {(["journal", "aliments", "recettes", "objectifs"] as Tab[]).map(t => (
            <Pressable key={t} className="flex-1 py-2 rounded-lg text-xs font-semibold"
              style={tab === t ? {  } : {  }} onPress={() => setTab(t)}>
              {t === "journal" ? "Journal" : t === "aliments" ? "Aliments" : t === "recettes" ? "Recettes" : "Objectifs"}
            </Pressable>
          ))}
        </View>
      </View>

      <View className="px-4 pb-24">
        {/* ── JOURNAL ───────────────────────────────────────────────────── */}
        {tab === "journal" && (
          <View>
            {/* Calorie ring */}
            <View className="my-4 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex items-center gap-4">
                {/* Ring */}
                <View className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke={totals.cal > goals.calories ? "#EF4444" : "#E17055"}
                      strokeWidth="3" strokeDasharray={`${calPct} ${100 - calPct}`} strokeLinecap="round" />
                  </svg>
                  <View className="absolute inset-0 flex flex-col items-center justify-center">
                    <Text className="text-white font-black text-base leading-none">{totals.cal}</Text>
                    <Text className="text-gray-500 text-[9px]">kcal</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold">{remaining} kcal restantes</Text>
                  <Text className="text-gray-400 text-xs mb-2">Objectif : {goals.calories} kcal</Text>
                  <View className="space-y-1.5">
                    <MacroBar label="Protéines" value={totals.protein} goal={goals.protein} color="#6C5CE7" />
                    <MacroBar label="Glucides"  value={totals.carbs}   goal={goals.carbs}   color="#FDCB6E" />
                    <MacroBar label="Lipides"   value={totals.fat}     goal={goals.fat}     color="#00B894" />
                  </View>
                </View>
              </View>
            </View>

            {/* Water tracker */}
            <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(0,180,216,0.08)", borderWidth: 1, borderColor: "rgba(0,180,216,0.2)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-2">
                <View className="flex items-center gap-2">
                  <Droplets size={16} style={{ color: "#00B4D8" }} />
                  <Text className="text-white text-sm font-semibold">Hydratation</Text>
                </View>
                <Text className="text-xs" style={{ color: "#00B4D8" }}>{water}/{goals.water} verres</Text>
              </View>
              <View className="flex gap-1.5 flex-wrap">
                {Array.from({ length: goals.water }).map((_, i) => (
                  <Pressable key={i}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
                    style={i < water ? { backgroundColor: "rgba(0,180,216,0.3)" } : { backgroundColor: "rgba(255,255,255,0.06)" }}
                    onPress={() => handleWater(i < water ? -1 : 1)}>
                    {i < water ? "💧" : "○"}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Meals */}
            {MEALS.map(meal => {
              const entries = todayEntries.filter(e => e.meal === meal);
              const mt = mealTotals[meal];
              const isOpen = expandedMeal === meal;
              return (
                <View key={meal} className="rounded-2xl overflow-hidden mb-3"
                  style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
                  <Pressable className="w-full flex items-center gap-3 p-3" onPress={() => setExpandedMeal(isOpen ? null : meal)}>
                    <Text className="text-xl">{MEAL_EMOJIS[meal]}</Text>
                    <View className="flex-1 text-left">
                      <Text className="text-white text-sm font-semibold">{MEAL_LABELS[meal]}</Text>
                      {mt.cal > 0 && <Text className="text-gray-500 text-xs">{Math.round(mt.cal)} kcal · P:{Math.round(mt.protein)}g G:{Math.round(mt.carbs)}g L:{Math.round(mt.fat)}g</Text>}
                    </View>
                    <Text className="text-xs font-semibold" style={{ color: "#E17055" }}>{Math.round(mt.cal)} kcal</Text>
                    {isOpen ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
                  </Pressable>
                  <>
                    {isOpen && (
                      <View
                        className="border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                        <View className="p-3 pt-2 space-y-1.5">
                          {entries.length === 0 ? (
                            <Text className="text-gray-600 text-xs text-center py-2">Aucun aliment ajouté</Text>
                          ) : entries.map(e => (
                            <View key={e.id} className="flex items-center gap-2">
                              <Text className="text-sm">{FOOD_MAP[e.foodId]?.emoji ?? "🍽️"}</Text>
                              <View className="flex-1 min-w-0">
                                <Text className="text-white text-xs font-medium truncate">{e.foodName}</Text>
                                <Text className="text-gray-600 text-[10px]">{e.grams}g</Text>
                              </View>
                              <Text className="text-xs" style={{ color: "#E17055" }}>{e.cal} kcal</Text>
                              <Pressable onPress={() => removeEntry(e.id)}>
                                <Trash2 size={12} className="text-gray-600" />
                              </Pressable>
                            </View>
                          ))}
                          <Pressable className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold mt-1"
                            style={{ backgroundColor: "rgba(225,112,85,0.1)", borderWidth: 1, borderColor: "rgba(225,112,85,0.3)", borderStyle: "dashed" }} onPress={() => setAddMeal(meal)}>
                            <Plus size={13} /><Text>Ajouter un aliment</Text></Pressable>
                        </View>
                      </View>
                    )}
                  </>
                </View>
              );
            })}
          </View>
        )}

        {/* ── ALIMENTS ──────────────────────────────────────────────────── */}
        {tab === "aliments" && (
          <View>
            <Text className="text-gray-400 text-xs my-4">{FOODS.length} aliments · Afrique francophone & international</Text>
            {FOOD_CATS.filter(c => c !== "Tous").map(cat => {
              const foods = FOODS.filter(f => f.category === cat);
              return (
                <View key={cat} className="mb-5">
                  <Text className="text-white font-bold text-sm mb-2">{cat}</Text>
                  <View className="space-y-1.5">
                    {foods.map(f => (
                      <View key={f.id} className="flex items-center gap-3 rounded-xl p-3"
                        style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderStyle: "solid" }}>
                        <Text className="text-xl">{f.emoji}</Text>
                        <View className="flex-1 min-w-0">
                          <Text className="text-white text-sm font-medium truncate">{f.name}</Text>
                          <View className="flex gap-2 mt-0.5">
                            <Text className="text-[10px]" style={{ color: "#6C5CE7" }}>P:{f.protein}g</Text>
                            <Text className="text-[10px]" style={{ color: "#FDCB6E" }}>G:{f.carbs}g</Text>
                            <Text className="text-[10px]" style={{ color: "#00B894" }}>L:{f.fat}g</Text>
                          </View>
                        </View>
                        <View className="text-right">
                          <Text className="text-sm font-bold" style={{ color: "#E17055" }}>{f.cal100g}</Text>
                          <Text className="text-gray-600 text-[10px]">kcal/100g</Text>
                        </View>
                        <Pressable className="p-1.5 rounded-lg" style={{ backgroundColor: "rgba(225,112,85,0.1)" }}
                          onPress={() => { setAddMeal("déjeuner"); UIService.openToast(`Sélectionne un repas pour ajouter ${f.name}`, "info"); }}>
                          <Plus size={14} style={{ color: "#E17055" }} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── RECETTES ──────────────────────────────────────────────────── */}
        {tab === "recettes" && (
          <View>
            <View className="flex items-center gap-2 my-4 px-3 py-2 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
              <Search size={14} className="text-gray-500" />
              <TextInput className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                placeholder="Rechercher une recette..." value={recipeSearch} onChangeText={text => setRecipeSearch(text)} />
              {recipeSearch && <Pressable onPress={() => setRecipeSearch("")}><X size={13} className="text-gray-500" /></Pressable>}
            </View>
            <View className="gap-3">
              {filteredRecipes.map((r, i) => (
                <View key={r.id}>
                  <RecipeCard r={r} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── OBJECTIFS ─────────────────────────────────────────────────── */}
        {tab === "objectifs" && (
          <View>
            {/* Current goals */}
            <View className="mt-4 rounded-2xl p-4 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex items-center justify-between mb-3">
                <Text className="text-white font-bold">Mes objectifs du jour</Text>
                <Pressable className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                  style={{ backgroundColor: "rgba(225,112,85,0.15)" }}
                  onPress={() => { setDraftGoals(goals); setEditGoals(true); }}>
                  <Text>Modifier</Text></Pressable>
              </View>
              <View className="space-y-3">
                <MacroBar label={`Calories (${totals.cal}/${goals.calories} kcal)`} value={totals.cal} goal={goals.calories} color="#E17055" />
                <MacroBar label={`Protéines (${Math.round(totals.protein)}/${goals.protein}g)`} value={totals.protein} goal={goals.protein} color="#6C5CE7" />
                <MacroBar label={`Glucides (${Math.round(totals.carbs)}/${goals.carbs}g)`} value={totals.carbs} goal={goals.carbs} color="#FDCB6E" />
                <MacroBar label={`Lipides (${Math.round(totals.fat)}/${goals.fat}g)`} value={totals.fat} goal={goals.fat} color="#00B894" />
                <MacroBar label={`Eau (${water}/${goals.water} verres)`} value={water} goal={goals.water} color="#00B4D8" />
              </View>
            </View>

            {/* Weekly chart */}
            <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <TrendingUp size={14} style={{ color: "#E17055" }} />Calories sur 7 jours
            </Text>
            <View className="rounded-2xl p-4 mb-5" style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}>
              <View className="flex items-end gap-2 h-24">
                {weekDays.map(d => {
                  const pct = maxWeekCal > 0 ? (d.cal / maxWeekCal) * 100 : 0;
                  const isToday = d.key === selectedDate;
                  return (
                    <View key={d.key} className="flex-1 flex flex-col items-center gap-1">
                      <Text className="text-[9px] text-gray-600">{d.cal > 0 ? d.cal : ""}</Text>
                      <View className="w-full rounded-t-lg" style={{ height: `${Math.max(4, pct)}%`, backgroundColor: isToday ? "#E17055" : "rgba(225,112,85,0.3)" }} />
                      <Text className="text-[10px]" style={{ color: isToday ? "#E17055" : "#666" }}>{d.label}</Text>
                    </View>
                  );
                })}
              </View>
              {/* Goal line label */}
              <Text className="text-gray-600 text-[10px] mt-2 text-center"><Text>Objectif :</Text>{goals.calories} <Text>kcal/jour</Text></Text>
            </View>

            {/* Tips */}
            <Text className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Info size={14} style={{ color: "#FDCB6E" }} />Conseils nutritionnels
            </Text>
            <View className="space-y-2">
              {[
                { tip: "Mange des légumes verts à chaque repas pour les micronutriments.", color: "#00B894" },
                { tip: "Privilégie les protéines maigres (poisson, poulet) pour la satiété.", color: "#6C5CE7" },
                { tip: "Bois un verre d'eau avant chaque repas pour réduire les portions.", color: "#00B4D8" },
                { tip: "Limite les huiles en excès — 1 c.s. suffit pour la cuisson.", color: "#FDCB6E" },
              ].map((t, i) => (
                <View key={i} className="flex gap-3 rounded-xl p-3"
                  style={{ backgroundColor: `${t.color}0d`, borderStyle: "solid" }}>
                  <Check size={14} className="flex-shrink-0 mt-0.5" style={{ color: t.color }} />
                  <Text className="text-gray-300 text-sm">{t.tip}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

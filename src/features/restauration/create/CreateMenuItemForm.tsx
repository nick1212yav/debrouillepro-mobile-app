import { Picker } from "@react-native-picker/picker";
import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import {
  ChefHat,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  Flame,
} from "lucide-react-native";
import { DIETARY_OPTIONS } from "../constants/dietaryOptions";

interface CreateMenuItemFormProps {
  categories: string[];
  onSubmit: (categoryName: string, itemData: any) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CreateMenuItemForm({
  categories,
  onSubmit,
  isSubmitting,
}: CreateMenuItemFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // États du formulaire
  const [selectedCategory, setSelectedCategory] = useState(categories[0] || "");
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(3500);
  const [costToProduce, setCostToProduce] = useState<number>(1200);
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [calories, setCalories] = useState<number>(350);
  const [prepTime, setPrepTime] = useState<number>(15);
  const [isVeggie, setIsVeggie] = useState(false);

  // Listes de contrôle (Allergènes et régimes)
  const availableAllergens = [
    "Gluten",
    "Lactose",
    "Poisson",
    "Moutarde",
    "Arachide",
    "Œufs",
  ];
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);

  // Macro-nutriments
  const [proteins, setProteins] = useState<number>(12);
  const [carbs, setCarbs] = useState<number>(35);
  const [lipids, setLipids] = useState<number>(8);
  const [sodium, setSodium] = useState<number>(450);
  const [fiber, setFiber] = useState<number>(3);

  const handleToggleAllergen = (item: string) => {
    setAllergens((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const handleToggleDiet = (item: string) => {
    setDietaryRestrictions((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item],
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedCategory)
      newErrors.category = "Veuillez sélectionner une catégorie parente.";
    if (!name.trim()) newErrors.name = "Le nom du plat est obligatoire.";
    if (price <= 0)
      newErrors.price = "Le prix de vente doit être supérieur à 0.";
    if (!description.trim())
      newErrors.description = "Le descriptif d'ingrédients est obligatoire.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: unknown) => {
    if (!validateForm()) return;

    const payload = {
      name: name.trim(),
      price,
      costToProduce,
      description: description.trim(),
      tag,
      calories,
      prepTime: `${prepTime} min`,
      allergens,
      dietaryRestrictions,
      isVeggie,
      category: selectedCategory,
      nutrition: {
        calories,
        proteins,
        carbohydrates: carbs,
        lipids,
        sodium,
        fiber,
      },
    };

    const success = await onSubmit(selectedCategory, payload);
    if (success) {
      setName("");
      setDescription("");
      setTag("");
    }
  };

  return (
    <View
     
      className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900/50 border border-slate-800 text-left space-y-6"
    >
      <View className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <ChefHat className="text-orange-500 w-6 h-6" />
        <View>
          <Text className="text-lg font-black text-white">
            Ajouter un Plat au Menu
          </Text>
          <Text className="text-xs text-slate-400">
            Complétez votre carte avec des fiches culinaires précises
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold">
            Catégorie parente
          </Text>
          <Picker
           
            onValueChange={(val) => setSelectedCategory(val)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
           selectedValue={selectedCategory}>
            {categories.map((cat) => (
              <Picker.Item label={`${cat}`} value={cat} />
            ))}
          </Picker>
        </View>

        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold">
            Nom du plat / de la boisson
          </Text>
          <TextInput
           
            placeholder="Ex: Attiéké Poisson Braisé Royal"
            value={name}
            onChangeText={(text) => setName(text)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
           />
          {errors.name && (
            <Text className="text-[10px] text-rose-500 flex items-center gap-1">
              <AlertCircle size={10} />
              {errors.name}
            </Text>
          )}
        </View>
      </View>

      <View className="gap-4">
        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <DollarSign size={11} /> Prix de vente (FCFA)
          </Text>
          <TextInput
           
            value={price}
            onChangeText={(text) => setPrice(Number(text))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
            min={1}
            keyboardType="numeric"/>
        </View>

        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
            <DollarSign size={11} /> Coût d'achat matière (FCFA)
          </Text>
          <TextInput
           
            value={costToProduce}
            onChangeText={(text) => setCostToProduce(Number(text))}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
            min={0}
           keyboardType="numeric"/>
        </View>

        <View className="space-y-1.5">
          <Text className="block text-[10px] text-slate-400 uppercase font-bold">
            Label promotionnel (Tag)
          </Text>
          <TextInput
           
            placeholder="Ex: Bestseller, Nouveau, Chef's Touch"
            value={tag}
            onChangeText={(text) => setTag(text)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          />
        </View>
      </View>

      <View className="space-y-1.5">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold">
          Description des ingrédients
        </Text>
        <TextInput
         
          placeholder="Détaillez la composition de votre plat, les accompagnements et les piments inclus..."
          value={description}
          onChangeText={(text) => setDescription(text)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white outline-none"
          multiline textAlignVertical="top"/>
      </View>

      {/* Spécifications diététiques complexes */}
      <View className="gap-4 py-2 border-t border-b border-slate-800">
        <View>
          <Text className="block text-[10px] text-slate-400 uppercase font-bold mb-2">
            Détection d'allergènes
          </Text>
          <View className="flex flex-wrap gap-1.5">
            {availableAllergens.map((all) => {
              const selected = allergens.includes(all);
              return (
                <Pressable
                  key={all}
                 
                  onPress={() => handleToggleAllergen(all)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    selected
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  {all}
                </Pressable>
              );
            })}
          </View>
        </View>

        <View>
          <Text className="block text-[10px] text-slate-400 uppercase font-bold mb-2">
            Compatibilité de régime
          </Text>
          <View className="flex flex-wrap gap-1.5">
            {DIETARY_OPTIONS.map((diet) => {
              const selected = dietaryRestrictions.includes(diet.id);
              return (
                <Pressable
                  key={diet.id}
                 
                  onPress={() => handleToggleDiet(diet.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                    selected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-950 border-slate-800 text-slate-500"
                  }`}
                >
                  {diet.label}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Analyse nutritionnelle */}
      <View className="space-y-4">
        <Text className="block text-[10px] text-slate-400 uppercase font-bold">
          Fiche d'apport nutritionnel (Valeurs unitaires)
        </Text>

        <View className="gap-3">
          <View className="space-y-1.5">
            <Text className="block text-[9px] text-slate-400 font-bold uppercase flex items-center gap-0.5">
              <Flame size={10} /> Calories (kcal)
            </Text>
            <TextInput
             
              value={calories}
              onChangeText={(text) => setCalories(Number(text))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
             keyboardType="numeric"/>
          </View>

          <View className="space-y-1.5">
            <Text className="block text-[9px] text-slate-400 font-bold uppercase">
              Protéines (g)
            </Text>
            <TextInput
             
              value={proteins}
              onChangeText={(text) => setProteins(Number(text))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
             keyboardType="numeric"/>
          </View>

          <View className="space-y-1.5">
            <Text className="block text-[9px] text-slate-400 font-bold uppercase">
              Glucides (g)
            </Text>
            <TextInput
             
              value={carbs}
              onChangeText={(text) => setCarbs(Number(text))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
             keyboardType="numeric"/>
          </View>

          <View className="space-y-1.5">
            <Text className="block text-[9px] text-slate-400 font-bold uppercase">
              Lipides (g)
            </Text>
            <TextInput
             
              value={lipids}
              onChangeText={(text) => setLipids(Number(text))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
             keyboardType="numeric"/>
          </View>

          <View className="space-y-1.5">
            <Text className="block text-[9px] text-slate-400 font-bold uppercase">
              Fibres (g)
            </Text>
            <TextInput
             
              value={fiber}
              onChangeText={(text) => setFiber(Number(text))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
             keyboardType="numeric"/>
          </View>
        </View>
      </View>

      <View className="pt-4 border-t border-slate-800">
        <Pressable
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl bg-orange-500 disabled:bg-slate-800 disabled:text-white/20 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-orange-500/10"
        >
          <ShieldCheck size={14} />
          {isSubmitting ? "Ajout du plat..." : "Publier l'Article au Menu"}
        </Pressable>
      </View>
    </View>
  );
}

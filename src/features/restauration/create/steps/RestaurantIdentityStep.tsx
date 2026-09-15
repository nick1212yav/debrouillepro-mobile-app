import { View, Text, Pressable } from "react-native";

// src/features/restauration/create/steps/RestaurantIdentityStep.tsx
import { useState } from "react";
import { ChefHat, UtensilsCrossed } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const CUISINES = [
  "Africaine",
  "Congolaise",
  "Italienne",
  "Fusion",
  "Grillades",
  "Fast-food",
  "Gastronomie",
  "Végétarienne",
];

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
}

export function RestaurantIdentityStep({ data, onChange, onNext }: Props) {
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>(
    data.cuisine ? data.cuisine.split(",").map((c: string) => c.trim()) : [],
  );

  const toggleCuisine = (cuisine: string) => {
    const updated = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((c) => c !== cuisine)
      : [...selectedCuisines, cuisine];
    setSelectedCuisines(updated);
    onChange("cuisine", updated.join(", "));
  };

  const isValid = data.name.length >= 2 && selectedCuisines.length > 0;

  return (
    <View className="space-y-6"><View><View className="flex items-center gap-3 mb-2"><ChefHat size={24} className="text-orange-400" /><Text className="text-white font-bold text-lg">Présentons votre établissement
          </Text></View><Text className="text-white/40 text-sm">Donnez une première impression forte à vos futurs clients.
        </Text></View><View className="space-y-4"><View><Text className="text-white/80 text-sm font-medium block mb-1.5">Nom du restaurant *
          </Text><Input value={data.name} onChange={(e) => onChange("name", e.target.value)} placeholder="Ex: Chez Mama Africa" className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12 text-base" /></View><View><Text className="text-white/80 text-sm font-medium block mb-1.5">Type de cuisine *
          </Text><View className="flex flex-wrap gap-2">{CUISINES.map((cuisine) => (
              <Pressable key={cuisine} onPress={() => toggleCuisine(cuisine)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCuisines.includes(cuisine)
                    ? "bg-orange-500/30 text-orange-300 border border-orange-400/40"
                    : "bg-white/5 text-white/50 border border-white/5 hover:bg-white/10"
                }`}>{cuisine}</Pressable>
            ))}</View></View><View><Text className="text-white/80 text-sm font-medium block mb-1.5">Description
          </Text><Textarea value={data.description} onChange={(e) => onChange("description", e.target.value)} placeholder="Décrivez votre restaurant, ses spécialités, l'ambiance..." className="bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[100px]" /></View></View><Button onPress={onNext} disabled={!isValid} className="w-full h-12 rounded-xl bg-orange-600 text-white font-bold text-base">Continuer →
      </Button></View>
  );
}

import { View, Text, Pressable } from "react-native";
// src/features/restauration/create/steps/RestaurantExperienceStep.tsx
import { useState } from "react";
import { UtensilsCrossed, Coffee, Pizza, Sandwich } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RestaurantExperienceStep({
  data,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [hasDineIn, setHasDineIn] = useState(data.hasDineIn ?? true);
  const [hasTakeaway, setHasTakeaway] = useState(data.hasTakeaway ?? true);
  const [hasDelivery, setHasDelivery] = useState(data.hasDelivery ?? true);
  const [hasReservation, setHasReservation] = useState(
    data.hasReservation ?? false,
  );
  const [priceRange, setPriceRange] = useState(data.priceRange || "");

  const handleSubmit = () => {
    onChange("hasDineIn", hasDineIn);
    onChange("hasTakeaway", hasTakeaway);
    onChange("hasDelivery", hasDelivery);
    onChange("hasReservation", hasReservation);
    onChange("priceRange", priceRange);
    onNext();
  };

  const isValid = priceRange.length > 0;

  return (
    <View className="space-y-6">
      <View>
        <View className="flex items-center gap-3 mb-2">
          <UtensilsCrossed size={24} className="text-orange-400" />
          <Text className="text-white font-bold text-lg">Votre expérience</Text>
        </View>
        <Text className="text-white/40 text-sm">
          Définissez les services que vous proposez à vos clients.
        </Text>
      </View>

      <View className="space-y-4">
        <View className="gap-3">
          <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/80 text-sm font-medium">Sur place</Text>
            <Switch
              checked={hasDineIn}
              onCheckedChange={setHasDineIn}
              className="data-[state=checked]:bg-orange-500"
            />
          </View>
          <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/80 text-sm font-medium">
              À emporter
            </Text>
            <Switch
              checked={hasTakeaway}
              onCheckedChange={setHasTakeaway}
              className="data-[state=checked]:bg-orange-500"
            />
          </View>
          <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/80 text-sm font-medium">Livraison</Text>
            <Switch
              checked={hasDelivery}
              onCheckedChange={setHasDelivery}
              className="data-[state=checked]:bg-orange-500"
            />
          </View>
          <View className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
            <Text className="text-white/80 text-sm font-medium">
              Réservation
            </Text>
            <Switch
              checked={hasReservation}
              onCheckedChange={setHasReservation}
              className="data-[state=checked]:bg-orange-500"
            />
          </View>
        </View>

        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Gamme de prix *
          </Text>
          <View className="flex gap-2">
            {["$", "$$", "$$$", "$$$$"].map((range) => (
              <Pressable
                key={range}
                onPress={() => setPriceRange(range)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                  priceRange === range
                    ? "bg-orange-500/30 text-orange-300 border border-orange-400/40"
                    : "bg-white/5 text-white/30 border border-white/5 hover:bg-white/10"
                }`}
              >
                {range}
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View className="flex gap-3">
        <Button
          onPress={onBack}
          variant="outline"
          className="flex-1 h-12 rounded-xl border-white/10 text-white"
        >
          <Text>← Retour</Text></Button>
        <Button
          onPress={handleSubmit}
          disabled={!isValid}
          className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

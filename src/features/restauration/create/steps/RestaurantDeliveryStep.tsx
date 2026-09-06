import { View, Text, Pressable } from "react-native";
// src/features/restauration/create/steps/RestaurantDeliveryStep.tsx
import { useState } from "react";
import { Truck, Plus, X } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RestaurantDeliveryStep({
  data,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [deliveryTime, setDeliveryTime] = useState(data.deliveryTime || "");
  const [deliveryAreas, setDeliveryAreas] = useState<string[]>(
    data.deliveryAreas || [],
  );
  const [newArea, setNewArea] = useState("");

  const addArea = () => {
    if (newArea.trim() && !deliveryAreas.includes(newArea.trim())) {
      setDeliveryAreas([...deliveryAreas, newArea.trim()]);
      setNewArea("");
      onChange("deliveryAreas", [...deliveryAreas, newArea.trim()]);
    }
  };

  const removeArea = (area: string) => {
    const updated = deliveryAreas.filter((a) => a !== area);
    setDeliveryAreas(updated);
    onChange("deliveryAreas", updated);
  };

  const handleSubmit = () => {
    onChange("deliveryTime", deliveryTime);
    onChange("deliveryAreas", deliveryAreas);
    onNext();
  };

  const isValid = deliveryTime.length > 0 && deliveryAreas.length > 0;

  return (
    <View className="space-y-6">
      <View>
        <View className="flex items-center gap-3 mb-2">
          <Truck size={24} className="text-blue-400" />
          <Text className="text-white font-bold text-lg">Livraison</Text>
        </View>
        <Text className="text-white/40 text-sm">
          Indiquez les zones et délais de livraison pour vos clients.
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Temps de livraison estimé *
          </Text>
          <Input
            value={deliveryTime}
            onChange={(text) => setDeliveryTime(text)}
            placeholder="Ex: 25-35 min"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
          />
        </View>

        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Zones de livraison *
          </Text>
          <View className="flex gap-2 mb-2">
            <Input
              value={newArea}
              onChange={(text) => setNewArea(text)}
              placeholder="Ex: Centre-ville, Manika..."
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 flex-1"
              onKeyDown={(e) => e.key === "Enter" && addArea()}
            />
            <Button
              onPress={addArea}
              disabled={!newArea.trim()}
              className="h-10 px-4 rounded-xl bg-blue-600 text-white"
            >
              <Plus size={16} />
            </Button>
          </View>
          <View className="flex flex-wrap gap-2">
            {deliveryAreas.map((area) => (
              <Text
                key={area}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 text-white/80 text-sm"
              >
                {area}
                <Pressable
                  onPress={() => removeArea(area)}
                  className="text-white/40"
                >
                  <X size={14} />
                </Pressable>
              </Text>
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
          className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold"
        >
          <Text>Continuer →</Text></Button>
      </View>
    </View>
  );
}

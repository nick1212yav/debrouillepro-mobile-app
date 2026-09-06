import { View, Text, TextInput } from "react-native";
// src/features/restauration/create/steps/RestaurantLocationStep.tsx
import { useState } from "react";
import { MapPin, Search } from "lucide-react-native";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RestaurantLocationStep({
  data,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [location, setLocation] = useState(data.location || "");
  const [city, setCity] = useState(data.city || "");
  const [address, setAddress] = useState(data.address || "");

  const handleSubmit = () => {
    onChange("location", location);
    onChange("city", city);
    onChange("address", address);
    onNext();
  };

  const isValid = location.length >= 2 && city.length >= 2;

  return (
    <View className="space-y-6">
      <View>
        <View className="flex items-center gap-3 mb-2">
          <MapPin size={24} className="text-blue-400" />
          <Text className="text-white font-bold text-lg">
            Où se trouve votre restaurant ?
          </Text>
        </View>
        <Text className="text-white/40 text-sm">
          Indiquez l'adresse exacte pour que vos clients puissent vous trouver
          facilement.
        </Text>
      </View>

      <View className="space-y-4">
        {/* Simulateur de carte (placeholder) */}
        <View className="relative rounded-2xl overflow-hidden h-48 bg-black/30 border border-white/10 flex items-center justify-center">
          <View className="text-center">
            <MapPin size={32} className="mx-auto text-white/20" />
            <Text className="text-white/20 text-sm mt-2">Carte interactive</Text>
            <Text className="text-white/10 text-xs">
              (intégration Google Maps / Mapbox)
            </Text>
          </View>
          <View className="absolute bottom-3 left-3 right-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-black/60">
            <Search size={16} className="text-white/40" />
            <TextInput
             
              placeholder="Rechercher une adresse..."
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
            />
          </View>
        </View>

        <View className="gap-4">
          <View>
            <Text className="text-white/80 text-sm font-medium block mb-1.5">
              Ville *
            </Text>
            <Input
              value={city}
              onChange={(text) => setCity(text)}
              placeholder="Ex: Kolwezi"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
            />
          </View>
          <View>
            <Text className="text-white/80 text-sm font-medium block mb-1.5">
              Quartier / Zone
            </Text>
            <Input
              value={location}
              onChange={(text) => setLocation(text)}
              placeholder="Ex: Manika"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
            />
          </View>
        </View>

        <View>
          <Text className="text-white/80 text-sm font-medium block mb-1.5">
            Adresse complète *
          </Text>
          <Input
            value={address}
            onChange={(text) => setAddress(text)}
            placeholder="Ex: Avenue Lumumba, N°45"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/40 h-12"
          />
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

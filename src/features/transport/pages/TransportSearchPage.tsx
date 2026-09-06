import { useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";
// src/features/transport/pages/TransportSearchPage.tsx
import { useState } from "react";
import {
  Search,
  MapPin,
  Calendar,
  Car,
  ArrowLeft,
  SlidersHorizontal,
  Navigation,
} from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AFRICAN_CITIES } from "../constants/regions";

export default function TransportSearchPage({
  onBack,
}: {
  onBack: () => void;
}) {
  const router = useRouter();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [date, setDate] = useState("");
  const [vehicleType, setVehicleType] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState("");

  const handleSearchSubmit = (e: unknown) => {
    // Construction de l'URL de recherche avec query params [2]
    const params = new URLSearchParams();
    if (origin) params.append("origin", origin);
    if (destination) params.append("destination", destination);
    if (date) params.append("date", date);
    if (vehicleType && vehicleType !== "all")
      params.append("type", vehicleType);
    if (maxPrice) params.append("price", maxPrice);

    router.push(`/transport/list?${params.toString()}`);
  };

  return (
    <View className="h-full flex flex-col bg-gradient-to-b from-[#020412] to-[#040618] text-white">
      {/* Header */}
      <View className="flex-shrink-0 px-4 pt-12 pb-3 flex items-center gap-3 border-b border-white/5 bg-[#070914]/40">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/5"
        >
          <ArrowLeft size={18} className="text-white" />
        </Pressable>
        <View>
          <Text className="text-base font-black">Recherche Avancée [2]</Text>
          <Text className="text-[9px] text-violet-400 font-bold uppercase tracking-wider">
            Trouver un trajet certifié [2]
          </Text>
        </View>
      </View>

      {/* Formulaire de recherche */}
      <View
        className="flex-1 overflow-y-auto px-5 py-6 space-y-5"
        style={{  }}
      >
        <View className="space-y-4">
          {/* Point de départ */}
          <View className="space-y-1.5">
            <Text className="text-xs text-white/40 font-bold flex items-center gap-1">
              <MapPin size={12} className="text-violet-400" /> Ville / Point de
              départ *
            </Text>
            <Select onValueChange={setOrigin} value={origin}>
              <SelectTrigger className="h-12 rounded-2xl bg-white/5 border-white/5 text-sm">
                <SelectValue placeholder="Choisir une ville" />
              </SelectTrigger>
              <SelectContent>
                {AFRICAN_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          {/* Point d'arrivée */}
          <View className="space-y-1.5">
            <Text className="text-xs text-white/40 font-bold flex items-center gap-1">
              <Navigation size={12} className="text-violet-400" />{" "}
              Ville / Destination *
            </Text>
            <Select onValueChange={setDestination} value={destination}>
              <SelectTrigger className="h-12 rounded-2xl bg-white/5 border-white/5 text-sm">
                <SelectValue placeholder="Où allez-vous ?" />
              </SelectTrigger>
              <SelectContent>
                {AFRICAN_CITIES.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </View>

          {/* Date de départ */}
          <View className="space-y-1.5">
            <Text className="text-xs text-white/40 font-bold flex items-center gap-1">
              <Calendar size={12} className="text-violet-400" /> Date de voyage
            </Text>
            <Input
              type="date"
              value={date}
              onChange={(text) => setDate(text)}
              className="h-12 rounded-2xl bg-white/5 border-white/5 text-white"
            />
          </View>

          {/* Type de locomotion */}
          <View className="space-y-1.5">
            <Text className="text-xs text-white/40 font-bold flex items-center gap-1">
              <Car size={12} className="text-violet-400" /> Moyen de transport
              préféré
            </Text>
            <Select onValueChange={setVehicleType} value={vehicleType}>
              <SelectTrigger className="h-12 rounded-2xl bg-white/5 border-white/5 text-sm">
                <SelectValue placeholder="Tous types de véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"><Text>Tous les véhicules [2]</Text></SelectItem>
                <SelectItem value="voiture"><Text>Covoiturage [2]</Text></SelectItem>
                <SelectItem value="taxi"><Text>Taxi</Text></SelectItem>
                <SelectItem value="moto"><Text>Moto-Taxi</Text></SelectItem>
                <SelectItem value="bus"><Text>Bus / Minibus</Text></SelectItem>
                <SelectItem value="camion"><Text>Camion / Fret</Text></SelectItem>
              </SelectContent>
            </Select>
          </View>

          {/* Budget maximum */}
          <View className="space-y-1.5">
            <Text className="text-xs text-white/40 font-bold flex items-center gap-1">
              <SlidersHorizontal size={12} className="text-violet-400" /> Budget
              maximal (FCFA)
            </Text>
            <Input
              type="number"
              value={maxPrice}
              onChange={(text) => setMaxPrice(text)}
              placeholder="Ex: 5000"
              className="h-12 rounded-2xl bg-white/5 border-white/5 text-white"
            />
          </View>

          {/* Bouton de recherche */}
          <Button
            type="submit"
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-sm shadow-[0_4px_25px_rgba(139,92,246,0.3)] pt-1"
          >
            <Search size={16} className="mr-2" />
            <Text>Rechercher un trajet [2]</Text></Button>
        </View>
      </View>
    </View>
  );
}

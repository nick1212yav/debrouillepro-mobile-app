import { Pressable, View, Text, TextInput } from "react-native";
// src/features/agri/components/search/AgriLocationFilter.tsx
import { useState } from "react";
import { MapPin, Check } from "lucide-react-native";

interface AgriLocationFilterProps {
  selectedLocation: string | null;
  onSelectLocation: (loc: string | null) => void;
}

// Territoires et localités clés pour l'agriculture dans la région du Lualaba (DRC)
const LUALABA_AGRI_ZONES = [
  "Kolwezi",
  "Mutshatsha",
  "Dilolo",
  "Kasaji",
  "Kapanga",
  "Sandoa",
];

export function AgriLocationFilter({
  selectedLocation,
  onSelectLocation,
}: AgriLocationFilterProps) {
  const [search, setSearch] = useState("");

  const filteredZones = LUALABA_AGRI_ZONES.filter((zone) =>
    zone.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <View className="space-y-3">
      {/* Zone de saisie d'affinage */}
      <View className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/5">
        <MapPin size={14} className="text-white/30 flex-shrink-0" />
        <TextInput
         
          value={search}
          onChangeText={(text) => setSearch(text)}
          placeholder="Saisir un territoire, village..."
          className="flex-1 bg-transparent text-white text-xs placeholder:text-white/20 outline-none"
        />
      </View>

      {/* Liste des territoires */}
      <View className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-none">
        <Pressable
          onPress={() => onSelectLocation(null)}
          className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
            selectedLocation === null
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-white/[0.01] hover:bg-white/[0.03] text-white/70 border border-transparent"
          }`}
        >
          <Text className="font-semibold"><Text>Tous les secteurs</Text></Text>
          {selectedLocation === null && <Check size={14} />}
        </Pressable>

        {filteredZones.map((zone) => {
          const isSelected = selectedLocation === zone;
          return (
            <Pressable
              key={zone}
              onPress={() => onSelectLocation(isSelected ? null : zone)}
              className={`flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors ${
                isSelected
                  ? "bg-green-500/10 text-green-400 border border-green-500/20"
                  : "bg-white/[0.01] hover:bg-white/[0.03] text-white/70 border border-transparent"
              }`}
            >
              <Text className="font-semibold">{zone}</Text>
              {isSelected && <Check size={14} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

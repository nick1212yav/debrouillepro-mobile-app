import { View, Text, Pressable, TextInput } from "react-native";

// src/features/network/sheets/NetworkFiltersSheet.tsx
import { useState } from "react";
import {
  X,
  Filter,
  MapPin,
  Users,
  Building2,
  BriefcaseBusiness,
  Check,
  X as CloseIcon,
} from "lucide-react-native";
import { cn } from "@/lib/utils";

interface NetworkFilters {
  type: string[];
  location: string;
  industry: string[];
  skills: string[];
  availability: string;
}

interface NetworkFiltersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: NetworkFilters) => void;
  initialFilters?: Partial<NetworkFilters>;
}

const USER_TYPES = [
  { value: "particulier", label: "Particuliers" },
  { value: "professionnel", label: "Professionnels" },
  { value: "entreprise", label: "Entreprises" },
  { value: "artisan", label: "Artisans" },
  { value: "recruteur", label: "Recruteurs" },
  { value: "etudiant", label: "Étudiants" },
];

const INDUSTRIES = [
  "Technologie",
  "Santé",
  "Éducation",
  "Finance",
  "Agriculture",
  "Transport",
  "Immobilier",
  "Énergie",
  "Hôtellerie",
  "Restauration",
  "Médias",
  "Construction",
  "Mode",
  "Beauté",
  "Autre",
];

const SKILLS = [
  "Développement Web",
  "Marketing Digital",
  "Gestion de projet",
  "Design UX/UI",
  "Data Science",
  "Intelligence Artificielle",
  "Cloud Computing",
  "Cybersécurité",
  "Plomberie",
  "Électricité",
  "Rédaction",
  "Traduction",
  "Photographie",
  "Vidéographie",
  "Artisanat",
];

const AVAILABILITY_OPTIONS = [
  { value: "all", label: "Tous" },
  { value: "available", label: "Disponible" },
  { value: "limited", label: "Disponibilité limitée" },
  { value: "unavailable", label: "Indisponible" },
];

export function NetworkFiltersSheet({
  isOpen,
  onClose,
  onApply,
  initialFilters = {},
}: NetworkFiltersSheetProps) {
  const [filters, setFilters] = useState<NetworkFilters>({
    type: initialFilters.type || [],
    location: initialFilters.location || "",
    industry: initialFilters.industry || [],
    skills: initialFilters.skills || [],
    availability: initialFilters.availability || "all",
  });

  const [searchLocation, setSearchLocation] = useState("");
  const [searchSkill, setSearchSkill] = useState("");

  const toggleType = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      type: prev.type.includes(value)
        ? prev.type.filter((t) => t !== value)
        : [...prev.type, value],
    }));
  };

  const toggleIndustry = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      industry: prev.industry.includes(value)
        ? prev.industry.filter((t) => t !== value)
        : [...prev.industry, value],
    }));
  };

  const toggleSkill = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(value)
        ? prev.skills.filter((t) => t !== value)
        : [...prev.skills, value],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({
      type: [],
      location: "",
      industry: [],
      skills: [],
      availability: "all",
    });
  };

  const hasActiveFilters =
    filters.type.length > 0 ||
    filters.location.length > 0 ||
    filters.industry.length > 0 ||
    filters.skills.length > 0 ||
    filters.availability !== "all";

  return (
    <>
      {isOpen && (
        <>
          <Pressable
            onPress={onClose}
            className="fixed inset-0 z-50 bg-black/70"
          />
          <View
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-hidden"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", maxHeight: "calc(100vh - 40px)" }}
          >
            <View className="flex justify-center pt-3 pb-1">
              <View className="w-10 h-1 rounded-full bg-white/20" />
            </View>

            <View className="flex items-center justify-between px-5 py-3 border-b border-white/5">
              <View className="flex items-center gap-2">
                <Filter size={18} className="text-indigo-400" />
                <Text className="text-white font-bold text-lg">Filtres</Text>
                {hasActiveFilters && (
                  <Text className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/20 text-indigo-300">
                    {filters.type.length +
                      filters.industry.length +
                      filters.skills.length}
                  </Text>
                )}
              </View>
              <View className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Pressable
                    onPress={handleReset}
                    className="text-xs text-white/40"
                  >
                    <Text>Réinitialiser</Text></Pressable>
                )}
                <Pressable
                  onPress={onClose}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <X size={18} className="text-white/60" />
                </Pressable>
              </View>
            </View>

            <View
              className="px-5 py-4 overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 40px - 180px)" }}
            >
              <View className="space-y-6">
                {/* Type de profil */}
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-white/30" />
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Type de profil
                    </Text>
                  </View>
                  <View className="flex flex-wrap gap-2">
                    {USER_TYPES.map((type) => (
                      <Pressable
                        key={type.value}
                        onPress={() => toggleType(type.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                          filters.type.includes(type.value)
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                            : "text-white/40 bg-white/5 border border-white/10 hover:text-white/60",
                        )}
                      >
                        {type.label}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Localisation */}
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <MapPin size={14} className="text-white/30" />
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Localisation
                    </Text>
                  </View>
                  <View className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                    <MapPin size={16} className="text-white/30 flex-shrink-0" />
                    <TextInput
                     
                      value={filters.location}
                      onChangeText={(text) =>
                        setFilters((prev) => ({
                          ...prev,
                          location: text,
                        }))
                      }
                      placeholder="Ville, pays..."
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                    />
                  </View>
                </View>

                {/* Secteur d'activité */}
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <Building2 size={14} className="text-white/30" />
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Secteur d'activité
                    </Text>
                  </View>
                  <View className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry) => (
                      <Pressable
                        key={industry}
                        onPress={() => toggleIndustry(industry)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                          filters.industry.includes(industry)
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                            : "text-white/40 bg-white/5 border border-white/10 hover:text-white/60",
                        )}
                      >
                        {industry}
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Compétences */}
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <BriefcaseBusiness size={14} className="text-white/30" />
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Compétences
                    </Text>
                  </View>
                  <View className="flex flex-wrap gap-2">
                    {SKILLS.map((skill) => (
                      <Pressable
                        key={skill}
                        onPress={() => toggleSkill(skill)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                          filters.skills.includes(skill)
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/20"
                            : "text-white/40 bg-white/5 border border-white/10 hover:text-white/60",
                        )}
                      >
                        {skill}
                      </Pressable>
                    ))}
                  </View>
                  <TextInput
                   
                    value={searchSkill}
                    onChangeText={(text) => setSearchSkill(text)}
                    placeholder="Rechercher une compétence..."
                    className="mt-2 w-full rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/25 outline-none bg-white/5 border border-white/10"
                  />
                </View>

                {/* Disponibilité */}
                <View>
                  <View className="flex items-center gap-2 mb-3">
                    <Text className="text-white/50 text-xs font-semibold uppercase tracking-wider">
                      Disponibilité
                    </Text>
                  </View>
                  <View className="flex gap-2">
                    {AVAILABILITY_OPTIONS.map((opt) => (
                      <Pressable
                        key={opt.value}
                        onPress={() =>
                          setFilters((prev) => ({
                            ...prev,
                            availability: opt.value,
                          }))
                        }
                        className={cn(
                          "flex-1 px-4 py-2 rounded-xl text-xs font-medium transition-colors",
                          filters.availability === opt.value
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                            : "text-white/40 bg-white/5 border border-white/10 hover:text-white/60",
                        )}
                      >
                        {opt.label}
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View className="px-5 py-4 border-t border-white/5 flex gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/60 bg-white/5"
              >
                Annuler
              </Pressable>
              <Pressable
                onPress={handleApply}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500"
              >
                <Check size={16} />
                Appliquer
              </Pressable>
            </View>
          </View>
        </>
      )}
    </>
  );
}

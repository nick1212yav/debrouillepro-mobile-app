import { View, Pressable, Text } from "react-native";

// src/features/network/components/People/PeopleFilters.tsx
import { useState, useCallback } from "react";
import {
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Users,
  Building2,
  Briefcase,
  MapPin,
  Star,
  Clock,
} from "lucide-react-native";
import { cn } from "@/lib/utils";

export type PeopleFilterOption = {
  id: string;
  label: string;
  icon?: React.ReactNode;
};

export interface PeopleFiltersState {
  roles: string[];
  locations: string[];
  industries: string[];
  verifiedOnly: boolean;
  sortBy: "relevance" | "followers" | "recent" | "rating";
  minRating?: number;
}

interface PeopleFiltersProps {
  filters: PeopleFiltersState;
  onFiltersChange: (filters: PeopleFiltersState) => void;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  rolesOptions: PeopleFilterOption[];
  locationsOptions: PeopleFilterOption[];
  industriesOptions: PeopleFilterOption[];
  isLoading?: boolean;
}

const SORT_OPTIONS = [
  { id: "relevance", label: "Pertinence" },
  { id: "followers", label: "Abonnés" },
  { id: "recent", label: "Récents" },
  { id: "rating", label: "Note" },
];

export function PeopleFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  className,
  isOpen: externalIsOpen = false,
  onToggle,
  rolesOptions,
  locationsOptions,
  industriesOptions,
  isLoading = false,
}: PeopleFiltersProps) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);

  const toggle = useCallback(() => {
    if (onToggle) {
      onToggle();
    } else {
      setIsOpen(!isOpen);
    }
  }, [isOpen, onToggle]);

  const handleRoleToggle = (roleId: string) => {
    const newRoles = filters.roles.includes(roleId)
      ? filters.roles.filter((r) => r !== roleId)
      : [...filters.roles, roleId];
    onFiltersChange({ ...filters, roles: newRoles });
  };

  const handleLocationToggle = (locationId: string) => {
    const newLocations = filters.locations.includes(locationId)
      ? filters.locations.filter((l) => l !== locationId)
      : [...filters.locations, locationId];
    onFiltersChange({ ...filters, locations: newLocations });
  };

  const handleIndustryToggle = (industryId: string) => {
    const newIndustries = filters.industries.includes(industryId)
      ? filters.industries.filter((i) => i !== industryId)
      : [...filters.industries, industryId];
    onFiltersChange({ ...filters, industries: newIndustries });
  };

  const handleSortChange = (sort: PeopleFiltersState["sortBy"]) => {
    onFiltersChange({ ...filters, sortBy: sort });
  };

  const handleVerifiedToggle = () => {
    onFiltersChange({ ...filters, verifiedOnly: !filters.verifiedOnly });
  };

  const handleReset = () => {
    onFiltersChange({
      roles: [],
      locations: [],
      industries: [],
      verifiedOnly: false,
      sortBy: "relevance",
      minRating: undefined,
    });
    onReset?.();
  };

  const handleApply = () => {
    onApply?.();
  };

  const activeFilterCount =
    filters.roles.length +
    filters.locations.length +
    filters.industries.length +
    (filters.verifiedOnly ? 1 : 0) +
    (filters.minRating ? 1 : 0);

  return (
    <View className={cn("relative", className)}>{}<Pressable onPress={toggle} className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-semibold transition-all",
          "bg-white/5 border border-white/10 hover:bg-white/8",
          isOpen && "bg-white/8 border-indigo-500/30",
        )}><Filter size={14} className={isOpen ? "text-indigo-400" : "text-white/40"} /><Text className="text-white/70">Filtres</Text>{activeFilterCount > 0 && (
          <Text className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300">{activeFilterCount}</Text>
        )}{isOpen ? (
          <ChevronUp size={14} className="text-white/40" />
        ) : (
          <ChevronDown size={14} className="text-white/40" />
        )}</Pressable>{}<View>{(isOpen || externalIsOpen) && (
          <View initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} className="absolute top-full left-0 right-0 mt-2 z-50 p-4 rounded-2xl overflow-auto max-h-[80vh]" style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxHeight: "min(80vh, 500px)" }}>
            <View className="space-y-4">{}<View className="flex items-center justify-between"><Text className="text-white font-bold text-sm">Filtres</Text><View className="flex items-center gap-2"><Pressable onPress={handleReset} className="text-xs text-white/40 transition-colors"><Text>Réinitialiser</Text></Pressable><Pressable onPress={handleApply} className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-indigo-500 transition-colors"><Text>Appliquer</Text></Pressable></View></View>{}<View><Text className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Trier par
                </Text><View className="flex flex-wrap gap-1.5">{SORT_OPTIONS.map((opt) => (
                    <Pressable key={opt.id} onPress={() =>
                        handleSortChange(opt.id as PeopleFiltersState["sortBy"])} className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        filters.sortBy === opt.id
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                          : "text-white/40 border border-white/10 hover:bg-white/5",
                      )}>{opt.label}</Pressable>
                  ))}</View></View>{}{rolesOptions.length > 0 && (
                <View><Text className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1"><Users size={12} />Profils
                  </Text><View className="flex flex-wrap gap-1.5">{rolesOptions.map((role) => (
                      <Pressable key={role.id} onPress={() => handleRoleToggle(role.id)} className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          filters.roles.includes(role.id)
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-white/40 border border-white/10 hover:bg-white/5",
                        )}>{role.icon}{role.label}</Pressable>
                    ))}</View></View>
              )}{}{locationsOptions.length > 0 && (
                <View><Text className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1"><MapPin size={12} />Localisations
                  </Text><View className="flex flex-wrap gap-1.5">{locationsOptions.map((loc) => (
                      <Pressable key={loc.id} onPress={() => handleLocationToggle(loc.id)} className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          filters.locations.includes(loc.id)
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-white/40 border border-white/10 hover:bg-white/5",
                        )}>{loc.icon}{loc.label}</Pressable>
                    ))}</View></View>
              )}{}{industriesOptions.length > 0 && (
                <View><Text className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1"><Briefcase size={12} />Secteurs
                  </Text><View className="flex flex-wrap gap-1.5">{industriesOptions.map((ind) => (
                      <Pressable key={ind.id} onPress={() => handleIndustryToggle(ind.id)} className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                          filters.industries.includes(ind.id)
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                            : "text-white/40 border border-white/10 hover:bg-white/5",
                        )}>{ind.icon}{ind.label}</Pressable>
                    ))}</View></View>
              )}{}<View><Text className="text-white/40 text-[10px] font-semibold uppercase tracking-wider mb-2">Options
                </Text><View className="flex flex-wrap gap-2"><Pressable onPress={handleVerifiedToggle} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      filters.verifiedOnly
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "text-white/40 border border-white/10 hover:bg-white/5",
                    )}><Star size={12} />Vérifiés uniquement
                  </Pressable><Pressable onPress={() => {
                      // Note minimale toggle
                      const newRating = filters.minRating ? undefined : 4;
                      onFiltersChange({ ...filters, minRating: newRating });
                    }} className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      filters.minRating
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "text-white/40 border border-white/10 hover:bg-white/5",
                    )}><Clock size={12} />Note ≥ {filters.minRating || "4"}</Pressable></View></View></View>
          </View>
        )}</View></View>
  );
}

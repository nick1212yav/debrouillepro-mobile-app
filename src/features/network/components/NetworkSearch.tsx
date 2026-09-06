import { View, Text, Pressable, Image, TextInput } from "react-native";

// src/features/network/components/NetworkSearch.tsx
import { useState, useCallback, useEffect } from "react";
import { Search, X, Users, Building2, Briefcase, MapPin } from "lucide-react-native";
import { cn } from "@/lib/utils";

interface NetworkSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  suggestions?: Array<{
    id: string;
    name: string;
    type: "person" | "company" | "professional";
    avatar?: string;
    city?: string;
  }>;
  onSuggestionClick?: (id: string) => void;
  isLoading?: boolean;
}

export function NetworkSearch({
  value,
  onChange,
  onSearch,
  placeholder = "Rechercher un profil, une entreprise...",
  autoFocus = false,
  className,
  suggestions = [],
  onSuggestionClick,
  isLoading = false,
}: NetworkSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: string) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const handleSubmit = (e: unknown) => {
    onSearch?.(localValue);
  };

  const handleSuggestionClick = (id: string) => {
    onSuggestionClick?.(id);
    setLocalValue("");
    onChange("");
    setIsFocused(false);
  };

  const showSuggestions =
    isFocused && suggestions.length > 0 && localValue.length > 0;

  const getTypeIcon = (type: "person" | "company" | "professional") => {
    switch (type) {
      case "person":
        return <Users size={14} className="text-white/40" />;
      case "company":
        return <Building2 size={14} className="text-white/40" />;
      case "professional":
        return <Briefcase size={14} className="text-white/40" />;
    }
  };

  const getTypeLabel = (type: "person" | "company" | "professional") => {
    switch (type) {
      case "person":
        return "Personne";
      case "company":
        return "Entreprise";
      case "professional":
        return "Professionnel";
    }
  };

  return (
    <View className={cn("relative", className)}>
      <View>
        <View
          className={cn(
            "flex items-center gap-2 px-3 py-2.5 rounded-2xl transition-all",
            "bg-white/5 border",
            isFocused
              ? "border-indigo-500/50 bg-white/8"
              : "border-white/8 hover:border-white/15",
          )}
        >
          <Search
            size={16}
            className={cn(
              "transition-colors flex-shrink-0",
              isFocused ? "text-indigo-400" : "text-white/30",
            )}
          />
          <TextInput
           
            value={localValue}
            onChangeText={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
          />
          {localValue && (
            <Pressable
             
              onPress={handleClear}
              className="w-6 h-6 rounded-full flex items-center justify-center"
            >
              <X size={14} className="text-white/40" />
            </Pressable>
          )}
          {isLoading && (
            <View className="w-4 h-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
          )}
        </View>
      </View>

      <>
        {showSuggestions && (
          <View
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden z-50"
            style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
          >
            <View
              className="p-2 max-h-72 overflow-y-auto"
              style={{  }}
            >
              {suggestions.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleSuggestionClick(item.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl text-left"
                >
                  <View className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 flex-shrink-0">
                    {item.avatar ? (
                      <Image
                       
                       
                        className="w-full h-full rounded-xl object-cover"
                       source={{ uri: item.avatar }} accessibilityLabel={item.name}/>
                    ) : (
                      getTypeIcon(item.type)
                    )}
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-white text-sm font-medium truncate">
                      {item.name}
                    </Text>
                    <View className="flex items-center gap-2 text-xs text-white/40">
                      <Text className="flex items-center gap-1">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </Text>
                      {item.city && (
                        <>
                          <Text className="w-1 h-1 rounded-full bg-white/20" />
                          <Text className="flex items-center gap-1">
                            <MapPin size={10} />
                            {item.city}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </>
    </View>
  );
}

import { View, Text, Pressable, Image, TextInput } from "react-native";
// src/features/community/components/CreatePost/PostGiphyPicker.tsx
import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react-native";

// Utilisez une variable d'environnement pour la clé API
const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || "VOTRE_CLE_API";

interface Props {
  onSelect: (gifUrl: string) => void;
}

export function PostGiphyPicker({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!GIPHY_API_KEY || GIPHY_API_KEY === "VOTRE_CLE_API") {
      setError(
        "Clé Giphy manquante. Ajoutez VITE_GIPHY_API_KEY dans votre .env",
      );
      return;
    }

    const fetchGifs = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = query
          ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=12`
          : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=12`;
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Clé API Giphy invalide. Vérifiez votre clé.");
          }
          throw new Error(`Erreur Giphy: ${response.status}`);
        }
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setResults(data.data.map((g: any) => g.images.fixed_height.url));
        } else {
          setResults([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement des GIFs",
        );
        setResults([]);
        console.error("Giphy error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGifs();
  }, [query]);

  if (error) {
    return (
      <View className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
        <Text className="text-yellow-400 text-sm">{error}</Text>
        <Pressable
          onPress={() => setError(null)}
          className="mt-2 text-xs text-purple-400 underline"
        >
          <Text>Réessayer</Text></Pressable>
      </View>
    );
  }

  return (
    <View className="p-3 rounded-2xl bg-white/5 border border-white/10">
      <View className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 mb-3">
        <Search size={14} className="text-white/40" />
        <TextInput
          value={query}
          onChangeText={(text) => setQuery(text)}
          placeholder="Rechercher un GIF..."
          className="flex-1 bg-transparent text-white text-sm outline-none"
        />
      </View>
      {loading ? (
        <View className="flex justify-center py-4">
          <Loader2 size={20} className="animate-spin text-white/40" />
        </View>
      ) : results.length === 0 ? (
        <Text className="text-white/40 text-xs text-center py-4">
          <Text>Aucun GIF trouvé</Text></Text>
      ) : (
        <View className="gap-2 max-h-48 overflow-y-auto">
          {results.map((url, index) => (
            <Pressable
              key={`${url}-${index}`}
              onPress={() => onSelect(url)}
              className="rounded-lg overflow-hidden"
            >
              <Image className="w-full h-16 object-cover"  source={{ uri: url }} accessibilityLabel="gif"/>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

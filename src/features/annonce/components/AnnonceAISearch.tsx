import { Pressable, View, TextInput, Text, Alert } from "react-native";
import { useState } from "react";
import { Search, Camera, Mic, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";

// Remplacement de sonner par l'abstraction native UIService
import { UIService } from "@/core/sdk/ui/UIService";

interface Props {
  onSearch: (query: string | string) => void; // URI ou mot-clé
  onClose?: () => void;
}

export function AnnonceAISearch({ onSearch, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [recording, setRecording] = useState(false);

  // 1. Recherche par image (Appareil photo / Galerie)
  const handleImageSearch = async () => {
    // Demander l'autorisation d'accès aux photos
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission requise",
        "Vous devez autoriser l'accès à vos photos pour rechercher par image.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      onSearch(imageUri);
      UIService.openToast("Recherche par image en cours...", "info");
    }
  };

  // 2. Reconnaissance vocale (Dictée native)
  const handleVoiceSearch = () => {
    Alert.alert(
      "Dictée Vocale",
      "Pour saisir votre recherche à la voix, veuillez utiliser la touche microphone intégrée directement sur votre clavier virtuel iOS ou Android.",
    );
  };

  // 3. Soumission de la recherche textuelle
  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <View className="bg-white/5 rounded-xl p-3 border border-white/10">
      <View className="flex flex-row items-center gap-2">
        <Search size={16} className="text-white/30 flex-shrink-0" />

        <TextInput
          value={query}
          onChangeText={(text) => setQuery(text)}
          placeholder="Rechercher par mot-clé, description..."
          placeholderTextColor="rgba(255, 255, 255, 0.3)"
          className="flex-1 bg-transparent text-white text-sm"
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />

        {query.length > 0 && (
          <Pressable onPress={() => setQuery("")} className="p-1">
            <X size={14} className="text-white/30" />
          </Pressable>
        )}

        <View className="flex flex-row items-center gap-1">
          <Pressable onPress={handleImageSearch} className="p-1.5 rounded-lg">
            <Camera size={16} className="text-white/40" />
          </Pressable>

          <Pressable
            onPress={handleVoiceSearch}
            className={`p-1.5 rounded-lg ${recording ? "bg-red-500/10" : ""}`}
          >
            <Mic
              size={16}
              className={recording ? "text-red-400" : "text-white/40"}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

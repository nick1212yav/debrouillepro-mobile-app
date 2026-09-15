import { Pressable, View, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import { useState, useRef } from "react";
import { Search, Camera, Mic, X } from "lucide-react-native";
import { toast } from "sonner";

interface Props {
  onSearch: (query: string | File) => void;
  onClose?: () => void;
}

export function AnnonceAISearch({ onSearch, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"text" | "image" | "voice">("text");
  const fileInputRef = useRef<TextInput>(null);
  const [recording, setRecording] = useState(false);

  const handleImageUpload = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const file = e.target.files?.[0];
    if (file) {
      onSearch(file);
      toast.info("Recherche par image en cours...");
    }
  };

  const handleVoiceSearch = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("La reconnaissance vocale n'est pas supportée");
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "fr-FR";
    recognition.continuous = false;
    recognition.interimResults = false;
    setRecording(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      onSearch(transcript);
      setRecording(false);
    };
    recognition.onerror = () => {
      setRecording(false);
      toast.error("Erreur de reconnaissance vocale");
    };
    recognition.start();
  };

  const handleSubmit = (e: NativeSyntheticEvent<any>) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <View className="bg-white/5 rounded-xl p-3 border border-white/10">
      <View className="flex items-center gap-2"><Search size={16} className="text-white/30 flex-shrink-0" /><TextInput value={query} onChangeText={(value) => setQuery(value)} placeholder="Rechercher par mot-clé, description..." className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />{query && (
          <Pressable onPress={() => setQuery("")} className="text-white/30 transition-colors">
            <X size={14} />
          </Pressable>
        )}<View className="flex items-center gap-1"><Pressable onPress={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg text-white/40 transition-colors"><Camera size={16} /></Pressable><TextInput ref={fileInputRef}  className="hidden" onChangeText={handleImageUpload} /><Pressable onPress={handleVoiceSearch} className={`p-1.5 rounded-lg transition-colors ${
              recording
                ? "text-red-400 bg-red-500/10"
                : "text-white/40 hover:text-white/60 hover:bg-white/5"
            }`}><Mic size={16} className={recording ? "animate-pulse" : ""} /></Pressable></View></View>
    </View>
  );
}

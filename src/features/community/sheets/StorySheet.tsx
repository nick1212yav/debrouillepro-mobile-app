import { View, Text, Pressable, Image, TextInput, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";

// src/features/community/sheets/StorySheet.tsx
import { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react-native";
import { toast } from "sonner";
import { useCommunityStories } from "../hooks/useCommunityStories";

// Validation locale simplifiée (remplace @/lib/file-utils)
function validateFile(
  file: File,
  options: { maxSize: number; allowedTypes: string[] },
): boolean {
  if (file.size > options.maxSize) return false;
  const isValidType = options.allowedTypes.some((type) => {
    if (type.endsWith("/*")) {
      const prefix = type.replace("/*", "");
      return file.type.startsWith(prefix);
    }
    return file.type === type;
  });
  return isValidType;
}

// Pas de compression pour l'instant (simulation)
// const compressImage = (file: File) => file; // placeholder

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function StorySheet({ isOpen, onClose, onSuccess }: Props) {
  const { createStory } = useCommunityStories();
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<TextInput>(null);

  const handleFileSelect = async (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const valid = validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ["image/*", "video/*"],
    });
    if (!valid) {
      toast.error("Fichier invalide (taille max 10MB)");
      return;
    }

    setIsUploading(true);
    try {
      // Simuler l'upload (ici, on crée une URL locale)
      const url = URL.createObjectURL(file);
      setMediaUrl(url);
      setMediaType(file.type.startsWith("video") ? "video" : "image");
      toast.success("Fichier chargé");
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!mediaUrl) {
      toast.error("Veuillez sélectionner un fichier");
      return;
    }

    setIsSubmitting(true);
    try {
      await createStory({
        mediaUrl,
        mediaType,
        caption: caption.trim() || undefined,
        duration: mediaType === "video" ? 15 : 5,
      });
      toast.success("Story publiée !");
      onClose();
      onSuccess?.();
      setMediaUrl(null);
      setCaption("");
    } catch {
      toast.error("Erreur lors de la publication de la story");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
<View>
      <View initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "rgba(0,0,0,0.7)" }} onPress={(e) => e.target === e.currentTarget && onClose()}>
        <View initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="w-full max-w-lg rounded-t-3xl overflow-hidden" style={{ backgroundColor: "rgba(15,15,30,0.98)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", borderStyle: "solid", maxHeight: "90vh" }}>
          <View className="flex items-center justify-between px-5 py-4 border-b border-white/10"><Text className="text-white font-bold text-lg">Nouvelle story</Text><Pressable onPress={onClose} className="p-1 rounded-full"><X size={20} className="text-white/50" /></Pressable></View>

          <View className="flex-1 overflow-y-auto px-5 pb-5 flex flex-col gap-4" style={{  }}><View className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-white/5 flex items-center justify-center border-2 border-dashed border-white/20 transition-colors" onPress={() => fileInputRef.current?.click()}>{mediaUrl ? (
                <>
                  {mediaType === "image" ? (
                    <Image className="w-full h-full object-cover" source={{ uri: mediaUrl }} accessibilityLabel="Story" />
                  ) : (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      controls={false}
                    />
                  )}
                  <Pressable onPress={(e) => {
                      setMediaUrl(null);
                    }} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full">
                    <X size={16} className="text-white" />
                  </Pressable>
                </>
              ) : (
                <View className="flex flex-col items-center gap-2 text-white/40">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <>
                      <Upload size={32} />
                      <Text className="text-sm">Touchez pour importer</Text>
                      <Text className="text-xs">(image ou vidéo)</Text>
                    </>
                  )}
                </View>
              )}<TextInput ref={fileInputRef} className="hidden" onChangeText={handleFileSelect} /></View><TextInput value={caption} onChangeText={(value) => setCaption(value)} placeholder="Légende (optionnelle)" className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-sm outline-none leading-relaxed" multiline textAlignVertical="top" /></View>

          <View className="px-5 pb-5">
            <Pressable onPress={handleSubmit} disabled={!mediaUrl || isSubmitting || isUploading} className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40" style={{  }}>
              <Text className="text-white">
                {isSubmitting ? "Publication..." : "Publier la story"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

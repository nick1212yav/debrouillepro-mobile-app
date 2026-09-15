import { View, Text, Image, Pressable, TextInput, NativeSyntheticEvent } from "react-native";

// src/features/restauration/create/steps/RestaurantMediaStep.tsx
import { useState, useCallback } from "react";
import { ImagePlus, X, Star, GripVertical } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  data: any;
  onChange: (field: string, value: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function RestaurantMediaStep({ data, onChange, onNext, onBack }: Props) {
  const [images, setImages] = useState<string[]>(data.images || []);
  const [coverIndex, setCoverIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const newImages: string[] = [];
      const remaining = 10 - images.length;

      Array.from(files)
        .slice(0, remaining)
        .forEach((file) => {
          if (!file.type.startsWith("image/")) {
            toast.error(`${file.name} n'est pas une image`);
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`${file.name} dépasse 5 Mo`);
            return;
          }
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              newImages.push(e.target.result as string);
              if (newImages.length === Math.min(files.length, remaining)) {
                const updated = [...images, ...newImages];
                setImages(updated);
                onChange("images", updated);
              }
            }
          };
          reader.readAsDataURL(file);
        });

      if (files.length > remaining) {
        toast.info(`${files.length - remaining} photos ignorées (max 10)`);
      }
    },
    [images, onChange],
  );

  const removeImage = useCallback(
    (index: number) => {
      const updated = images.filter((_, i) => i !== index);
      setImages(updated);
      onChange("images", updated);
      if (coverIndex >= updated.length)
        setCoverIndex(Math.max(0, updated.length - 1));
    },
    [images, onChange, coverIndex],
  );

  const setCover = useCallback((index: number) => {
    setCoverIndex(index);
  }, []);

  const handleDrop = useCallback(
    (e: NativeSyntheticEvent<any>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const isValid = images.length > 0;

  return (
    <View className="space-y-6"><View><View className="flex items-center gap-3 mb-2"><Text className="text-2xl">📸</Text><Text className="text-white font-bold text-lg">Donnez faim avant même la première bouchée
          </Text></View><Text className="text-white/40 text-sm">Ajoutez jusqu'à 10 photos (5 Mo max chacune). Choisissez votre photo
          de couverture.
        </Text></View>{}<View className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? "border-orange-400 bg-orange-500/10"
            : "border-white/10 bg-white/5 hover:border-white/20"
        }`}>{images.length === 0 ? (
          <>
            <ImagePlus size={48} className="mx-auto text-white/20" />
            <Text className="text-white/40 text-sm mt-4">Glissez‑déposez vos photos ici
            </Text>
            <Text className="text-white/20 text-xs">ou cliquez pour choisir</Text>
            <TextInput className="absolute inset-0 opacity-0" onChangeText={(e) => handleFileUpload(e.target.files)} />
          </>
        ) : (
          <View className="gap-2">{images.map((src, i) => (
              <View key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-black/30"><Image className="w-full h-full object-cover" source={{ uri: src }} accessibilityLabel={`Photo ${i + 1}`} /><View className="absolute inset-0 bg-black/50 opacity-0 transition-opacity flex items-center justify-center gap-2"><Pressable onPress={() => setCover(i)} className={`p-1.5 rounded-full ${
                      i === coverIndex
                        ? "bg-yellow-400 text-black"
                        : "bg-white/20 text-white hover:bg-white/30"
                    }`}><Star size={16} /></Pressable><Pressable onPress={() => removeImage(i)} className="p-1.5 rounded-full bg-red-500/80 text-white"><X size={16} /></Pressable></View>{i === coverIndex && (
                  <View className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-yellow-400 text-black text-[10px] font-bold"><Text>COUV.</Text></View>
                )}</View>
            ))}{images.length < 10 && (
              <Text className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center transition-colors"><ImagePlus size={24} className="text-white/30" /><TextInput className="hidden" onChangeText={(e) => handleFileUpload(e.target.files)} /></Text>
            )}</View>
        )}<Text className="text-white/20 text-xs mt-2">{images.length}/ 10 photos
        </Text></View><View className="flex gap-3"><Button onPress={onBack} variant="outline" className="flex-1 h-12 rounded-xl border-white/10 text-white">← Retour
        </Button><Button onPress={onNext} disabled={!isValid} className="flex-1 h-12 rounded-xl bg-orange-600 text-white font-bold">Continuer →
        </Button></View></View>
  );
}

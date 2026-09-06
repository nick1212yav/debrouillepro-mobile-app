import { View, Image, Text, GestureResponderEvent, Pressable } from "react-native";

// src/features/transport/components/detail/TransportGallery.tsx
import { useState } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Luggage,
  Snowflake,
  Wind,
} from "lucide-react-native";

interface GalleryImage {
  url: string;
  label: string;
  category: "exterior" | "interior" | "trunk" | "comfort";
  icon?: React.ReactNode;
}

interface TransportGalleryProps {
  customImages?: GalleryImage[];
}

// Images de démonstration premium par défaut (Mercedes Sprinter VIP / Intérieur premium)
const DEFAULT_IMAGES: GalleryImage[] = [
  {
    url: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80",
    label: "Extérieur Premium",
    category: "exterior",
  },
  {
    url: "https://images.unsplash.com/photo-1624823183493-6c84c48972ca?auto=format&fit=crop&w=800&q=80",
    label: "Salon Cuir VIP",
    category: "interior",
    icon: <Sparkles size={12} className="text-amber-400" />,
  },
  {
    url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80",
    label: "Climatisation Individuelle",
    category: "comfort",
    icon: <Snowflake size={12} className="text-cyan-400" />,
  },
  {
    url: "https://images.unsplash.com/photo-1581553680321-4fffae59fccd?auto=format&fit=crop&w=800&q=80",
    label: "Grand Coffre Bagages",
    category: "trunk",
    icon: <Luggage size={12} className="text-violet-400" />,
  },
];

export function TransportGallery({ customImages }: TransportGalleryProps) {
  const images = customImages || DEFAULT_IMAGES;
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const handlePrev = (e: GestureResponderEvent) => {
    if (activeImageIndex !== null) {
      setActiveImageIndex((prev) =>
        prev !== null && prev > 0 ? prev - 1 : images.length - 1,
      );
    }
  };

  const handleNext = (e: GestureResponderEvent) => {
    if (activeImageIndex !== null) {
      setActiveImageIndex((prev) =>
        prev !== null && prev < images.length - 1 ? prev + 1 : 0,
      );
    }
  };

  return (
    <View className="space-y-3">
      {/* En-tête de section */}
      <View className="flex items-center justify-between">
        <Text className="text-xs font-black text-white/40 uppercase tracking-widest flex items-center gap-1.5">
          <Wind size={12} className="text-violet-400" />
          Inspection du véhicule
        </Text>
        <Text className="text-[11px] text-violet-400 font-medium">
          Photos certifiées DébrouillePro
        </Text>
      </View>

      {/* Grille Asymétrique Premium */}
      <View className="gap-2 h-48">
        {/* Image Principale (Grande) */}
        <Pressable
          onPress={() => setActiveImageIndex(0)}
          className="relative rounded-2xl overflow-hidden border border-white/5"
        >
          <Image
           
           
            className="w-full h-full object-cover"
           source={{ uri: images[0].url }} accessibilityLabel={images[0].label}/>
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <View className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/40 border border-white/5">
            {images[0].icon}
            <Text className="text-[10px] font-bold text-white">
              {images[0].label}
            </Text>
          </View>
        </Pressable>

        {/* Colonne des vignettes de droite */}
        <View className="flex flex-col gap-2">
          {images.slice(1, 4).map((img, index) => (
            <Pressable
              key={img.label}
              onPress={() => setActiveImageIndex(index + 1)}
              className="relative flex-1 rounded-xl overflow-hidden border border-white/5"
            >
              <Image
               
               
                className="w-full h-full object-cover"
               source={{ uri: img.url }} accessibilityLabel={img.label}/>
              <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <View className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/50 border border-white/5">
                {img.icon}
                <Text className="text-[9px] font-bold text-white tracking-tight truncate max-w-[80px]">
                  {img.label}
                </Text>
              </View>

              {/* Indicateur de photos supplémentaires sur la dernière image */}
              {index === 2 && images.length > 4 && (
                <View className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Text className="text-xs font-black text-white">
                    <Text>+</Text>{images.length - 4}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Lightbox Plein Écran */}
      <>
        {activeImageIndex !== null && (
          <Pressable
            onPress={() => setActiveImageIndex(null)}
            className="fixed inset-0 z-50 flex flex-col bg-black/95 justify-between py-12 px-4"
          >
            {/* Header Lightbox */}
            <View className="flex justify-between items-center w-full max-w-md mx-auto z-10">
              <Text className="text-xs font-bold text-white/50">
                {activeImageIndex + 1} <Text>/</Text>{images.length}
              </Text>
              <Pressable
                onPress={() => setActiveImageIndex(null)}
                className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X size={18} className="text-white" />
              </Pressable>
            </View>

            {/* Zone Centrale Image */}
            <View className="relative flex items-center justify-center w-full max-w-xl mx-auto h-[50vh]">
              {/* Bouton Gauche */}
              <Pressable
                onPress={handlePrev}
                className="absolute left-2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
              >
                <ChevronLeft size={20} className="text-white" />
              </Pressable>

              <Image
                key={activeImageIndex}
                src={images[activeImageIndex].url}
                alt={images[activeImageIndex].label}
                className="max-h-full max-w-full rounded-2xl object-contain border border-white/5"
              />

              {/* Bouton Droite */}
              <Pressable
                onPress={handleNext}
                className="absolute right-2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center z-10"
              >
                <ChevronRight size={20} className="text-white" />
              </Pressable>
            </View>

            {/* Footer Lightbox */}
            <View className="text-center max-w-md mx-auto z-10">
              <Text className="text-sm font-bold text-white flex items-center justify-center gap-1.5">
                {images[activeImageIndex].icon}
                {images[activeImageIndex].label}
              </Text>
              <Text className="text-xs text-white/40 mt-1">
                <Text>État vérifié par nos équipes le mois dernier</Text></Text>
            </View>
          </Pressable>
        )}
      </>
    </View>
  );
}

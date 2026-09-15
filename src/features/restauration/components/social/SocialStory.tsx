import { Image, View, Pressable } from "react-native";
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react-native";

interface StorySlide {
  id: string;
  mediaUrl: string;
  type: "image" | "video";
  duration: number; // millisecondes
}

interface SocialStoryProps {
  stories: StorySlide[];
  onClose: () => void;
}

export function SocialStory({ stories, onClose }: SocialStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeStory = stories[activeIndex];

  useEffect(() => {
    if (!activeStory) return;
    const timer = setTimeout(() => {
      handleNext();
    }, activeStory.duration);

    return () => clearTimeout(timer);
  }, [activeIndex, stories]);

  const handleNext = () => {
    if (activeIndex < stories.length - 1) {
      setActiveIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((prev) => prev - 1);
    }
  };

  if (stories.length === 0) return null;

  return (
    <View className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center">{}<View className="absolute top-12 left-4 right-4 flex gap-1 z-30">{stories.map((story, i) => (
          <View key={story.id} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden"><View className={`h-full bg-orange-500 transition-all duration-300 ${
                i < activeIndex
                  ? "w-full"
                  : i === activeIndex
                    ? "w-full" // Une animation de remplissage CSS linéaire plus complexe est possible, simplifiée ici pour la robustesse
                    : "w-0"
              }`} /></View>
        ))}</View>{}<Pressable onPress={onClose} className="absolute top-16 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white z-30"><X size={18} /></Pressable>{}<View className="relative w-full max-w-lg aspect-[9/16] bg-[#020617] flex items-center justify-center overflow-hidden">{}<Pressable onPress={handlePrev} disabled={activeIndex === 0} className="absolute left-0 top-0 bottom-0 w-1/4 z-20" /><Pressable onPress={handleNext} className="absolute right-0 top-0 bottom-0 w-1/4 z-20" /><View><Image key={activeStory.id} src={activeStory.mediaUrl} alt="Active Story Frame" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full object-cover" /></View></View></View>
  );
}

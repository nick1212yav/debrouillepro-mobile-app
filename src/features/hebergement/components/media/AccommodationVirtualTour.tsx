import { View, Text, Image, Pressable } from "react-native";
import React, { useState } from "react";
import { Eye, ChevronRight, ChevronLeft } from "lucide-react-native";

interface AccommodationVirtualTourProps {
  className?: string;
}

export const AccommodationVirtualTour: React.FC<
  AccommodationVirtualTourProps
> = ({ className = "" }) => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      name: "Entrée principale",
      desc: "Seuil lumineux avec vestiaire intégré.",
      img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=500&q=80",
    },
    {
      name: "Salon Panoramic",
      desc: "Grand espace de vie avec vue sur la mer.",
      img: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500&q=80",
    },
    {
      name: "Cuisine équipée",
      desc: "Ustensiles modernes et plan de travail en quartz.",
      img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&q=80",
    },
    {
      name: "Chambre Master Suite",
      desc: "Lit king-size confortable et salle d'eau privée.",
      img: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=500&q=80",
    },
  ];

  const handleNext = () => {
    setActiveStep((prev) => (prev === steps.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev === 0 ? steps.length - 1 : prev - 1));
  };

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 ${className}`}><View className="flex items-center justify-between pb-2 border-b border-white/5"><Text className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><Eye size={14} className="text-indigo-400 shrink-0" /><Text>Visite Virtuelle Interactive</Text></Text><Text className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-lg border border-indigo-500/20">{activeStep + 1}/ {steps.length}</Text></View><View className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center"><Image className="w-full h-full object-cover" source={{ uri: steps[activeStep].img }} accessibilityLabel={steps[activeStep].name} /><View className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" /><Pressable onPress={handlePrev} className="absolute left-2.5 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><ChevronLeft size={16} /></Pressable><Pressable onPress={handleNext} className="absolute right-2.5 w-8 h-8 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"><ChevronRight size={16} /></Pressable><View className="absolute bottom-3 left-3 right-3 flex flex-col gap-0.5"><Text className="text-xs font-bold text-white">{steps[activeStep].name}</Text><Text className="text-[10px] text-white/60 leading-relaxed">{steps[activeStep].desc}</Text></View></View><View className="flex justify-center gap-1.5 py-1">{steps.map((_, i) => (
          <Pressable key={i} onPress={() => setActiveStep(i)} className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
              i === activeStep ? "bg-indigo-500 w-4" : "bg-white/10"
            }`} />
        ))}</View></View>
  );
};

import { View, Text, Pressable, TextInput, Alert, NativeSyntheticEvent, TextInputChangeEventData } from "react-native";
import React, { useState } from "react";
import { Compass, Maximize2, Move, Loader2 } from "lucide-react-native";

interface Accommodation360ViewerProps {
  imageUrl?: string;
  className?: string;
}

export const Accommodation360Viewer: React.FC<Accommodation360ViewerProps> = ({
  imageUrl = "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&q=80",
  className = "",
}) => {
  const [loading] = useState(false);
  const [panX, setPanX] = useState(50);

  const handlePan = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setPanX(Number(e.target.value));
  };

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3.5 ${className}`}><View className="flex items-center justify-between pb-2 border-b border-white/5"><Text className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><Compass size={14} className="text-indigo-400 shrink-0" /><Text>Visite Panorama 360°</Text></Text><Pressable onPress={() => Alert.alert("Plein écran 360° désactivé dans cet aperçu")} className="p-1 rounded-lg text-white/60"><Maximize2 size={12} /></Pressable></View><View className="relative w-full h-[180px] rounded-xl overflow-hidden bg-slate-950 border border-white/5 flex items-center justify-center">{loading ? (
          <Loader2 size={24} className="text-indigo-400 animate-spin" />
        ) : (
          <>
            <View className="absolute inset-y-0 w-[200%] transition-all duration-300 ease-out" style={{  }} />
            <View className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none"><View className="flex flex-col items-center gap-1 text-center text-white/90"><Move size={18} className="text-indigo-400 animate-bounce" /><Text className="text-[10px] font-bold uppercase tracking-wider bg-black/60 px-2 py-0.5 rounded-lg border border-white/5">Glissez pour explorer
                </Text></View></View>
          </>
        )}</View><View className="flex items-center gap-3"><Text className="text-[10px] text-white/30 font-semibold uppercase">Contrôle
        </Text><TextInput value={panX} onChangeText={handlePan} className="flex-1 h-1 bg-white/5 rounded-lg accent-indigo-500" /><Text className="text-[10px] text-white/30 font-semibold uppercase">360°
        </Text></View></View>
  );
};

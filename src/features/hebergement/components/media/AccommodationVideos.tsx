import { View, Text, Pressable, Image, Alert } from "react-native";
import React, { useState } from "react";
import { Play, Pause, Film, Volume2, VolumeX, Maximize2 } from "lucide-react-native";

interface AccommodationVideosProps {
  videoUrl?: string;
  className?: string;
}

export const AccommodationVideos: React.FC<AccommodationVideosProps> = ({
  videoUrl = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
  className = "",
}) => {
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  return (
    <View className={`p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3 ${className}`}><View className="flex items-center justify-between pb-2 border-b border-white/5"><Text className="text-xs font-bold text-white/40 uppercase tracking-wider flex items-center gap-1.5"><Film size={14} className="text-indigo-400 shrink-0" /><Text>Vidéo de Présentation</Text></Text><Pressable onPress={() => Alert.alert("Plein écran vidéo")} className="p-1 rounded-lg text-white/60"><Maximize2 size={12} /></Pressable></View><View className="relative aspect-video w-full rounded-xl overflow-hidden border border-white/5 bg-slate-950 flex items-center justify-center group"><Image className="w-full h-full object-cover opacity-80" source={{ uri: videoUrl }} accessibilityLabel="Video Thumbnail Poster" /><View className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all duration-300"><Pressable onPress={() => setPlaying(!playing)} className="w-12 h-12 rounded-full bg-indigo-500 border border-white/10 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 active:scale-90 transition-all">{playing ? (
              <Pause size={20} className="fill-white" />
            ) : (
              <Play size={20} className="fill-white translate-x-0.5" />
            )}</Pressable></View><View className="absolute bottom-2 left-2 right-2 p-1.5 bg-black/60 backdrop-blur-md rounded-lg border border-white/5 flex items-center justify-between opacity-0 transition-opacity duration-300"><View className="flex items-center gap-2"><Pressable onPress={() => setPlaying(!playing)} className="text-white">{playing ? <Pause size={12} /> : <Play size={12} />}</Pressable><Text className="text-[9px] text-white/60 font-semibold uppercase">{playing ? "Simulation lecture" : "En pause"}</Text></View><Pressable onPress={() => setMuted(!muted)} className="text-white">{muted ? <VolumeX size={12} /> : <Volume2 size={12} />}</Pressable></View></View></View>
  );
};

import { View, Pressable, Text } from "react-native";
import { useState, useRef } from "react";
import { Play, Pause, Volume2, Loader2 } from "lucide-react-native";

interface Props {
  audioUrl: string;
  title: string;
}

export function CommunityAudio({ audioUrl, title }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<unknown | null>(null);

  if (!audioUrl) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const pct =
      (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(pct);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    setIsLoading(false);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2"><View className="flex items-center gap-3"><Pressable onPress={togglePlay} className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-500/20 text-purple-400 transition-colors">{isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}</Pressable><View className="flex-1 min-w-0"><Text className="text-white/80 text-sm truncate">{title}</Text><Text className="text-white/30 text-xs">{duration > 0 ? formatDuration(duration) : "Fichier audio"}</Text></View><Volume2 size={16} className="text-white/20" /></View><View className="h-1.5 rounded-full bg-white/10 overflow-hidden"><View className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${progress}%` }} /></View><audio ref={audioRef} src={audioUrl} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onEnded={handleEnded} /></View>
  );
}

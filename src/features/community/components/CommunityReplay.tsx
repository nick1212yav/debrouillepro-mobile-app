import { View, Text, Pressable, GestureResponderEvent } from "react-native";
import { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Clock } from "lucide-react-native";

interface Props {
  videoUrl: string;
  title: string;
  thumbnail?: string;
  duration: number;
  views: number;
  date: string;
}

export function CommunityReplay({
  videoUrl,
  title,
  thumbnail,
  duration,
  views,
  date,
}: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<unknown | null>(null);

  if (!videoUrl) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct =
      (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleSeek = (e: GestureResponderEvent) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = x * videoRef.current.duration;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="space-y-2"><Text className="text-sm font-medium text-white/50">Replay</Text><View className="relative rounded-2xl overflow-hidden bg-black/30 group">{}<video ref={videoRef} src={videoUrl} poster={thumbnail} className="w-full aspect-video object-cover" muted={isMuted} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />{}{!isPlaying && (
          <Pressable onPress={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors"><View className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-transform"><Play size={32} className="text-white ml-1" /></View></Pressable>
        )}{}<View className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">{}<View className="h-1.5 rounded-full bg-white/20 mb-2" onPress={handleSeek}><View className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${progress}%` }} /></View><View className="flex items-center justify-between"><View className="flex items-center gap-3"><Pressable onPress={togglePlay} className="text-white transition-colors">{isPlaying ? <Pause size={18} /> : <Play size={18} />}</Pressable><Pressable onPress={() => setIsMuted(!isMuted)} className="text-white/60 transition-colors">{isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}</Pressable><Text className="text-white/60 text-xs">{formatTime(currentTime)}/ {formatDuration(duration)}</Text></View><View className="flex items-center gap-3"><Text className="text-white/40 text-xs flex items-center gap-1"><Clock size={12} />{new Date(date).toLocaleDateString()}</Text><Text className="text-white/40 text-xs">{views}vues</Text><Pressable className="text-white/60 transition-colors"><Maximize2 size={16} /></Pressable></View></View></View></View><View><Text className="text-white font-medium text-sm">{title}</Text><Text className="text-white/40 text-xs">Replay du {new Date(date).toLocaleDateString()}· {views}vues
        </Text></View></View>
  );
}

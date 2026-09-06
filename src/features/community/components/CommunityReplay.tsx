import { useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Video, { VideoRef } from "react-native-video";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
} from "lucide-react-native";

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

  const videoRef = useRef<VideoRef>(null);
  const [progressBarWidth, setProgressBarWidth] = useState(0);

  if (!videoUrl) return null;

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (data: { currentTime: number }) => {
    setCurrentTime(data.currentTime);
    if (duration > 0) {
      const pct = (data.currentTime / duration) * 100;
      setProgress(pct);
    }
  };

  const handleSeek = (e: any) => {
    if (!videoRef.current || progressBarWidth === 0) return;
    const touchX = e.nativeEvent.locationX;
    const pct = touchX / progressBarWidth;
    const targetTime = pct * duration;

    // Appel de la méthode native de seek sur le lecteur vidéo
    videoRef.current.seek(targetTime);
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
    <View className="space-y-2">
      <Text className="text-sm font-medium text-white/50">Replay</Text>

      {/* Conteneur du lecteur vidéo */}
      <View className="relative rounded-2xl overflow-hidden bg-black/30 w-full aspect-video">
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          poster={thumbnail}
          posterResizeMode="cover"
          resizeMode="cover"
          paused={!isPlaying}
          muted={isMuted}
          onProgress={handleProgress}
          onEnd={() => setIsPlaying(false)}
          style={StyleSheet.absoluteFill}
        />

        {/* Overlay central (play/pause) */}
        {!isPlaying && (
          <Pressable
            onPress={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <View className="w-16 h-16 rounded-full bg-white/20 backdrop-blur items-center justify-center">
              <Play size={32} className="text-white ml-1" />
            </View>
          </Pressable>
        )}

        {/* Contrôles */}
        <View className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent">
          {/* Barre de progression avec capture de dimension de layout */}
          <Pressable
            onLayout={(e) => setProgressBarWidth(e.nativeEvent.layout.width)}
            onPress={handleSeek}
            className="h-1.5 rounded-full bg-white/20 mb-2 overflow-hidden"
          >
            <View
              className="h-full rounded-full bg-purple-400"
              style={{ width: `${progress}%` }}
            />
          </Pressable>

          <View className="flex flex-row items-center justify-between">
            <View className="flex flex-row items-center gap-3">
              <Pressable onPress={togglePlay}>
                {isPlaying ? (
                  <Pause size={18} className="text-white" />
                ) : (
                  <Play size={18} className="text-white" />
                )}
              </Pressable>

              <Pressable onPress={() => setIsMuted(!isMuted)}>
                {isMuted ? (
                  <VolumeX size={16} className="text-white/60" />
                ) : (
                  <Volume2 size={16} className="text-white/60" />
                )}
              </Pressable>

              <Text className="text-white/60 text-xs">
                {formatTime(currentTime)} / {formatDuration(duration)}
              </Text>
            </View>

            <View className="flex flex-row items-center gap-3">
              <Text className="text-white/40 text-xs flex flex-row items-center gap-1">
                <Clock size={12} className="text-white/40 mr-1" />
                {new Date(date).toLocaleDateString()}
              </Text>

              <Text className="text-white/40 text-xs">{views} vues</Text>

              <Pressable>
                <Maximize2 size={16} className="text-white/60" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      <View>
        <Text className="text-white font-medium text-sm">{title}</Text>
        <Text className="text-white/40 text-xs mt-1">
          Replay du {new Date(date).toLocaleDateString()} · {views} vues
        </Text>
      </View>
    </View>
  );
}

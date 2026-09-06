import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";
import { Play, X } from "lucide-react-native";

interface Props {
  videos: string[];
  title: string;
}

export function PropertyVideos({ videos, title }: Props) {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  if (!videos || videos.length === 0) return null;

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const getEmbedUrl = (url: string) => {
    const id = extractYouTubeId(url);
    if (id) return `https://www.youtube.com/embed/${id}`;
    return url;
  };

  return (
    <>
      <View className="gap-2 mt-3">
        {videos.slice(0, 4).map((video, index) => {
          const isYouTube =
            video.includes("youtube") || video.includes("youtu.be");
          return (
            <Pressable
              key={index}
              className="relative rounded-xl overflow-hidden h-32 group"
              onPress={() => setSelectedVideo(video)}
            >
              {isYouTube ? (
                <Image
                 
                 
                  className="w-full h-full object-cover"
                 source={{ uri: `https://img.youtube.com/vi/${extractYouTubeId(video)}/mqdefault.jpg` }} accessibilityLabel={`Vidéo ${index + 1}`}/>
              ) : (
                <View className="w-full h-full flex items-center justify-center bg-white/5">
                  <Text className="text-white/20 text-xs">Vidéo</Text>
                </View>
              )}
              <View className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={24} className="text-white/80" />
              </View>
            </Pressable>
          );
        })}
      </View>

      <>
        {selectedVideo && (
          <>
            <Pressable
              onPress={() => setSelectedVideo(null)}
              className="fixed inset-0 z-50 bg-black/95"
            />
            <View
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <Pressable
                onPress={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 text-white/70 z-10"
              >
                <X size={24} />
              </Pressable>
              <View className="relative w-full max-w-3xl aspect-video">
                <View
                  src={getEmbedUrl(selectedVideo)}
                  title={title}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </View>
            </View>
          </>
        )}
      </>
    </>
  );
}

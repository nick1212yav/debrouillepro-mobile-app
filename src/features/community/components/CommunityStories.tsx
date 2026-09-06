import { View, Text, Pressable, Image } from "react-native";
import { useState, useRef, useEffect } from "react";
import { X, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react-native";
import type { CommunityStory } from "../types";

interface Props {
  stories: CommunityStory[];
  onClose?: () => void;
}

export function CommunityStories({ stories, onClose }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const validStories = stories?.filter((s) => s && s.mediaUrl) || [];

  if (validStories.length === 0) return null;

  const currentStory = validStories[currentIndex];
  const isVideo = currentStory?.mediaType === "video";
  const duration = currentStory?.duration || 5; // secondes par défaut

  // Gestion de la progression
  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsPlaying(true);
      return;
    }

    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }

    if (isPlaying && progress < 100) {
      const step = 100 / (duration * 10);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            if (currentIndex < validStories.length - 1) {
              setCurrentIndex(currentIndex + 1);
              return 0;
            } else {
              handleClose();
              return 100;
            }
          }
          return prev + step;
        });
      }, 100);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [isOpen, isPlaying, progress, currentIndex, duration]);

  const handleOpen = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    setIsPlaying(true);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setProgress(0);
    onClose?.();
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const goToNext = () => {
    if (currentIndex < validStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      handleClose();
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <>
      {/* Miniatures des stories */}
      <View className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {validStories.map((story, idx) => (
          <Pressable
            key={story._id}
            onPress={() => handleOpen(idx)}
            className="flex-shrink-0 flex flex-col items-center gap-1 group"
          >
            <View className="relative">
              <View
                className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-br from-purple-500 to-orange-400"
                style={{  }}
              >
                <View className="w-full h-full rounded-full overflow-hidden bg-black/50">
                  {story.mediaType === "image" ? (
                    <Image
                     
                     
                      className="w-full h-full object-cover"
                     source={{ uri: story.mediaUrl }} accessibilityLabel={story.authorName || "Story"}/>
                  ) : (
                    <View className="w-full h-full flex items-center justify-center bg-white/10">
                      <Play size={20} className="text-white/60" />
                    </View>
                  )}
                </View>
              </View>
              {story.isHighlight && (
                <Text className="absolute -bottom-0.5 -right-0.5 text-[10px]">
                  ⭐
                </Text>
              )}
            </View>
            <Text className="text-[9px] text-white/50 truncate max-w-16">
              {story.authorName || "Story"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Modal de visualisation */}
      <>
        {isOpen && currentStory && (
          <Pressable
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onPress={handleClose}
          >
            <Pressable
              className="relative w-full max-w-md aspect-[9/16] rounded-2xl overflow-hidden bg-black"
              onPress={(e) => e.stopPropagation()}
            >
              {/* Barres de progression */}
              <View className="absolute top-2 left-2 right-2 flex gap-1 z-10">
                {validStories.map((_, idx) => (
                  <View
                    key={idx}
                    className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden"
                  >
                    <View
                      className="h-full bg-white"
                      style={{
                        width:
                          idx < currentIndex
                            ? "100%"
                            : idx === currentIndex
                              ? `${progress}%`
                              : "0%",
                      }}
                    />
                  </View>
                ))}
              </View>

              {/* Auteur */}
              <View className="absolute top-4 left-4 right-16 flex items-center gap-2 z-10">
                <View className="w-8 h-8 rounded-full overflow-hidden bg-black/50">
                  {currentStory.authorAvatar ? (
                    <Image
                     
                     
                      className="w-full h-full object-cover"
                     source={{ uri: currentStory.authorAvatar }} accessibilityLabel={currentStory.authorName}/>
                  ) : (
                    <View className="w-full h-full flex items-center justify-center">
                      <Text className="text-white/60 text-xs">
                        {(currentStory.authorName || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-white text-sm font-medium truncate">
                  {currentStory.authorName || "Anonyme"}
                </Text>
                {currentStory.isHighlight && (
                  <Text className="text-[10px] text-yellow-400"><Text>⭐</Text></Text>
                )}
              </View>

              {/* Bouton fermer */}
              <Pressable
                onPress={handleClose}
                className="absolute top-4 right-4 text-white/70 z-10"
              >
                <X size={20} />
              </Pressable>

              {/* Média */}
              <View className="w-full h-full">
                {currentStory.mediaType === "image" ? (
                  <Image
                   
                   
                    className="w-full h-full object-contain"
                   source={{ uri: currentStory.mediaUrl }} accessibilityLabel={currentStory.caption || "Story"}/>
                ) : (
                  <View
                    src={currentStory.mediaUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                    onEnded={goToNext}
                  />
                )}
              </View>

              {/* Légende */}
              {currentStory.caption && (
                <View className="absolute bottom-4 left-4 right-4 z-10">
                  <Text className="text-white/80 text-sm bg-black/50 p-2 rounded-xl">
                    {currentStory.caption}
                  </Text>
                </View>
              )}

              {/* Contrôles (tap zones) */}
              <View
                className="absolute inset-0 flex items-center z-10"
                style={{  }}
              >
                <Pressable
                  onPress={(e) => {
                    goToPrevious();
                  }}
                  className="w-1/3 h-full flex items-center justify-center"
                  style={{ opacity: currentIndex > 0 ? 1 : 0 }}
                >
                  <ChevronLeft size={32} className="text-white/40" />
                </Pressable>
                <Pressable
                  className="w-1/3 h-full"
                  onPress={togglePlay}
                />
                <Pressable
                  onPress={(e) => {
                    goToNext();
                  }}
                  className="w-1/3 h-full flex items-center justify-center"
                >
                  <ChevronRight size={32} className="text-white/40" />
                </Pressable>
              </View>

              {/* Temps restant */}
              <View className="absolute bottom-16 right-4 z-10 text-white/30 text-xs bg-black/50 px-2 py-1 rounded-lg">
                {isPlaying ? "▶" : "⏸"}{" "}
                {Math.ceil(((100 - progress) / 100) * duration)}s
              </View>
            </Pressable>
          </Pressable>
        )}
      </>
    </>
  );
}

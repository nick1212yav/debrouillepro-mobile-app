import { View, Text, TextInput } from "react-native";

// src/features/marketplace/create/MediaSection.tsx
import { Video } from "lucide-react-native";
import { MediaUploader } from "./shared";

interface Props {
  images: string[];
  setImages: (images: string[]) => void;
  videos: string[];
  setVideos: (videos: string[]) => void;
}

export function MediaSection({ images, setImages, videos, setVideos }: Props) {
  return (
    <View className="pt-2 space-y-4"><MediaUploader images={images} onChange={setImages} label="Images du produit" maxFiles={10} /><View className="space-y-1"><Text className="text-xs text-white/60 font-medium">Vidéos (URLs)
        </Text><View className="rounded-2xl p-3.5" style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}><View className="flex items-center gap-2.5"><Video size={14} className="text-white/40 flex-shrink-0" /><TextInput value={videos.join(", ")} onChangeText={(value) =>
                setVideos(
                  value
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean),
                )} placeholder="URLs vidéo (séparées par des virgules)" className="flex-1 bg-transparent text-white text-sm placeholder-white/25 outline-none" /></View></View><Text className="text-[10px] text-white/30">YouTube, Vimeo, ou liens directs
        </Text></View></View>
  );
}

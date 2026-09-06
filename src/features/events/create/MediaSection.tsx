import { View, TextInput } from "react-native";
import { Video } from "lucide-react-native";
import ImageUploader from "@/components/ImageUploader";

interface Props {
  images: string[];
  setImages: (images: string[]) => void;
  videos: string[];
  setVideos: (videos: string[]) => void;
  color: string;
}

export function MediaSection({
  images,
  setImages,
  videos,
  setVideos,
  color,
}: Props) {
  return (
    <View className="pt-2">
      <ImageUploader
        images={images}
        onChange={setImages}
        color={color}
        label="Images"
      />

      <View
        className="rounded-2xl p-3.5 mb-2"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", borderStyle: "solid" }}
      >
        <View className="flex items-center gap-2.5">
          <Video size={14} style={{ color }} />
          <TextInput
            value={videos.join(", ")}
            onChangeText={(text) =>
              setVideos(
                text
                  .split(",")
                  .map((v) => v.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Vidéos (URLs séparées par des virgules)"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/25"
          />
        </View>
      </View>
    </View>
  );
}

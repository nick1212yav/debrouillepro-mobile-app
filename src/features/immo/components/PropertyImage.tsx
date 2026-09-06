import { Text, View } from "react-native";
import { PropertyGallery } from "./PropertyGallery";

interface Props {
  images: string[];
  title: string;
}

export function PropertyImage({ images, title }: Props) {
  if (!images || images.length === 0) {
    return (
      <View
        className="w-full h-48 rounded-2xl flex items-center justify-center mt-3"
        style={{ borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderStyle: "solid" }}
      >
        <Text className="text-white/20 text-sm">🏠</Text>
      </View>
    );
  }

  return <PropertyGallery images={images} title={title} />;
}
